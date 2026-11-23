// The off-site copy of the database (server/lib/offsite.ts, tools/backup-offsite.mjs, tools/backup-restore.mjs;
// security review 2026-11-23 ก6): a copy made as an owner that Row-Level Security applies to (as doadmin on
// DigitalOcean) holds every shop's rows; restored into an empty database it gives the same rows byte for byte; a
// changed copy or the wrong key restores nothing; the upload is signed as S3 expects.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { generateKeyPairSync, createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { storeFile } from '../../server/lib/files.ts';
import { makeBackup } from '../../server/lib/storage.ts';
import { openLicence } from '../../server/lib/licence-admin.ts';
import { fingerprint } from '../../server/lib/fingerprint.ts';
import { dump, makeCopy, openCopy, restore, signV4, upload } from '../../server/lib/offsite.ts';

let cluster, su, from, to, dir;
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));
const keys = generateKeyPairSync('rsa', { modulusLength: 3072, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
const urlOf = (db, user = 'doadmin') => cluster.url.replace('//drivego@', `//${user}@`).replace(/\/[^/?]+(\?|$)/, `/${db}$1`);
const lines = async db => { const out = []; await dump(db, l => { out.push(l); }); return out.slice(1).sort(); };

before(async () => {
  cluster = await startTempPostgres();
  su = new pg.Pool({ connectionString: cluster.url });
  // As on DigitalOcean: the owner that migrates and runs the jobs is not a superuser, so Row-Level Security applies to it.
  await su.query('create role doadmin login createrole createdb');
  for (const d of ['copy_from', 'copy_to']) await su.query(`create database ${d} owner doadmin`);
  await migrate(urlOf('copy_from'));
  await migrate(urlOf('copy_to'));
  from = new pg.Pool({ connectionString: urlOf('copy_from') });
  to = new pg.Pool({ connectionString: urlOf('copy_to') });
  assert.equal((await from.query('select rolsuper or rolbypassrls as skips from pg_roles where rolname = current_user')).rows[0].skips, false);
  dir = mkdtempSync(join(tmpdir(), 'dg-offsite-'));

  // Shops of every package, an attachment, a backup point, a licence with its log.
  const a = await createShop(from, { code: 'copy-biz', pkg: 'biz', data: fixture('biz-trial') });
  await createShop(from, { code: 'copy-prox', pkg: 'prox', data: fixture('prox-trial') });
  await createShop(from, { code: 'copy-fr', pkg: 'franchise', data: fixture('franchise-trial') });
  await withShop(from, a.shopId, '*', async c => {
    await storeFile(c, '', { bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 255]), mime: 'image/png', use: 'picture', name: 'x.png' });
    await makeBackup(c, '', 'garage.v22.bak.2026-10-13');
  });
  await openLicence(from, 'copy-prox', { kind: 'pilot', actor: 'test' }).catch(() => {});
});
after(async () => {
  await from?.end();
  await to?.end();
  await su?.end();
  await cluster?.stop();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('สำเนานอก DigitalOcean', () => {
  test('ทำสำเนาในฐานะเจ้าของฐานข้อมูลที่ RLS บังคับ ได้ทุกแถวของทุกร้าน กู้ลงฐานข้อมูลเปล่าได้ตรงทุกไบต์', async () => {
    const file = join(dir, 'copy.dgbk');
    const made = await makeCopy(from, keys.publicKey, file);
    assert.equal(made.size, statSync(file).size);
    assert.equal(made.sha256, createHash('sha256').update(readFileSync(file)).digest('hex'));
    // Every shop's rows are in it (RLS met shop by shop), and the copy is not readable without the key.
    const suFrom = new pg.Pool({ connectionString: cluster.url.replace(/\/[^/?]+(\?|$)/, '/copy_from$1') });
    try {
      const want = Number((await suFrom.query('select (select count(*) from records) + (select count(*) from file_bytes) + (select count(*) from backups) as n')).rows[0].n);
      const got = (await lines(from)).filter(l => /^(records|file_bytes|backups)\t/.test(l)).length;
      assert.equal(got, want);
      assert.ok(want > 1000, `rows: ${want}`);
    } finally { await suFrom.end(); }
    const raw = readFileSync(file);
    assert.equal(raw.includes(Buffer.from('copy-biz')), false, 'sealed: no shop code in the file');

    const r = await restore(to, openCopy(file, keys.privateKey));
    assert.equal(r.rows, made.rows);
    assert.deepEqual(await lines(to), await lines(from));
    const [p1, p2] = [await fingerprint(from), await fingerprint(to)];
    assert.equal(p2.digest, p1.digest);
    // The counters go on after the largest id: a new row gets a new id.
    const max = Number((await withShop(to, (await to.query("select id from shops where code = 'copy-biz'")).rows[0].id, '*',
      c => c.query('select max(id) as m from write_log'))).rows[0].m);
    const next = await withShop(to, (await to.query("select id from shops where code = 'copy-biz'")).rows[0].id, '*',
      c => c.query("insert into write_log (shop_id, units) values (app_shop(), '[]') returning id"));
    assert.ok(Number(next.rows[0].id) > max);
    // A second restore into a database that holds shops is refused.
    await assert.rejects(restore(to, openCopy(file, keys.privateKey)), /holds shops already/);
  });

  test('สำเนาที่ถูกแก้ หรือกุญแจผิด กู้ไม่ได้และไม่เหลืออะไรในฐานข้อมูล', async () => {
    const file = join(dir, 'copy2.dgbk');
    await makeCopy(from, keys.publicKey, file);
    await su.query('create database copy_bad owner doadmin');
    await migrate(urlOf('copy_bad'));
    const bad = new pg.Pool({ connectionString: urlOf('copy_bad') });
    try {
      const raw = readFileSync(file);
      const changed = Buffer.from(raw);
      changed[Math.floor(raw.length * 0.6)] ^= 1;
      writeFileSync(join(dir, 'changed.dgbk'), changed);
      await assert.rejects(restore(bad, openCopy(join(dir, 'changed.dgbk'), keys.privateKey)));
      assert.equal((await bad.query('select count(*)::int as n from shops')).rows[0].n, 0);
      writeFileSync(join(dir, 'cut.dgbk'), raw.subarray(0, raw.length - 100));
      await assert.rejects(restore(bad, openCopy(join(dir, 'cut.dgbk'), keys.privateKey)));
      assert.equal((await bad.query('select count(*)::int as n from shops')).rows[0].n, 0);
      const other = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
      await assert.rejects(restore(bad, openCopy(file, other.privateKey)));
      // The key as one line of base64 (easier to paste into DigitalOcean) works as the PEM does.
      const b64 = Buffer.from(keys.privateKey).toString('base64');
      const r = await restore(bad, openCopy(file, b64));
      assert.ok(r.rows > 1000);
    } finally { await bad.end(); }
  });

  test('ลายเซ็น AWS Signature V4 ตรงกับตัวอย่างของ AWS และอัปโหลดส่งไฟล์ทั้งไฟล์พร้อมค่า hash', async () => {
    // AWS S3 documentation, "Signature Calculations for the Authorization Header", GET Object example.
    const auth = signV4({ method: 'GET', path: '/test.txt', payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      headers: { host: 'examplebucket.s3.amazonaws.com', range: 'bytes=0-9', 'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'x-amz-date': '20130524T000000Z' },
      region: 'us-east-1', keyId: 'AKIAIOSFODNN7EXAMPLE', secret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' });
    assert.equal(auth, 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, ' +
      'SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41');

    const file = join(dir, 'up.bin');
    const body = Buffer.alloc(3 * 1024 * 1024 + 7, 7);
    writeFileSync(file, body);
    const sha256 = createHash('sha256').update(body).digest('hex');
    let got;
    const server = createServer((req, res) => {
      const parts = [];
      req.on('data', d => parts.push(d));
      req.on('end', () => { got = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(parts) }; res.writeHead(200).end(); });
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    try {
      const b = { endpoint: `http://127.0.0.1:${server.address().port}`, region: 'us-west-004', bucket: 'dg-copies', keyId: 'K1', secret: 'S1' };
      await upload(b, 'drivego/2026-11-23.dgbk', { path: file, size: body.length, sha256 }, new Date('2026-11-23T16:45:00Z'));
      assert.equal(got.method, 'PUT');
      assert.equal(got.url, '/dg-copies/drivego/2026-11-23.dgbk');
      assert.equal(got.headers['content-length'], String(body.length));
      assert.equal(got.headers['x-amz-content-sha256'], sha256);
      assert.equal(got.headers['x-amz-date'], '20261123T164500Z');
      assert.match(got.headers.authorization, /^AWS4-HMAC-SHA256 Credential=K1\/20261123\/us-west-004\/s3\/aws4_request, SignedHeaders=content-length;content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
      assert.ok(got.body.equals(body));
      // A refusal of the bucket is an error with its status.
      server.removeAllListeners('request');
      server.on('request', (req, res) => { req.resume(); req.on('end', () => res.writeHead(403).end('<Error>AccessDenied</Error>')); });
      await assert.rejects(upload(b, 'x', { path: file, size: body.length, sha256 }), /upload refused: 403 <Error>AccessDenied/);
    } finally { server.close(); }
  });
});
