// Tries the test server's image (Dockerfile) the way DigitalOcean runs it (task 3.16, .do/app.yaml): a PostgreSQL that
// only takes TLS with a certificate of its own CA (as the managed database), the app's user drivego_app made beforehand
// with a password (as in the control panel), then the pre-deploy job twice (the schema and the demo shops, then nothing
// left to do) and the web container: health, a shop's page, signing in; then the staff tool opens a real shop and
// gives its owner a new password (docs/STAFF-TOOLS.md), and the owner signs in; the scheduled jobs (tools/nightly.mjs,
// tools/watch.mjs) and a page's error reaching the errors table; the staff web page at /ops (with STAFF_DATABASE_URL).
// Used by CI before the deploy branch moves.
//
//   docker build -t drivego:smoke . && node tools/image-smoke.mjs [image]
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { startTempPostgres } from './pg-temp.mjs';

const image = process.argv[2] || 'drivego:smoke';
const PORT = 18080, STAFF_PORT = 18081;
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
const staffDb = `${db.url.replace('//drivego@', '//drivego_staff:smoke-staff-password@')}?sslmode=require`;
const c = new pg.Client({ connectionString: db.url });
await c.connect();
await c.query("create role drivego_app login password 'smoke-app-password'");
// The staff web page's user, made beforehand too (on DigitalOcean in the control panel, docs/DIGITALOCEAN-SETUP.md part 4).
await c.query("create role drivego_staff login password 'smoke-staff-password'");
await c.end();

const docker = args => spawnSync('docker', args, { encoding: 'utf8' });
const job = () => docker(['run', '--rm', '--network', 'host', '-e', `MIGRATE_DATABASE_URL=${owner}`, '-e', 'DATABASE_CA_CERT', '-e', 'SEED_DEMO_SHOPS=1',
  image, 'node', 'tools/deploy-migrate.mjs']);
let web = '', staffWeb = '';
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
  // Every attachment as one zip (answer 11.5): a file uploaded, then the zip streamed by the built app, as long as it says.
  const picture = Buffer.from('image smoke picture');
  const up = await fetch(`${base}/api/files?key=garage.v22&use=picture&name=${encodeURIComponent('รูปทดสอบ')}`, {
    method: 'POST', headers: { cookie: session, 'content-type': 'image/png' }, body: picture });
  if (up.status !== 200) fail(`uploading a file: ${up.status}`);
  const zip = await fetch(`${base}/api/files/zip?key=garage.v22`, { headers: { cookie: session } });
  const zipped = Buffer.from(await zip.arrayBuffer());
  if (zip.status !== 200 || zip.headers.get('content-type') !== 'application/zip' || Number(zip.headers.get('content-length')) !== zipped.length
    || zipped.readUInt32LE(0) !== 0x04034b50 || zipped.readUInt32LE(zipped.length - 22) !== 0x06054b50
    || !zipped.includes(Buffer.from('รูปสินค้า/รูปทดสอบ.png')) || !zipped.includes(picture)) fail(`/api/files/zip: ${zip.status} ${zipped.length} bytes`);
  say('web: every attachment as one zip, streamed as long as it says');

  // The staff tool in the image, as staff run it on the server: a real shop, then a forgotten password.
  const admin = (...args) => docker(['run', '--rm', '--network', 'host', '-e', `MIGRATE_DATABASE_URL=${owner}`, '-e', 'DATABASE_CA_CERT',
    image, 'node', 'tools/shop-admin.mjs', ...args, '--by', 'smoke']);
  const passOf = r => (/temporary password (\S+)/.exec(r.stdout) || [])[1];
  // A connection kept from before a (blocking) docker run may have been closed by the server meanwhile: try again.
  const fetchAgain = async (url, init) => {
    for (let i = 0; ; i++) {
      try { return await fetch(url, init); } catch (e) { if (i > 1 || e.cause?.code !== 'UND_ERR_SOCKET') throw e; }
    }
  };
  const signInAs = pass => fetchAgain(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: 'smoke-real', user: 'smokereal', pass }) });
  const opened = admin('new', 'smoke-real', '--biz', '--trial', '--name', 'อู่ทดสอบ image', '--owner', 'ทดสอบ ระบบ');
  if (opened.status !== 0 || !passOf(opened)) fail(`shop-admin new:\n${opened.stdout}${opened.stderr}`);
  if ((await signInAs(passOf(opened))).status !== 200) fail('the new shop\'s owner could not sign in');
  const reset = admin('password', 'smoke-real');
  if (reset.status !== 0 || !passOf(reset)) fail(`shop-admin password:\n${reset.stdout}${reset.stderr}`);
  if ((await signInAs(passOf(opened))).status === 200 || (await signInAs(passOf(reset))).status !== 200) fail('the new password did not replace the old one');
  say('staff tool: opened a real shop, its owner signed in; a new password replaced the old one');

  // The scheduled job (.do/app.yaml nightly) as App Platform runs it: nothing due today; on a day after the trials
  // ended it lists the real shop to call (and changes nothing) and leaves the demo shops to staff, ending with 3.
  const nightly = (...args) => docker(['run', '--rm', '--network', 'host', '-e', `MIGRATE_DATABASE_URL=${owner}`, '-e', 'DATABASE_CA_CERT',
    image, 'node', 'tools/nightly.mjs', ...args]);
  const tonight = nightly();
  if (tonight.status !== 0 || !/: 0 removal\(s\), 0 file\(s\) removed, 0 shop\(s\) to call, 0 old error\(s\) removed/.test(tonight.stdout)) fail(`nightly:\n${tonight.stdout}${tonight.stderr}`);
  const day = new Date(Date.now() + 200 * 86400_000).toISOString().slice(0, 10);   // trials (60 days) ended, removal (+90) near
  const later = nightly('--day', day);
  if (later.status !== 3 || !/^CALL {3}smoke-real /m.test(later.stdout) || !/^DEMO {3}demo-biz:/m.test(later.stdout)) fail(`nightly --day ${day}:\n${later.stdout}${later.stderr}`);
  if (nightly('--day', day).status !== 3) fail('nightly recorded a notice nobody gave');
  say('nightly job: nothing due today; later it lists the shop to call and the demo shops, and ends with 3');

  // Errors (LAUNCH-CHECKLIST "แจ้งเตือนเมื่อระบบมีปัญหา"): the tests' failing route is not there; a page's error is
  // recorded by the app (insert only) and the hourly job, as App Platform runs it, sees it without alerting for one.
  if ((await fetchAgain(`${base}/api/test-error`)).status !== 404) fail('/api/test-error answers outside the tests');
  const reported = await fetchAgain(`${base}/api/errors`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'image smoke: a page error', detail: 'Error: x\n    at y', path: '/smoke/?q=1' }) });
  if (reported.status !== 204) fail(`/api/errors: ${reported.status}`);
  const watched = docker(['run', '--rm', '--network', 'host', '-e', `MIGRATE_DATABASE_URL=${owner}`, '-e', 'DATABASE_CA_CERT', image, 'node', 'tools/watch.mjs']);
  if (watched.status !== 0 || !/0 server error\(s\), 1 browser error\(s\)/.test(watched.stdout) || !/^BROWSER ×1 - \/smoke\/ .* image smoke: a page error$/m.test(watched.stdout))
    fail(`watch:\n${watched.stdout}${watched.stderr}`);
  say('errors: a page error recorded through /api/errors, the hourly job sees it (one: no alert), no test route');

  // The restore drill's check (docs/RESTORE-DRILL.md) as staff run it from the app's Console: counts per shop, nothing personal.
  const check = docker(['run', '--rm', '--network', 'host', '-e', `MIGRATE_DATABASE_URL=${owner}`, '-e', 'DATABASE_CA_CERT', image,
    'node', 'tools/restore-check.mjs', '--marker', 'อู่ทดสอบ image']);
  if (check.status !== 0 || !/^ร้าน \d+$/m.test(check.stdout) || !/^ {2}demo-biz /m.test(check.stdout) || !/"อู่ทดสอบ image": /.test(check.stdout)
    || /postgres(ql)?:\/\//.test(check.stdout)) fail(`restore-check:\n${check.stdout}${check.stderr}`);
  say('restore check: counts per shop over TLS as the owner, the drill\'s marker searched, no connection string printed');

  // Security review (docs/SECURITY-REVIEW.md): the headers on every answer, and nothing personal before signing in.
  const shopPage = await fetchAgain(`${base}/demo-biz/`);
  for (const [h, v] of [['strict-transport-security', 'max-age=31536000'], ['x-content-type-options', 'nosniff'], ['x-frame-options', 'SAMEORIGIN'],
    ['referrer-policy', 'same-origin']]) if (shopPage.headers.get(h) !== v) fail(`header ${h}: ${shopPage.headers.get(h)}`);
  const shopCsp = shopPage.headers.get('content-security-policy') || '';
  if (!/frame-ancestors 'self'/.test(shopCsp) || !/script-src 'self' /.test(shopCsp)) fail(`content-security-policy: ${shopCsp}`);
  const pub = await (await fetchAgain(`${base}/api/public/smoke-real/dgb.v22`)).json();
  if (JSON.stringify(Object.keys(pub.shop)) !== JSON.stringify(['code', 'name', 'created', 'trialStart', 'licensed', 'licEnd'])) fail(`public shop: ${JSON.stringify(pub.shop)}`);
  say('security: headers on the pages, the sign-in data has no owner, tax ID, address or phone');

  // The staff web page at /ops: off (404) without its connection, as in the web container above; on in a container of
  // the same image given STAFF_DATABASE_URL (drivego_staff). An account added with the staff tool signs in the first
  // time: its own password, the authenticator app, then the shops. The sign-in is a token of the tab, never a cookie.
  for (const p of ['/ops/', '/api/ops/me']) if ((await fetchAgain(`${base}${p}`)).status !== 404) fail(`/ops is on without its connection: ${p}`);
  const added = admin('staff', 'add', 'smoke', '--name', 'ทีมงาน image');
  if (added.status !== 0 || !passOf(added)) fail(`shop-admin staff add:\n${added.stdout}${added.stderr}`);
  const staffRun = docker(['run', '-d', '--network', 'host', '-e', `PORT=${STAFF_PORT}`, '-e', `DATABASE_URL=${app}`,
    '-e', `STAFF_DATABASE_URL=${staffDb}`, '-e', 'DATABASE_CA_CERT', image]);
  if (staffRun.status !== 0) fail(`container with the staff page: ${staffRun.stderr}`);
  staffWeb = staffRun.stdout.trim();
  const sbase = `http://127.0.0.1:${STAFF_PORT}`;
  for (let i = 0; ; i++) {
    try { const r = await fetch(`${sbase}/api/health`); if (r.ok && (await r.json()).db) break; } catch {}
    if (i > 120) fail('the container with the staff page did not answer /api/health with the database in 60 s');
    await new Promise(r => setTimeout(r, 500));
  }
  const ui = await fetchAgain(`${sbase}/ops/`);
  const csp = ui.headers.get('content-security-policy') || '';
  if (ui.status !== 200 || !/src="staff\.js"/.test(await ui.text()) || !/script-src 'self'/.test(csp) || !/frame-ancestors 'none'/.test(csp)) fail(`/ops/: ${ui.status} ${csp}`);
  if ((await fetchAgain(`${sbase}/demo-biz/`)).status !== 200) fail('the shops\' pages are gone with the staff page on');
  const post = (path, body, token = '', origin = sbase) => fetchAgain(`${sbase}/api/ops/${path}`, { method: 'POST',
    headers: { 'content-type': 'application/json', ...origin ? { origin } : {}, ...token ? { authorization: `Bearer ${token}` } : {} }, body: JSON.stringify(body) });
  if ((await post('sign-in', { login: 'smoke', password: passOf(added) }, '', '')).status !== 403) fail('a sign-in without Origin was taken');
  const step1 = await post('sign-in', { login: 'smoke', password: passOf(added) });
  const b1 = await step1.json();
  if (step1.status !== 200 || b1.next !== 'password' || !/^[A-Za-z0-9_-]{43}$/.test(b1.token || '') || step1.headers.get('set-cookie')) fail(`staff sign-in: ${step1.status} ${JSON.stringify(b1).slice(0, 80)}`);
  if ((await (await post('password', { password: 'smoke-staff-own-password' }, b1.token)).json()).next !== 'app') fail('staff new password');
  const { secret } = await (await fetchAgain(`${sbase}/api/ops/app`, { headers: { authorization: `Bearer ${b1.token}` } })).json();
  const { codeAt, stepAt } = await import('../server/lib/totp.ts');
  const step2 = await post('code', { code: codeAt(secret, stepAt(Date.now())) }, b1.token);
  const b2 = await step2.json();
  if (step2.status !== 200 || !b2.token) fail(`staff app code: ${step2.status}`);
  const shops = await (await fetchAgain(`${sbase}/api/ops/shops`, { headers: { authorization: `Bearer ${b2.token}` } })).json();
  if (!['demo-biz', 'smoke-real'].every(code => shops.shops?.some(x => x.code === code))) fail(`staff shops: ${JSON.stringify(shops).slice(0, 300)}`);
  if ((await fetchAgain(`${sbase}/api/ops/shops`)).status !== 401) fail('the shops were listed without the token');
  const contact = await post('shops/smoke-real', { action: 'contact', contact: 'image smoke' }, b2.token);
  if (contact.status !== 200 || (await contact.json()).licence?.contact !== 'image smoke') fail(`staff contact: ${contact.status}`);
  say('staff page: /ops off without its connection, on with it (strict CSP); first sign-in with its own password and app code; every shop listed; a change logged');
  console.log('image smoke test passed');
} catch (e) {
  if (web) console.error(docker(['logs', web]).stdout.slice(-3000), docker(['logs', web]).stderr.slice(-3000));
  if (staffWeb) console.error(docker(['logs', staffWeb]).stdout.slice(-3000), docker(['logs', staffWeb]).stderr.slice(-3000));
  console.error(String(e.message || e));
  process.exitCode = 1;
} finally {
  if (web) docker(['rm', '-f', web]);
  if (staffWeb) docker(['rm', '-f', staffWeb]);
  await db.stop();
  rmSync(dir, { recursive: true, force: true });
}
