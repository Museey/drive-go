// Attachments kept apart from the shop's data (task 3.11, decision R19-ค):
// uploads with their limits and the shop's space, serving, which rows and
// backup points refer to which file, deletion 30 days after the last
// reference goes, and the safety net that keeps files out of saves. Runs
// inside withShop(): Row-Level Security limits every query to the session's
// shop and branch scope (0004_files.sql), and each query names the shop too.
import type pg from 'pg';
import { createHash } from 'node:crypto';
import { FILE_PATH, INLINE_UNITS, QUOTA, type Use, dataUrlsIn, limitOf, linkOf, linksIn, mightHoldDataUrl, parseDataUrl, replaceStrings, useOf } from './attachments.ts';
import type { Changes, Row } from './units.ts';

export const KEEP_DAYS = 30;                 // a deleted file can be restored this long (R19-ค)
const ORPHAN_HOURS = 24;                     // an upload no save ever referred to
export const MAX_SAVE_BYTES = 30 * 1024 * 1024;   // one request of /api/storage (below Cloud Run's 32 MiB)

// Where the bytes are. Only PostgreSQL today (file_bytes): development,
// tests and the pilot. It has to be chosen on purpose (FILE_STORE=postgres)
// when the server runs in production, so that it never becomes the
// production file store by default; an S3-compatible store comes with the
// provider (task 3.16, docs/HOSTING.md).
export interface FileStore {
  put(c: pg.ClientBase, branch: string, id: string, bytes: Buffer): Promise<void>;
  // range: [first byte, length]
  get(c: pg.ClientBase, branch: string, id: string, range?: [number, number]): Promise<Buffer | null>;
  // After files rows are removed (the PostgreSQL store's bytes go with them).
  removed(c: pg.ClientBase, files: { branch: string; id: string }[]): Promise<void>;
}

const postgresStore: FileStore = {
  async put(c, branch, id, bytes) {
    await c.query('insert into file_bytes (shop_id, branch_id, id, data) values (app_shop(), $1, $2, $3) on conflict do nothing', [branch, id, bytes]);
  },
  async get(c, branch, id, range) {
    const { rows } = await c.query<{ data: Buffer }>(range
      ? 'select substring(data from $3 for $4) as data from file_bytes where shop_id = app_shop() and branch_id = $1 and id = $2'
      : 'select data from file_bytes where shop_id = app_shop() and branch_id = $1 and id = $2',
    range ? [branch, id, range[0] + 1, range[1]] : [branch, id]);
    return rows.length ? rows[0].data : null;
  },
  async removed() {},
};

export function fileStore(): FileStore {
  const kind = process.env.FILE_STORE ?? (process.env.NODE_ENV === 'production' ? '' : 'postgres');
  if (kind === 'postgres') return postgresStore;
  throw new Error(kind ? `FILE_STORE=${kind} is not supported yet (task 3.16)` : 'FILE_STORE is not set: choose where attachments are kept (FILE_STORE=postgres)');
}

export const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const cleanMime = (m: string) => (/^[\w.+-]+\/[\w.+-]+$/.test(m) ? m.toLowerCase() : 'application/octet-stream');

// Space a shop (Biz, ProX) or a franchise branch uses: its files that the data still refers to, or that were just uploaded.
export async function usage(c: pg.ClientBase, branch: string): Promise<{ used: number; quota: number }> {
  const { rows } = await c.query<{ used: string }>(
    'select coalesce(sum(size), 0)::text as used from files where shop_id = app_shop() and branch_id = $1 and deleted_at is null', [branch]);
  return { used: Number(rows[0].used), quota: QUOTA };
}

export type Stored = { ok: true; id: string; url: string; used: number; quota: number } | { ok: false; error: 'too-large' | 'quota'; limit: number };

// Keeps a file for a branch. The same bytes are kept once (the id is their
// SHA-256): uploading them again costs no space. Files over the size limit are
// refused (11.4); so is anything but accounting evidence once the space is used
// up (11.2). Uploads of one branch wait for each other, so two of them cannot
// both take the last of the space.
export async function storeFile(c: pg.ClientBase, branch: string,
  f: { bytes: Buffer; mime: string; name?: string; use: Use; userId?: string | null }): Promise<Stored> {
  const mime = cleanMime(f.mime);
  if (f.bytes.length > limitOf(mime)) return { ok: false, error: 'too-large', limit: limitOf(mime) };
  const id = sha256(f.bytes);
  await c.query("select pg_advisory_xact_lock(hashtextextended(app_shop()::text || '|files|' || $1, 0))", [branch]);
  await purgeFiles(c, branch);
  const { rows } = await c.query<{ deleted: boolean }>(
    'select deleted_at is not null as deleted from files where shop_id = app_shop() and branch_id = $1 and id = $2', [branch, id]);
  const u = await usage(c, branch);
  if (rows.length && !rows[0].deleted) return { ok: true, id, url: linkOf(id), ...u };
  if (f.use !== 'evidence' && u.used + f.bytes.length > QUOTA) return { ok: false, error: 'quota', limit: QUOTA };
  if (rows.length) {
    // Deleted, waiting out its 30 days (or kept for a backup point): it is in use again.
    await c.query('update files set deleted_at = null, created_at = now() where shop_id = app_shop() and branch_id = $1 and id = $2', [branch, id]);
  } else {
    await c.query(
      `insert into files (shop_id, branch_id, id, mime, size, name, use, created_by) values (app_shop(), $1, $2, $3, $4, $5, $6, $7)`,
      [branch, id, mime, f.bytes.length, (f.name || '').slice(0, 200), f.use, f.userId ?? null]);
    await fileStore().put(c, branch, id, f.bytes);
  }
  return { ok: true, id, url: linkOf(id), used: u.used + f.bytes.length, quota: QUOTA };
}

// A file the session's branch scope reaches (HQ: any branch), unless deleted.
export async function findFile(c: pg.ClientBase, id: string) {
  if (!/^[0-9a-f]{64}$/.test(id)) return null;
  const { rows } = await c.query<{ branch_id: string; mime: string; size: string; name: string }>(
    `select branch_id, mime, size::text as size, name from files
      where shop_id = app_shop() and id = $1 and deleted_at is null order by branch_id limit 1`, [id]);
  return rows.length ? { branch: rows[0].branch_id, mime: rows[0].mime, size: Number(rows[0].size), name: rows[0].name } : null;
}

// Rows a save wrote or removed (data before and after; null = none): the files
// they refer to are kept up to date. A file the data no longer refers to is
// deleted (and can be restored for 30 days); one it refers to again is not.
export async function syncRefs(c: pg.ClientBase, branch: string, rows: { unit: string; key: string; before?: string | null; after?: string | null }[]): Promise<void> {
  const touched = rows.filter(r => r.before?.includes(FILE_PATH) || r.after?.includes(FILE_PATH));
  if (!touched.length) return;
  const lost = (await c.query<{ file_id: string }>(
    `delete from file_refs r using unnest($2::text[], $3::text[]) as t(unit, key)
      where r.shop_id = app_shop() and r.branch_id = $1 and r.unit = t.unit and r.key = t.key returning r.file_id`,
    [branch, touched.map(r => r.unit), touched.map(r => r.key)])).rows.map(r => r.file_id);
  const refs = touched.flatMap(r => (r.after ? linksIn(r.after) : []).map(id => [id, r.unit, r.key]));
  if (refs.length) {
    await c.query(
      `insert into file_refs (shop_id, branch_id, file_id, unit, key)
       select app_shop(), $1, f, u, k from unnest($2::text[], $3::text[], $4::text[]) as t(f, u, k) on conflict do nothing`,
      [branch, refs.map(r => r[0]), refs.map(r => r[1]), refs.map(r => r[2])]);
    await c.query('update files set deleted_at = null where shop_id = app_shop() and branch_id = $1 and id = any($2) and deleted_at is not null',
      [branch, [...new Set(refs.map(r => r[0]))]]);
  }
  await deleteUnreferenced(c, branch, lost);
}

// Every reference of a whole main data key goes (the key was removed).
export async function dropRefs(c: pg.ClientBase, branch: string, root: string): Promise<void> {
  const lost = (await c.query<{ file_id: string }>(
    'delete from file_refs where shop_id = app_shop() and branch_id = $1 and unit like $2 returning file_id', [branch, `${root}.%`])).rows.map(r => r.file_id);
  await deleteUnreferenced(c, branch, lost);
}

async function deleteUnreferenced(c: pg.ClientBase, branch: string, ids: string[]): Promise<void> {
  if (ids.length) await c.query(
    `update files f set deleted_at = now() where f.shop_id = app_shop() and f.branch_id = $1 and f.id = any($2) and f.deleted_at is null
        and not exists (select from file_refs r where r.shop_id = f.shop_id and r.branch_id = f.branch_id and r.file_id = f.id)`,
    [branch, [...new Set(ids)]]);
}

// The files a backup point refers to are kept as long as it is (11.6).
export async function keepForBackup(c: pg.ClientBase, branch: string, key: string, json: string): Promise<void> {
  await c.query('delete from backup_files where shop_id = app_shop() and branch_id = $1 and backup_key = $2', [branch, key]);
  const ids = linksIn(json);
  if (ids.length) await c.query(
    'insert into backup_files (shop_id, branch_id, backup_key, file_id) select app_shop(), $1, $2, unnest($3::text[])', [branch, key, ids]);
}

// Removes for good the files deleted more than 30 days ago that no backup
// point refers to, and treats an upload no save referred to within a day as
// deleted. Done lazily at each upload and by tools/files.mjs until the
// server has a scheduler (task 3.16). branch: one branch, or every one in reach.
export async function purgeFiles(c: pg.ClientBase, branch?: string): Promise<{ branch: string; id: string }[]> {
  const only = branch === undefined ? '' : 'and f.branch_id = $2';
  const at = branch === undefined ? [] : [branch];
  await c.query(
    `update files f set deleted_at = now() where f.shop_id = app_shop() ${only} and f.deleted_at is null
        and f.created_at < now() - make_interval(hours => $1)
        and not exists (select from file_refs r where r.shop_id = f.shop_id and r.branch_id = f.branch_id and r.file_id = f.id)`,
    [ORPHAN_HOURS, ...at]);
  const { rows } = await c.query<{ branch_id: string; id: string }>(
    `delete from files f where f.shop_id = app_shop() ${only} and f.deleted_at < now() - make_interval(days => $1)
        and not exists (select from backup_files b where b.shop_id = f.shop_id and b.branch_id = f.branch_id and b.file_id = f.id)
        and not exists (select from file_refs r where r.shop_id = f.shop_id and r.branch_id = f.branch_id and r.file_id = f.id)
      returning f.branch_id, f.id`, [KEEP_DAYS, ...at]);
  const gone = rows.map(r => ({ branch: r.branch_id, id: r.id }));
  if (gone.length) await fileStore().removed(c, gone);
  return gone;
}

export function bytesOfDataUrl(url: string): { mime: string; bytes: Buffer } | null {
  const p = parseDataUrl(url);
  if (!p) return null;
  return { mime: p.mime, bytes: p.base64 ? Buffer.from(p.payload, 'base64') : Buffer.from(decodeURIComponent(p.payload)) };
}

// The safety net of /api/storage: the browser uploads every file before it
// saves (server/client/files.ts), so a save that still holds one is refused.
// Returns the first row holding one.
export function inlineFile(changes: Changes): string | null {
  for (const r of changes.upsert) {
    if (INLINE_UNITS.has(r.unit) || !mightHoldDataUrl(r.data)) continue;
    try { if (dataUrlsIn(JSON.parse(r.data)).length) return `${r.unit}|${r.key}`; } catch { return `${r.unit}|${r.key}`; }
  }
  return null;
}

// Data opened from a file of the legacy app (seed.ts): its files are kept
// apart and the rows get links instead.
export async function extractInline(c: pg.ClientBase, branch: string, rows: Row[], userId: string | null = null): Promise<Row[]> {
  const out: Row[] = [];
  for (const r of rows) {
    if (INLINE_UNITS.has(r.unit) || !mightHoldDataUrl(r.data)) { out.push(r); continue; }
    const value = JSON.parse(r.data), map = new Map<string, string>();
    for (const f of dataUrlsIn(value)) {
      if (map.has(f.url)) continue;
      const d = bytesOfDataUrl(f.url)!;
      const s = await storeFile(c, branch, { ...d, name: f.name, use: useOf(r.unit), userId });
      if (!s.ok) throw new Error(`${r.unit} ${r.key}: file refused (${s.error})`);
      map.set(f.url, s.url);
    }
    out.push({ ...r, data: JSON.stringify(replaceStrings(value, map)) });
  }
  return out;
}

// A request body up to `limit` bytes; null when it is bigger.
export async function readBody(req: Request, limit: number): Promise<Buffer | null> {
  if (Number(req.headers.get('content-length') || 0) > limit) return null;
  if (!req.body) return Buffer.alloc(0);
  const chunks: Buffer[] = [];
  let n = 0;
  const reader = req.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > limit) { await reader.cancel().catch(() => {}); return null; }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}
