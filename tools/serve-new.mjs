// Runs the new system for the tests (TARGET=new): a throwaway PostgreSQL
// (tools/pg-temp.mjs, or DATABASE_URL if set), a production build of server/
// and `next start` on LEGACY_PORT, the same origin the tests use for the
// legacy file. Stops everything and removes the database on SIGTERM, SIGINT
// or SIGHUP.
//
//   node tools/serve-new.mjs        (NO_BUILD=1 to reuse the last build)
//   DEV=1 node tools/serve-new.mjs  `next dev` instead (npm run dev): reloads on every change
import { spawn, spawnSync } from 'node:child_process';
import { PORT } from '../tests/support/config.mjs';
import { startTempPostgres } from './pg-temp.mjs';
import { migrate } from '../server/db/migrate.ts';

const serverDir = new URL('../server/', import.meta.url).pathname;
const nextBin = new URL('../node_modules/next/dist/bin/next', import.meta.url).pathname;

const dev = !!process.env.DEV;
if (!dev && !process.env.NO_BUILD) {
  const build = spawnSync(process.execPath, [nextBin, 'build'], { cwd: serverDir, stdio: ['ignore', 'ignore', 'inherit'] });
  if (build.status !== 0) process.exit(build.status || 1);
}

// The schema is applied as the database owner; the app itself connects as
// drivego_app, the role Row-Level Security applies to. With your own database,
// set DATABASE_URL (the app's role) and MIGRATE_DATABASE_URL (the owner).
const pg = process.env.DATABASE_URL ? null : await startTempPostgres();
const ownerUrl = pg ? pg.url : process.env.MIGRATE_DATABASE_URL;
if (ownerUrl) await migrate(ownerUrl);
const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL || pg.url.replace('//drivego@', '//drivego_app@') };
const next = spawn(process.execPath, [nextBin, dev ? 'dev' : 'start', '-p', String(PORT), '-H', '127.0.0.1'], { cwd: serverDir, env, stdio: 'inherit' });
if (dev) console.log(`DriveGo: http://127.0.0.1:${PORT}/DG-1688/  database: ${env.DATABASE_URL}`);

let ending = false;
async function end(code = 0) {
  if (ending) return; ending = true;
  next.kill('SIGTERM');
  if (pg) await pg.stop();
  process.exit(code);
}
next.on('exit', c => end(c ?? 1));
for (const s of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(s, () => end());
