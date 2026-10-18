// Runs the new system: a throwaway PostgreSQL (tools/pg-temp.mjs) with the
// schema applied, a build of server/ (also of the browser storage file) and
// Next.js on LEGACY_PORT, the same origin the tests use for the legacy file.
//
//   node tools/serve-new.mjs        build and start; Ctrl+C stops and removes the database
//                                   (NO_BUILD=1 reuses the last build)
//   DEV=1 node tools/serve-new.mjs  `next dev` instead (npm run dev): reloads on every change
//
// With your own database, set DATABASE_URL (the app's role, drivego_app) and
// MIGRATE_DATABASE_URL (the owner, to apply the schema).
// The tests start it through startNewSystem() (tests/support/new-system-setup.mjs).
import { spawn, spawnSync } from 'node:child_process';
import { PORT } from '../tests/support/config.mjs';
import { startTempPostgres } from './pg-temp.mjs';
import { migrate } from '../server/db/migrate.ts';

const root = new URL('../', import.meta.url).pathname;
const serverDir = new URL('../server/', import.meta.url).pathname;
const nextBin = new URL('../node_modules/next/dist/bin/next', import.meta.url).pathname;

// Returns { ownerUrl, appUrl, exited, stop() }. ownerUrl is null with your own
// database and no MIGRATE_DATABASE_URL.
export async function startNewSystem({ port = PORT, build = true, dev = false, quiet = false } = {}) {
  const run = (args, cwd) => {
    const r = spawnSync(process.execPath, args, { cwd, stdio: ['ignore', quiet ? 'ignore' : 'inherit', 'inherit'] });
    if (r.status !== 0) throw new Error(`failed: ${args.join(' ')}`);
  };
  run(['tools/build-client.mjs'], root);
  if (build && !dev) run([nextBin, 'build'], serverDir);
  const pg = process.env.DATABASE_URL ? null : await startTempPostgres();
  const ownerUrl = pg ? pg.url : process.env.MIGRATE_DATABASE_URL || null;
  if (ownerUrl) await migrate(ownerUrl);
  const appUrl = process.env.DATABASE_URL || pg.url.replace('//drivego@', '//drivego_app@');
  const next = spawn(process.execPath, [nextBin, dev ? 'dev' : 'start', '-p', String(port), '-H', '127.0.0.1'],
    { cwd: serverDir, env: { ...process.env, DATABASE_URL: appUrl }, stdio: quiet ? 'ignore' : 'inherit' });
  const exited = new Promise(r => next.once('exit', r));
  for (let i = 0; ; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) break; } catch {}
    if (next.exitCode !== null || i > 600) { next.kill('SIGTERM'); if (pg) await pg.stop(); throw new Error('the new system did not start'); }
    await new Promise(r => setTimeout(r, 100));
  }
  let stopping;
  const stop = () => stopping ||= (async () => {
    next.kill('SIGTERM');
    await Promise.race([exited, new Promise(r => setTimeout(r, 5000))]);
    if (pg) await pg.stop();
  })();
  return { ownerUrl, appUrl, exited, stop };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sys = await startNewSystem({ build: !process.env.NO_BUILD, dev: !!process.env.DEV });
  console.log(`DriveGo: http://127.0.0.1:${PORT}/<shop code>/  owner database: ${sys.ownerUrl ?? '(yours)'}`);
  const end = code => sys.stop().then(() => process.exit(code));
  sys.exited.then(() => end(1));
  for (const s of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(s, () => end(0));
}
