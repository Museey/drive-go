// The managed database of the test server (DigitalOcean, task 3.16) only takes TLS, with a certificate signed by its own
// CA: the app, the migrations and the staff tools check it against DATABASE_CA_CERT (server/lib/pg-config.ts). Here a
// throwaway PostgreSQL gets a certificate from a CA made for the test, and its connection string says sslmode=require,
// as DigitalOcean's does.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { pgConfig } from '../../server/lib/pg-config.ts';

let hasOpenssl = true;
try { execFileSync('openssl', ['version'], { stdio: 'ignore' }); } catch { hasOpenssl = false; }

// A CA, a server certificate it signs for 127.0.0.1, and a second CA that signed nothing.
function certificates() {
  const dir = mkdtempSync(join(tmpdir(), 'drivego-tls-'));
  const ssl = (...args) => execFileSync('openssl', args, { cwd: dir, stdio: 'ignore' });
  try {
    for (const ca of ['ca', 'other'])
      ssl('req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2', '-subj', `/CN=drivego test ${ca}`, '-keyout', `${ca}.key`, '-out', `${ca}.crt`);
    ssl('req', '-newkey', 'rsa:2048', '-nodes', '-subj', '/CN=127.0.0.1', '-keyout', 'server.key', '-out', 'server.csr');
    writeFileSync(join(dir, 'san.ext'), 'subjectAltName=IP:127.0.0.1,DNS:localhost\n');
    ssl('x509', '-req', '-in', 'server.csr', '-CA', 'ca.crt', '-CAkey', 'ca.key', '-CAcreateserial', '-days', '2', '-extfile', 'san.ext', '-out', 'server.crt');
    const read = f => readFileSync(join(dir, f), 'utf8');
    return { ca: read('ca.crt'), other: read('other.crt'), cert: read('server.crt'), key: read('server.key') };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('ฐานข้อมูลที่รับเฉพาะ TLS แบบ DigitalOcean', { skip: !hasOpenssl && 'openssl not installed' }, () => {
  let db, certs, url;
  const connect = async u => {
    const c = new pg.Client(pgConfig(u));
    await c.connect();
    try { return (await c.query('select ssl from pg_stat_ssl where pid = pg_backend_pid()')).rows[0].ssl; } finally { await c.end(); }
  };
  const withCa = async (ca, fn) => {
    const was = process.env.DATABASE_CA_CERT;
    if (ca === null) delete process.env.DATABASE_CA_CERT; else process.env.DATABASE_CA_CERT = ca;
    try { return await fn(); } finally { if (was === undefined) delete process.env.DATABASE_CA_CERT; else process.env.DATABASE_CA_CERT = was; }
  };

  before(async () => {
    certs = certificates();
    db = await startTempPostgres({ tls: { cert: certs.cert, key: certs.key } });
    url = `${db.url}?sslmode=require`;
  });
  after(async () => { await db?.stop(); });

  test('ใส่ CA ของฐานข้อมูลใน DATABASE_CA_CERT แล้วต่อได้ผ่าน TLS', async () => {
    assert.equal(await withCa(certs.ca, () => connect(url)), true);
  });

  test('CA ที่ไม่ได้ออกใบรับรองให้ฐานข้อมูลนี้ ต่อไม่ได้', async () => {
    await withCa(certs.other, () => assert.rejects(connect(url), /self[- ]signed|unable to verify|certificate/i));
  });

  test('ไม่มี DATABASE_CA_CERT แต่ข้อความบอก sslmode=require ต่อไม่ได้ (ใบรับรองไม่ได้มาจาก CA สาธารณะ)', async () => {
    await withCa(null, () => assert.rejects(connect(url), /self[- ]signed|unable to verify|certificate/i));
  });

  test('migration ของ deploy ทำงานผ่าน TLS ด้วยข้อความเชื่อมต่อแบบเดียวกัน', async () => {
    const applied = await withCa(certs.ca, () => migrate(url));
    assert.ok(applied.length > 0);
    assert.deepEqual(await withCa(certs.ca, () => migrate(url)), []);   // and only once
  });
});
