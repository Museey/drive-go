// The test server's job `offsite` (.do/app.yaml, each night at 02:47 Bangkok time; docs/OFFSITE-BACKUP.md): a copy of
// the whole database, sealed with the team's public key (server/lib/offsite.ts), uploaded to a bucket outside
// DigitalOcean (Backblaze B2, Google Cloud Storage or any S3-compatible storage). Old copies are removed by the
// bucket's own lifecycle rule, not by this job: its key may only add files.
//
//   node tools/backup-offsite.mjs [--out FILE]      (MIGRATE_DATABASE_URL or --db: the database owner)
//
// Settings (DigitalOcean: the job's environment variables, the secret ones encrypted):
//   BACKUP_PUBLIC_KEY      the public key from tools/backup-keys.mjs (one line of base64, or the PEM)
//   BACKUP_S3_ENDPOINT     e.g. https://s3.us-west-004.backblazeb2.com or https://storage.googleapis.com
//   BACKUP_S3_REGION       e.g. us-west-004 (Google Cloud Storage: auto)
//   BACKUP_S3_BUCKET       the bucket's name
//   BACKUP_S3_KEY_ID, BACKUP_S3_SECRET    an application key that may write to that bucket only
//   BACKUP_S3_PREFIX       folder in the bucket (default drivego/)
// --out FILE: write the sealed copy to FILE and upload nothing (the drill; a copy made by hand).
//
// Exit status: 0 copied · 3 not set up (DigitalOcean's alert JOB_INVOCATION_FAILED e-mails the team) · 1 failed.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import pg from 'pg';
import { pgConfig } from '../server/lib/pg-config.ts';
import { makeCopy, upload } from '../server/lib/offsite.ts';

const { values: o } = parseArgs({ options: { db: { type: 'string' }, out: { type: 'string' } } });
const url = o.db || process.env.MIGRATE_DATABASE_URL;
if (!url) { console.error('give the owner database URL: --db URL or MIGRATE_DATABASE_URL'); process.exit(2); }
const env = process.env;
const need = ['BACKUP_PUBLIC_KEY', ...(o.out ? [] : ['BACKUP_S3_ENDPOINT', 'BACKUP_S3_REGION', 'BACKUP_S3_BUCKET', 'BACKUP_S3_KEY_ID', 'BACKUP_S3_SECRET'])];
const missing = need.filter(k => !env[k]);
if (missing.length) {
  console.log(`STAFF ACTION NEEDED: the off-site copy is not set up (missing ${missing.join(', ')}; docs/OFFSITE-BACKUP.md)`);
  process.exit(3);
}

const db = new pg.Pool({ ...pgConfig(url), max: 1 });
const work = o.out ? null : mkdtempSync(join(tmpdir(), 'dg-offsite-'));
const started = Date.now();
try {
  const file = o.out ?? join(work, 'copy.dgbk');
  const c = await makeCopy(db, env.BACKUP_PUBLIC_KEY, file);
  const mb = (c.size / 1024 / 1024).toFixed(1);
  console.log(`copy made: ${c.tables} tables, ${c.rows} rows, ${mb} MB sealed, sha256 ${c.sha256.slice(0, 16)}…`);
  if (!o.out) {
    // Bangkok time in the name: one copy a night, the time keeps a second run of the same night apart.
    const at = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 16).replace(':', '');
    const object = `${(env.BACKUP_S3_PREFIX ?? 'drivego/').replace(/^\/+/, '')}${at}.dgbk`;
    await upload({ endpoint: env.BACKUP_S3_ENDPOINT, region: env.BACKUP_S3_REGION, bucket: env.BACKUP_S3_BUCKET,
      keyId: env.BACKUP_S3_KEY_ID, secret: env.BACKUP_S3_SECRET }, object, { path: file, ...c });
    console.log(`uploaded: ${env.BACKUP_S3_BUCKET}/${object} in ${Math.round((Date.now() - started) / 1000)} s`);
  }
} catch (e) {
  console.error(`the off-site copy failed: ${e.code ? `${e.code} ` : ''}${String(e.message).replace(url, '…')}`);
  process.exitCode = 1;
} finally {
  await db.end();
  if (work) rmSync(work, { recursive: true, force: true });
}
