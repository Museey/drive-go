// Tries the test server's image (Dockerfile) the way DigitalOcean runs it (task 3.16, .do/app.yaml): a PostgreSQL that
// only takes TLS with a certificate of its own CA (as the managed database), the app's user drivego_app made beforehand
// with a password (as in the control panel), then the pre-deploy job twice (the schema and the demo shops, then nothing
// left to do) and the web container: health, a shop's page, signing in; then the staff tool opens a real shop and
// gives its owner a new password (docs/STAFF-TOOLS.md), and the owner signs in. Used by CI before the deploy branch moves.
//
//   docker build -t drivego:smoke . && node tools/image-smoke.mjs [image]
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { startTempPostgres } from './pg-temp.mjs';

const image = process.argv[2] || 'drivego:smoke';
const PORT = 18080;
const say = (...a) => console.log('·', ...a);
const fail = m => { throw new Error(m); };

const dir = mkdtempSync(join(tmpdir(), 'drivego-smoke-'));
const ssl = (...a) => execFileSync('openssl', a, { cwd: dir, stdio: 'ignore' });
ssl('req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2', '-subj', '/CN=drivego smoke ca', '-keyout', 'ca.key', '-out', 'ca.crt');
ssl('req', '-newkey', 'rsa:2048', '-nodes', '-subj', '/CN=127.0.0.1', '-keyout', 'server.key', '-out', 'server.csr');
writeFileSync(join(dir, 'san.ext'), 'subjectAltName=IP:127.0.0.1\n');
ssl('x509', '-req', '-in', 'server.csr', '-CA', 'ca.crt', '-CAkey', 'ca.key', '-CAcreateserial', '-days', '2', '-extfile', 'san.ext', '-out', 'server.crt');
const read = f => readFileSync(join(dir, f), 'utf8');
// passed to the containers by name (docker run -e DATABASE_CA_CERT), as App Platform passes ${db.CA_CERT}
process.env.DATABASE_CA_CERT = read('ca.crt');

const db = await startTempPostgres({ tls: { cert: read('server.crt'), key: read('server.key') } });
const owner = `${db.url}?sslmode=require`;
const app = `${db.url.replace('//drivego@', '//drivego_app:smoke-app-password@')}?sslmode=require`;
const c = new pg.Client({ connectionString: db.url });
await c.connect();
await c.query("create role drivego_app login password 'smoke-app-password'");
await c.end();

const docker = args => spawnSync('docker', args, { encoding: 'utf8' });
const job = () => docker(['run', '--rm', '--network', 'host', '-e', `MIGRATE_DATABASE_URL=${owner}`, '-e', 'DATABASE_CA_CERT', '-e', 'SEED_DEMO_SHOPS=1',
  image, 'node', 'tools/deploy-migrate.mjs']);
let web = '';
try {
  const first = job();
  if (first.status !== 0) fail(`pre-deploy job failed:\n${first.stdout}${first.stderr}`);
  if (!/applied 0001_core\.sql/.test(first.stdout) || !/opened demo shops: demo-biz/.test(first.stdout)) fail(`pre-deploy job said:\n${first.stdout}`);
  say('pre-deploy job: schema applied, demo shops opened');
  const second = job();
  if (second.status !== 0 || !/schema up to date/.test(second.stdout) || !/already has shops/.test(second.stdout)) fail(`second job:\n${second.stdout}${second.stderr}`);
  say('pre-deploy job again: nothing to do');

  const run = docker(['run', '-d', '--network', 'host', '-e', `PORT=${PORT}`, '-e', `DATABASE_URL=${app}`, '-e', 'DATABASE_CA_CERT', image]);
  if (run.status !== 0) fail(`web container: ${run.stderr}`);
  web = run.stdout.trim();
  const base = `http://127.0.0.1:${PORT}`;
  for (let i = 0; ; i++) {
    try { const r = await fetch(`${base}/api/health`); if (r.ok && (await r.json()).db) break; } catch {}
    if (i > 120) fail('the web container did not answer /api/health with the database in 60 s');
    await new Promise(r => setTimeout(r, 500));
  }
  say('web: /api/health ok (the app reaches the database as drivego_app over TLS)');
  const page = await fetch(`${base}/demo-biz/`);
  if (page.status !== 200 || !/<script[^>]+js\/03\.js/.test(await page.text())) fail(`/demo-biz/ answered ${page.status}`);
  say('web: /demo-biz/ serves the screens');
  const signIn = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: 'demo-biz', user: 'dg1688', pass: '123456' }) });
  const cookie = signIn.headers.get('set-cookie') || '';
  if (signIn.status !== 200 || !/; Secure/.test(cookie) || !/HttpOnly/i.test(cookie)) fail(`sign-in: ${signIn.status} ${cookie}`);
  const session = cookie.split(';')[0];
  const data = await fetch(`${base}/api/storage/garage.v22`, { headers: { cookie: session } });
  if (data.status !== 200) fail(`the shop's data after signing in: ${data.status}`);
  say('web: signing in to demo-biz gives a Secure session cookie and the shop\'s data');

  // The staff tool in the image, as staff run it on the server: a real shop, then a forgotten password.
  const admin = (...args) => docker(['run', '--rm', '--network', 'host', '-e', `MIGRATE_DATABASE_URL=${owner}`, '-e', 'DATABASE_CA_CERT',
    image, 'node', 'tools/shop-admin.mjs', ...args, '--by', 'smoke']);
  const passOf = r => (/temporary password (\S+)/.exec(r.stdout) || [])[1];
  // A connection kept from before the (blocking) docker run may have been closed by the server meanwhile: try again.
  const signInAs = async pass => {
    for (let i = 0; ; i++) {
      try {
        return await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code: 'smoke-real', user: 'smokereal', pass }) });
      } catch (e) { if (i > 1 || e.cause?.code !== 'UND_ERR_SOCKET') throw e; }
    }
  };
  const opened = admin('new', 'smoke-real', '--biz', '--trial', '--name', 'อู่ทดสอบ image', '--owner', 'ทดสอบ ระบบ');
  if (opened.status !== 0 || !passOf(opened)) fail(`shop-admin new:\n${opened.stdout}${opened.stderr}`);
  if ((await signInAs(passOf(opened))).status !== 200) fail('the new shop\'s owner could not sign in');
  const reset = admin('password', 'smoke-real');
  if (reset.status !== 0 || !passOf(reset)) fail(`shop-admin password:\n${reset.stdout}${reset.stderr}`);
  if ((await signInAs(passOf(opened))).status === 200 || (await signInAs(passOf(reset))).status !== 200) fail('the new password did not replace the old one');
  say('staff tool: opened a real shop, its owner signed in; a new password replaced the old one');
  console.log('image smoke test passed');
} catch (e) {
  if (web) console.error(docker(['logs', web]).stdout.slice(-3000), docker(['logs', web]).stderr.slice(-3000));
  console.error(String(e.message || e));
  process.exitCode = 1;
} finally {
  if (web) docker(['rm', '-f', web]);
  await db.stop();
  rmSync(dir, { recursive: true, force: true });
}
