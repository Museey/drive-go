// The load test at pilot size (LAUNCH-CHECKLIST stage 1; how to read it: docs/LOAD-TEST.md).
//
//   npm run load                       this computer: the new system (next start, as on the server) and a temporary
//                                      PostgreSQL, SHOPS shops opened from the 36-month data, the server held to one
//                                      CPU like the test server's; k6 must be installed (https://grafana.com/docs/k6/)
//   npm run load -- --node             the same without k6: tools/load/k6-node runs the script (to check it works;
//                                      the numbers of a load test are k6's)
//   LOAD_USER=… LOAD_PASS=… npm run load -- --url https://<app> --shop CODE[,CODE…]
//                                      the test server: shops DriveGo's staff opened for the test (never a real
//                                      shop: the test adds documents), signed in with that account
// Settings: --shops 3 --devices 5 --minutes 5 --think 5-15 --ramp 10 --dataset biz-full --cpus 1 --memory-mb 1024
//           --k6 <path to k6> --out <folder> (default: a new temporary folder; capture.json, summary.json, report.json)
//
// Steps: open the shops → open each once through the real screens (its first open of the day) → record one repair
// job through the real screens on the first shop (tools/load/capture.mjs) → k6 (tools/load/pilot.js): every device
// opens the program within RAMP seconds, keeps the live stream open and does jobs until MINUTES are up → the results,
// with the server's highest memory (this computer only). Ends with k6's status: 0 all thresholds met, 99 not.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { startNewSystem } from './serve-new.mjs';
import { captureJob, openShop } from './load/capture.mjs';
import { createShop, readFixture } from '../server/lib/seed.ts';
import { TRIAL_DAYS, addDays, today } from '../server/lib/licence.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def; };
const S = {
  shops: Number(opt('shops', 3)), devices: Number(opt('devices', 5)), minutes: Number(opt('minutes', 5)),
  think: opt('think', '5-15'), ramp: Number(opt('ramp', 10)), dataset: opt('dataset', 'biz-full'),
  cpus: Number(opt('cpus', 1)), memoryMb: Number(opt('memory-mb', 1024)),
  url: opt('url', ''), shopCodes: opt('shop', ''), node: flag('node'), k6: opt('k6', process.env.K6 || 'k6'),
};
const out = opt('out', '') || mkdtempSync(join(tmpdir(), 'drivego-load-'));
const say = m => console.log(`[load] ${m}`);

function k6Command() {
  if (S.node) return [process.execPath, [join(root, 'tools/load/k6-node/run.mjs')]];
  const v = spawnSync(S.k6, ['version'], { encoding: 'utf8' });
  if (v.status !== 0) {
    console.error(`k6 not found (${S.k6}). Install it (https://grafana.com/docs/k6/latest/set-up/install-k6/), give its path with --k6,` +
      ' or check the script without it: npm run load -- --node');
    process.exit(2);
  }
  say(v.stdout.trim());
  return [S.k6, ['run', '--quiet']];
}

const freePort = () => new Promise((ok, no) => {
  const s = createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => ok(port)); }).on('error', no);
});

// The resident memory of a process and its children, in MB.
function rssMb(pid) {
  let kb = 0;
  const pids = [pid];
  for (let i = 0; i < pids.length; i++) {
    try { kb += Number(/VmRSS:\s+(\d+)/.exec(readFileSync(`/proc/${pids[i]}/status`, 'utf8'))?.[1] || 0); } catch { /* gone */ }
    const kids = spawnSync('pgrep', ['-P', String(pids[i])], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean).map(Number);
    pids.push(...kids);
  }
  return kb / 1024;
}

const [cmd, cmdArgs] = k6Command();
let sys = null, sampler = null;
const memory = { peakMb: 0, samples: [] };
try {
  let base, shops, user, pass;
  if (S.url) {
    base = S.url.replace(/\/$/, '');
    shops = S.shopCodes.split(',').map(s => s.trim()).filter(Boolean);
    user = process.env.LOAD_USER; pass = process.env.LOAD_PASS;
    if (!shops.length || !user || !pass) throw new Error('--url needs --shop CODE[,CODE…] and LOAD_USER, LOAD_PASS in the environment');
  } else {
    const file = join(root, `tests/fixtures/${S.dataset}.json`);
    if (!existsSync(file)) {
      const [pkg, kind] = S.dataset.split('-');
      say(`building tests/fixtures/${S.dataset}.json (not kept in git; a few minutes)`);
      if (spawnSync(process.execPath, ['tools/make-fixture.mjs', pkg, kind], { cwd: root, stdio: 'inherit' }).status !== 0) throw new Error('could not build the dataset');
    }
    const port = await freePort();
    say(`starting the new system on port ${port}`);
    sys = await startNewSystem({ port, build: !process.env.NO_BUILD, quiet: true });
    base = `http://127.0.0.1:${port}`;
    shops = Array.from({ length: S.shops }, (_, i) => `load-${i + 1}`);
    user = 'dg1688'; pass = '123456';   // the fixture's owner (tests/support/config.mjs OWNERS.biz)
    const data = readFixture(file);
    const pool = new pg.Pool({ connectionString: sys.ownerUrl, max: 1 });
    const licence = { kind: 'trial', start: today(), end: addDays(today(), TRIAL_DAYS) };
    for (const code of shops) await createShop(pool, { code, pkg: 'biz', licence, data });
    await pool.end();
    say(`opened ${shops.length} shop(s) from ${S.dataset}`);
    if (S.cpus > 0) {
      const cpus = `0-${S.cpus - 1}`;
      const pin = spawnSync('taskset', ['-a', '-cp', cpus, String(sys.pid)], { encoding: 'utf8' });
      say(pin.status === 0 ? `the server runs on CPU ${cpus} only (the test server has ${S.cpus})` : 'taskset not available: the server uses every CPU');
    }
  }

  for (const code of shops) await openShop({ url: `${base}/${code}/`, user, pass });
  say('each shop opened once through the screens; recording a repair job…');
  const capture = await captureJob({ url: `${base}/${shops[0]}/`, user, pass });
  writeFileSync(join(out, 'capture.json'), JSON.stringify(capture));
  say(`recorded: ${capture.boot.length} requests to open the program, ${capture.job.map(s => `${s.step} ${JSON.stringify(s.body).length} B`).join(', ')}`);

  if (sys) sampler = setInterval(() => {
    const mb = rssMb(sys.pid);
    memory.samples.push(Math.round(mb));
    memory.peakMb = Math.max(memory.peakMb, mb);
  }, 500);
  const env = { BASE_URL: base, SHOPS: shops.join(','), USER: user, PASS: pass, DEVICES: S.devices, MINUTES: S.minutes,
    THINK: S.think, RAMP: S.ramp, CAPTURE: join(out, 'capture.json'), SUMMARY: join(out, 'summary.json') };
  say(`k6: ${shops.length} shop(s) × ${S.devices} device(s) for ${S.minutes} min${S.node ? ' (k6-node)' : ''}`);
  const code = await new Promise(ok => spawn(cmd, [...cmdArgs, ...Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]), join(root, 'tools/load/pilot.js')],
    { cwd: root, stdio: 'inherit' }).on('exit', c => ok(c ?? 1)));
  if (sampler) clearInterval(sampler);

  const report = { settings: { ...S, shops: shops.length }, base: S.url ? base : 'this computer', k6Status: code };
  if (sys) {
    report.memory = { peakMb: Math.round(memory.peakMb), limitMb: S.memoryMb, everySecond: memory.samples.filter((_, i) => i % 2 === 0) };
    const ok = memory.peakMb < S.memoryMb * 0.85;
    say(`server memory: highest ${Math.round(memory.peakMb)} MB of ${S.memoryMb} MB${ok ? '' : ' — MORE THAN 85%'}`);
    if (!ok && code === 0) report.k6Status = 99;
  }
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 1));
  say(`files: ${out}`);
  process.exitCode = report.k6Status;
} catch (e) {
  console.error(e.stack || e);
  process.exitCode = 1;
} finally {
  if (sampler) clearInterval(sampler);
  if (sys) await sys.stop();
}
