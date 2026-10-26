// Runs the new system: a throwaway PostgreSQL (tools/pg-temp.mjs) with the
// schema applied, a build of server/ (also of the browser storage file) and
// Next.js. The tests run it on LEGACY_PORT, the same origin they use for the
// legacy file; run by hand it listens on port 3000 (or PORT) and opens three
// demo shops from the test fixtures, so there is something to sign in to.
//
//   node tools/serve-new.mjs        build and start; Ctrl+C stops and removes the database
//                                   (NO_BUILD=1 reuses the last build)
//   node tools/serve-new.mjs --dev  `next dev` instead (npm run dev): reloads on every change
//
// With your own database, set DATABASE_URL (the app's role, drivego_app) and
// MIGRATE_DATABASE_URL (the owner, to apply the schema; demo shops are only
// opened in a database that has no shops yet).
// The tests start it through startNewSystem() (tests/support/new-system-setup.mjs).
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PORT } from '../tests/support/config.mjs';
import { startTempPostgres } from './pg-temp.mjs';
import { migrate } from '../server/db/migrate.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const serverDir = fileURLToPath(new URL('../server/', import.meta.url));
const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));

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
  // Quiet runs keep the last of Next.js's output, to say why it did not start.
  const next = spawn(process.execPath, [nextBin, dev ? 'dev' : 'start', '-p', String(port), '-H', '127.0.0.1'],
    { cwd: serverDir, env: { ...process.env, DATABASE_URL: appUrl }, stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
  let said = '';
  for (const out of [next.stdout, next.stderr]) out?.on('data', d => { said = (said + d).slice(-4000); });
  const exited = new Promise(r => next.once('exit', r));
  for (let i = 0; ; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(2000) })).ok) break; } catch {}
    if (next.exitCode !== null || i > 600) {
      next.kill('SIGTERM'); if (pg) await pg.stop();
      throw new Error(`the new system did not start on port ${port} (${next.exitCode !== null ? `exit code ${next.exitCode}` : 'no answer in 60 s'})` +
        (said ? `; Next.js said:\n${said}` : ''));
    }
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

// The demo shops: the test fixtures' "ready to try" data of each package, with
// their owner accounts (tests/support/config.mjs OWNERS) and, for Franchise,
// the branch accounts b001 / 1234 and staff001 / 5678.
const DEMO_SHOPS = [
  { code: 'demo-biz', pkg: 'biz', dataset: 'biz-trial', who: 'dg1688 / 123456' },
  { code: 'demo-prox', pkg: 'prox', dataset: 'prox-trial', who: 'dg1688 / 123456' },
  { code: 'demo-franchise', pkg: 'franchise', dataset: 'franchise-trial', who: 'hq / 1234 (สาขา b001 / 1234)' },
];

async function openDemoShops(ownerUrl) {
  const { default: pg } = await import('pg');
  const { createShop, readFixture } = await import('../server/lib/seed.ts');
  const { TRIAL_DAYS, addDays, today } = await import('../server/lib/licence.ts');
  // A trial from today (task 3.15), not the fixtures' licence, which ends on a fixed day.
  const licence = { kind: 'trial', start: today(), end: addDays(today(), TRIAL_DAYS) };
  const pool = new pg.Pool({ connectionString: ownerUrl, max: 1 });
  try {
    if ((await pool.query('select count(*)::int as n from shops')).rows[0].n) return [];
    for (const d of DEMO_SHOPS)
      await createShop(pool, { code: d.code, pkg: d.pkg, licence, data: readFixture(new URL(`../tests/fixtures/${d.dataset}.json`, import.meta.url)) });
    return DEMO_SHOPS;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3000;
  const dev = process.argv.includes('--dev') || !!process.env.DEV;
  const sys = await startNewSystem({ port, build: !process.env.NO_BUILD, dev });
  const end = code => sys.stop().then(() => process.exit(code));
  let demos = [];
  try { if (sys.ownerUrl) demos = await openDemoShops(sys.ownerUrl); } catch (e) { console.error(e); await end(1); }
  const temporary = !process.env.DATABASE_URL;
  console.log(`\nDriveGo พร้อมใช้ที่ http://127.0.0.1:${port}/<รหัสร้าน>/${temporary ? ' (ฐานข้อมูลชั่วคราว: ข้อมูลหายเมื่อปิดด้วย Ctrl+C)' : ''}`);
  for (const d of demos) console.log(`  ${d.pkg.padEnd(10)} ${`http://127.0.0.1:${port}/${d.code}/`.padEnd(42)} ${d.who}`);
  console.log(`  owner database: ${sys.ownerUrl ?? '(yours)'}\n`);
  sys.exited.then(() => end(1));
  for (const s of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(s, () => end(0));
}
