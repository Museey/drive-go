// The nightly copy of the whole database kept outside DigitalOcean (security review 2026-11-23,
// docs/SECURITY-AUDIT-2026-11.md ก6; docs/RESTORE-DRILL.md). DigitalOcean's own backups (7 days, same account and
// region) and the app's backup points (same database) are lost with the account; this one is not.
//
//   dump      every table's rows as lines "<table>\t<row as JSON>" (json columns as their text, so a shop's data
//             comes back byte for byte), shop by shop where Row-Level Security asks for it (the owner is not beyond
//             it on DigitalOcean), all in one snapshot; sessions and errors are left out (signed in again; 30 days)
//   seal      gzip, then AES-256-GCM with a key of its own, that key sealed with the team's RSA public key: the
//             server can make a copy but not read one; only the private key the owner keeps opens it
//   upload    one PUT to an S3-compatible bucket (Backblaze B2, Google Cloud Storage, …) signed with AWS Signature V4
//   restore   into a database the schema was made in (migrate): the rows back, table by table in the order of their
//             foreign keys, shop by shop, and the identity counters after the largest id
import { createCipheriv, createDecipheriv, createHash, createHmac, publicEncrypt, privateDecrypt, randomBytes, constants } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { open } from 'node:fs/promises';
import { StringDecoder } from 'node:string_decoder';
import { createGunzip, createGzip } from 'node:zlib';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type pg from 'pg';

export const SKIP_TABLES = new Set(['sessions', 'staff_sessions', 'errors', 'schema_migrations']);
const MAGIC = 'DGBK1\n';
const NO_SHOP = '00000000-0000-0000-0000-000000000000';

interface Column { name: string; type: string; json: boolean }
interface Table { name: string; perShop: boolean; identity: string[]; bytes: boolean; columns: Column[] }

// The tables to copy, parents before children (foreign keys), with their columns (not the generated ones).
export async function tablesOf(db: pg.Pool | pg.ClientBase): Promise<Table[]> {
  const { rows: cols } = await db.query<{ tbl: string; col: string; type: string; identity: boolean }>(
    `select c.relname as tbl, a.attname as col, format_type(a.atttypid, a.atttypmod) as type, a.attidentity in ('a', 'd') as identity
       from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p') and a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
      order by c.relname, a.attnum`);
  const { rows: fk } = await db.query<{ child: string; parent: string }>(
    `select c.relname as child, p.relname as parent from pg_constraint k
       join pg_class c on c.oid = k.conrelid join pg_class p on p.oid = k.confrelid
       join pg_namespace n on n.oid = c.relnamespace where k.contype = 'f' and n.nspname = 'public'`);
  const names = [...new Set(cols.map(r => r.tbl))].filter(n => !SKIP_TABLES.has(n));
  const parents = new Map(names.map(n => [n, fk.filter(f => f.child === n && f.parent !== n).map(f => f.parent)]));
  const out: string[] = [], done = new Set<string>();
  const visit = (n: string, path: Set<string>) => {
    if (done.has(n) || path.has(n) || !parents.has(n)) return;
    path.add(n);
    for (const p of parents.get(n)!) visit(p, path);
    done.add(n); out.push(n);
  };
  for (const n of names) visit(n, new Set());
  return out.map(name => {
    const mine = cols.filter(x => x.tbl === name);
    return { name, perShop: mine.some(x => x.col === 'shop_id'), bytes: mine.some(x => x.type === 'bytea'),
      identity: mine.filter(x => x.identity).map(x => x.col),
      columns: mine.map(x => ({ name: x.col, type: x.type, json: x.type === 'json' || x.type === 'jsonb' })) };
  });
}

const q = (name: string) => `"${name.replace(/"/g, '""')}"`;
const asShop = (c: pg.ClientBase, shop: string) =>
  c.query("select set_config('app.shop_id', $1, true), set_config('app.branch_scope', '*', true)", [shop]);

export interface Head { at: string; migrations: string[]; tables: string[] }

// Every row, as lines given to `write` (awaited, so a slow writer holds the dump back): first a head line, then
// "<table>\t<row as JSON>". One read-only transaction (repeatable read), so the copy is of one moment even while
// garages save; Row-Level Security is met by naming each shop in turn within it.
export async function dump(db: pg.Pool, write: (line: string) => Promise<void> | void): Promise<{ tables: number; rows: number }> {
  const c = await db.connect();
  let rows = 0;
  try {
    await c.query('begin isolation level repeatable read read only');
    const tables = await tablesOf(c);
    const shops = (await c.query<{ id: string }>('select id from shops order by code')).rows.map(r => r.id);
    const migrations = (await c.query<{ name: string }>('select name from schema_migrations order by name')).rows.map(r => r.name);
    const head: Head = { at: new Date().toISOString(), migrations, tables: tables.map(t => t.name) };
    await write(MAGIC.trim() + ' ' + JSON.stringify(head));
    const copy = async (t: Table, where: string, params: unknown[]) => {
      // Attachments and backup points are large rows: a few at a time.
      const n = t.bytes ? 4 : 500;
      const list = t.columns.map(k => (k.json ? `${q(k.name)}::text as ${q(k.name)}` : q(k.name))).join(', ');
      await c.query(`declare rows_out no scroll cursor for select row_to_json(x)::text as r from (select ${list} from ${q(t.name)} ${where}) x`, params);
      for (;;) {
        const { rows: got } = await c.query<{ r: string }>(`fetch ${n} from rows_out`);
        for (const g of got) { await write(`${t.name}\t${g.r}`); rows++; }
        if (got.length < n) break;
      }
      await c.query('close rows_out');
    };
    for (const t of tables) {
      await asShop(c, NO_SHOP);
      if (!t.perShop) { await copy(t, '', []); continue; }
      await copy(t, 'where shop_id is null', []);
      for (const s of shops) { await asShop(c, s); await copy(t, 'where shop_id = $1', [s]); }
    }
    await c.query('commit');
    return { tables: tables.length, rows };
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

// Lines back into a database whose schema was made (migrate, the same steps as the copy's) and that holds no shop
// yet, in one transaction: all of it or nothing.
export async function restore(db: pg.Pool, lines: AsyncIterable<string>): Promise<{ rows: number; head: Head }> {
  const c = await db.connect();
  try {
    await c.query('begin');
    const tables = new Map((await tablesOf(c)).map(t => [t.name, t]));
    if ((await c.query('select 1 from shops limit 1')).rowCount) throw new Error('this database holds shops already: restore into an empty one');
    const have = (await c.query<{ name: string }>('select name from schema_migrations order by name')).rows.map(r => r.name);
    const maxId = new Map<string, number>();
    let batch: string[] = [], size = 0, at = '', rows = 0, head: Head | null = null;
    const flush = async () => {
      if (!batch.length) return;
      const [name, shop] = at.split('|');
      await asShop(c, shop || NO_SHOP);
      const t = tables.get(name)!;
      const cols = t.columns.map(k => q(k.name)).join(', ');
      const values = t.columns.map(k => (k.json ? `${q(k.name)}::${k.type}` : q(k.name))).join(', ');
      const shape = t.columns.map(k => `${q(k.name)} ${k.json ? 'text' : k.type}`).join(', ');
      await c.query(`insert into ${q(name)} (${cols}) ${t.identity.length ? 'overriding system value ' : ''}` +
        `select ${values} from json_to_recordset($1::json) as x(${shape})`, [`[${batch.join(',')}]`]);
      batch = []; size = 0;
    };
    for await (const line of lines) {
      if (!head) {
        if (!line.startsWith(MAGIC.trim() + ' ')) throw new Error('not a DriveGo copy');
        head = JSON.parse(line.slice(MAGIC.length)) as Head;
        if (JSON.stringify(head.migrations) !== JSON.stringify(have))
          throw new Error(`the schema differs: the copy has ${head.migrations.at(-1)}, this database ${have.at(-1)} (migrate the same version)`);
        continue;
      }
      if (!line) continue;
      const tab = line.indexOf('\t');
      const name = line.slice(0, tab), row = line.slice(tab + 1);
      const t = tables.get(name);
      if (!t) throw new Error(`a table this database does not have: ${name}`);
      const v = JSON.parse(row) as Record<string, unknown>;
      const key = `${name}|${t.perShop && typeof v.shop_id === 'string' ? v.shop_id : ''}`;
      if (key !== at || batch.length >= 500 || size > 16 * 1024 * 1024) { await flush(); at = key; }
      batch.push(row); size += row.length;
      for (const col of t.identity) {
        const n = Number(v[col]);
        if (Number.isFinite(n)) maxId.set(`${name}.${col}`, Math.max(maxId.get(`${name}.${col}`) ?? 0, n));
      }
      rows++;
    }
    if (!head) throw new Error('an empty copy');
    await flush();
    for (const [k, n] of maxId) {
      const [name, col] = k.split('.');
      await c.query('select setval(pg_get_serial_sequence($1, $2), $3, true)', [q(name), col, n]);
    }
    await c.query('commit');
    return { rows, head };
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

// ---------- sealing ----------
// The PEM of a key from an environment variable: the PEM itself, or base64 of it (one line, easier to paste).
export function pemOf(text: string): string {
  const t = text.trim();
  return t.startsWith('-----') ? t : Buffer.from(t, 'base64').toString('utf8');
}

// The head of a sealed copy: MAGIC, then one line of JSON with the sealed key and the IV.
export function sealer(publicKeyPem: string) {
  const key = randomBytes(32), iv = randomBytes(12);
  const sealed = publicEncrypt({ key: pemOf(publicKeyPem), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key);
  const head = Buffer.from(MAGIC + JSON.stringify({ alg: 'RSA-OAEP-256+A256GCM+gzip', key: sealed.toString('base64'), iv: iv.toString('base64') }) + '\n');
  return { head, cipher: createCipheriv('aes-256-gcm', key, iv) };
}

// The whole database into a sealed file at `path`: dump → gzip → AES-256-GCM, the tag last. Returns its size and SHA-256
// (for the upload's signature).
export async function makeCopy(db: pg.Pool, publicKeyPem: string, path: string): Promise<{ size: number; sha256: string; tables: number; rows: number }> {
  const { head, cipher } = sealer(publicKeyPem);
  const out = createWriteStream(path);
  const hash = createHash('sha256');
  let size = 0;
  const put = (b: Buffer) => new Promise<void>((resolve, reject) => {
    if (!b.length) return resolve();
    hash.update(b); size += b.length;
    out.write(b, e => (e ? reject(e) : resolve()));
  });
  await put(head);
  const gz = createGzip({ level: 6 });
  const sealed = (async () => {
    for await (const chunk of gz) await put(cipher.update(chunk as Buffer));
    await put(cipher.final());
    await put(cipher.getAuthTag());
  })();
  const write = (line: string) => new Promise<void>(resolve => { if (gz.write(line + '\n')) resolve(); else gz.once('drain', resolve); });
  let n: { tables: number; rows: number };
  try {
    n = await dump(db, write);
  } catch (e) {
    gz.destroy();
    await sealed.catch(() => {});
    out.destroy();
    throw e;
  }
  gz.end();
  await sealed;
  await new Promise<void>((resolve, reject) => out.end((e?: Error | null) => (e ? reject(e) : resolve())));
  return { size, sha256: hash.digest('hex'), ...n };
}

// The lines of a sealed copy, opened with the private key (streamed). A copy that was changed or cut fails at its
// end (GCM tag): restore() runs in one transaction, so nothing of it stays.
export async function* openCopy(path: string, privateKeyPem: string, passphrase?: string): AsyncGenerator<string> {
  const f = await open(path, 'r');
  let headLen: number, size: number, tag: Buffer, key: Buffer, iv: Buffer;
  try {
    size = (await f.stat()).size;
    const first = Buffer.alloc(Math.min(size, 4096));
    await f.read(first, 0, first.length, 0);
    if (first.subarray(0, MAGIC.length).toString() !== MAGIC) throw new Error('not a sealed DriveGo copy');
    const nl = first.indexOf(0x0a, MAGIC.length);
    if (nl < 0 || size < nl + 1 + 16) throw new Error('not a sealed DriveGo copy');
    const h = JSON.parse(first.subarray(MAGIC.length, nl).toString()) as { key: string; iv: string };
    key = privateDecrypt({ key: pemOf(privateKeyPem), passphrase, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(h.key, 'base64'));
    iv = Buffer.from(h.iv, 'base64');
    headLen = nl + 1;
    tag = Buffer.alloc(16);
    await f.read(tag, 0, 16, size - 16);
  } finally {
    await f.close();
  }
  const d = createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  const gunzip = createGunzip();
  const body = createReadStream(path, { start: headLen, end: size - 17 });
  const plain = body.pipe(d).pipe(gunzip);
  body.on('error', e => gunzip.destroy(e));
  d.on('error', e => gunzip.destroy(e));
  // Lines by hand: a stream's async iterator throws what destroyed it (a wrong tag), readline's may not.
  const text = new StringDecoder('utf8');
  let rest = '';
  for await (const chunk of plain) {
    const from = rest.length;
    rest += text.write(chunk as Buffer);
    let i = rest.indexOf('\n', from), at = 0;   // a long row (a backup point) spans many chunks: look in the new part only
    while (i >= 0) { yield rest.slice(at, i); at = i + 1; i = rest.indexOf('\n', at); }
    if (at) rest = rest.slice(at);
  }
  rest += text.end();
  if (rest) yield rest;
}

// ---------- S3-compatible upload (AWS Signature Version 4) ----------
export interface Bucket { endpoint: string; region: string; bucket: string; keyId: string; secret: string }
const hex = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const hmac = (k: Buffer | string, s: string) => createHmac('sha256', k).update(s).digest();
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

// The Authorization header of a request (path-style: /<bucket>/<object>). headers: lower-case names, with host and
// x-amz-date and x-amz-content-sha256.
export function signV4(o: { method: string; path: string; headers: Record<string, string>; payloadHash: string; region: string; keyId: string; secret: string }): string {
  const date = o.headers['x-amz-date'], day = date.slice(0, 8);
  const names = Object.keys(o.headers).map(h => h.toLowerCase()).sort();
  const canonical = [o.method, o.path.split('/').map(enc).join('/'), '',
    names.map(h => `${h}:${String(o.headers[h]).trim().replace(/\s+/g, ' ')}\n`).join(''), names.join(';'), o.payloadHash].join('\n');
  const scope = `${day}/${o.region}/s3/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', date, scope, hex(canonical)].join('\n');
  const k = hmac(hmac(hmac(hmac(`AWS4${o.secret}`, day), o.region), 's3'), 'aws4_request');
  return `AWS4-HMAC-SHA256 Credential=${o.keyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${createHmac('sha256', k).update(toSign).digest('hex')}`;
}

// One PUT of a file (streamed: copies may be larger than the job's memory) whose SHA-256 is known.
export function upload(b: Bucket, object: string, file: { path: string; size: number; sha256: string }, now = new Date()): Promise<void> {
  const url = new URL(`${b.endpoint.replace(/\/+$/, '')}/${b.bucket}/${object}`);
  const date = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const headers: Record<string, string> = { host: url.host, 'x-amz-date': date, 'x-amz-content-sha256': file.sha256,
    'content-type': 'application/octet-stream', 'content-length': String(file.size) };
  const authorization = signV4({ method: 'PUT', path: url.pathname, headers, payloadHash: file.sha256, region: b.region, keyId: b.keyId, secret: b.secret });
  const send = url.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const req = send(url, { method: 'PUT', headers: { ...headers, authorization } }, res => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', d => { if (text.length < 2000) text += d; });
      res.on('end', () => (res.statusCode && res.statusCode < 300 ? resolve() : reject(new Error(`upload refused: ${res.statusCode} ${text.slice(0, 300)}`))));
    });
    req.on('error', reject);
    createReadStream(file.path).on('error', reject).pipe(req);
  });
}
