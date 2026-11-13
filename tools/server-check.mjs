// Checks a running server from outside, the way a browser reaches it (docs/LAUNCH-CHECKLIST.md stage 1, "ทดสอบบน server
// จริง"), with two shops' accounts (the test server's demo shops by default). Leaves the shops' data as it was: the
// marks it writes are keys of their own (not the shop's data), removed at the end.
//   1. health, and Row-Level Security for the app's database connection (/api/health?deep=1)
//   2. no session: refused · each shop's session reads its own data · a mark one shop writes cannot be read by the other
//   3. a request as big as a save may be (29 MB): through the platform's proxy and back, then removed
//   4. the live updates' connection (/api/live): how long it stays open, the pings it gets; if the platform cuts it, the
//      browser reconnects by itself (server/client/live.ts) — the time is reported so we know how often
//
//   node tools/server-check.mjs [--url https://…] [--a demo-biz] [--b demo-prox] [--live-seconds 330] [--no-big]
//   CHECK_USER / CHECK_PASS (default: the demo shops' owner dg1688 / 123456; a real shop's accounts never go in a file)
import { randomBytes } from 'node:crypto';

const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const URL_ = (arg('--url', process.env.SERVER_URL || 'https://drivego-test-asaao.ondigitalocean.app')).replace(/\/$/, '');
const A = arg('--a', 'demo-biz'), B = arg('--b', 'demo-prox');
const USER = process.env.CHECK_USER || 'dg1688', PASS = process.env.CHECK_PASS || '123456';
const LIVE_S = Number(arg('--live-seconds', '330'));
const results = [];
const ok = (what, pass, detail = '') => { results.push({ what, pass, detail }); console.log(`${pass ? '✓' : '✗'} ${what}${detail ? ' — ' + detail : ''}`); };

async function signIn(code) {
  const r = await fetch(`${URL_}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code, user: USER, pass: PASS }) });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  if (r.status !== 200 || !cookie) throw new Error(`sign in at ${code}: ${r.status} ${await r.text()}`);
  return cookie;
}
const get = (path, cookie) => fetch(`${URL_}${path}`, { headers: cookie ? { cookie } : {} });

// 1
{
  const r = await get('/api/health?deep=1');
  const h = await r.json().catch(() => ({}));
  ok('health', r.status === 200 && h.ok === true && h.db === true, JSON.stringify(h));
  if ('rls' in h) ok('Row-Level Security holds for the app (its role cannot skip it; as a shop that does not exist, no rows)', h.rls === true, String(h.rls));
  else ok('Row-Level Security reported (server older than this check)', false, 'no "rls" in /api/health?deep=1');
}

// 2
const ca = await signIn(A), cb = await signIn(B);
{
  const r = await get('/api/storage/garage.v22');
  ok('no session: the data is refused', r.status === 401, String(r.status));
  for (const [code, cookie] of [[A, ca], [B, cb]]) {
    const t0 = Date.now(), d = await get('/api/storage/garage.v22', cookie), body = await d.text();
    ok(`${code}: its own data`, d.status === 200 && body.includes('\n'), `${d.status}, ${(body.length / 1e6).toFixed(1)} MB in ${Date.now() - t0} ms`);
  }
  const key = `server-check.${randomBytes(6).toString('hex')}`, mark = randomBytes(16).toString('hex');
  const put = await fetch(`${URL_}/api/storage/${key}`, { method: 'PUT', headers: { cookie: ca }, body: mark });
  ok(`${A} writes a mark of its own`, put.status === 200, String(put.status));
  const own = await get(`/api/storage/${key}`, ca);
  ok(`${A} reads its mark back`, own.status === 200 && (await own.text()) === mark, String(own.status));
  const other = await get(`/api/storage/${key}`, cb);
  const seen = other.status === 200 ? await other.text() : '';
  ok(`${B} cannot read ${A}'s mark`, seen !== mark, `${other.status}`);
  const del = await fetch(`${URL_}/api/storage/${key}`, { method: 'DELETE', headers: { cookie: ca } });
  const gone = await get(`/api/storage/${key}`, ca);
  ok(`${A}'s mark removed`, del.status === 200 && gone.status === 404, `${del.status} / ${gone.status}`);
}

// 3
if (!process.argv.includes('--no-big')) {
  const key = `server-check.big.${randomBytes(6).toString('hex')}`;
  const big = randomBytes(29 * 1024 * 1024 / 2).toString('hex');   // 29 MB of text, as a save is
  const t0 = Date.now();
  const put = await fetch(`${URL_}/api/storage/${key}`, { method: 'PUT', headers: { cookie: ca }, body: big });
  const sent = Date.now() - t0;
  const back = await get(`/api/storage/${key}`, ca);
  const text = back.status === 200 ? await back.text() : '';
  ok('a 29 MB request goes through and comes back whole', put.status === 200 && text === big, `PUT ${put.status} in ${sent} ms, GET ${back.status} ${(text.length / 1e6).toFixed(1)} MB`);
  const del = await fetch(`${URL_}/api/storage/${key}`, { method: 'DELETE', headers: { cookie: ca } });
  ok('the 29 MB mark removed', del.status === 200, String(del.status));
}

// 4
{
  const ctl = new AbortController(), t0 = Date.now();
  let pings = 0, closed = '', last = t0, gap = 0;
  const stop = setTimeout(() => ctl.abort(), LIVE_S * 1000);
  try {
    const r = await fetch(`${URL_}/api/live?since=0`, { headers: { cookie: ca, accept: 'text/event-stream' }, signal: ctl.signal });
    if (r.status !== 200) closed = `status ${r.status}`;
    else {
      const reader = r.body.getReader(), dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) { closed = 'closed by the server or the platform'; break; }
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const ev = buf.slice(0, i); buf = buf.slice(i + 2);
          if (/^event: ping/m.test(ev)) { pings++; const now = Date.now(); gap = Math.max(gap, now - last); last = now; }
        }
      }
    }
  } catch (e) {
    closed = ctl.signal.aborted ? '' : `error: ${e.message}`;
  } finally { clearTimeout(stop); }
  const secs = Math.round((Date.now() - t0) / 1000);
  ok(`live updates: open ${secs} s${closed ? ' then ' + closed : ` (the check stopped at ${LIVE_S} s)`}`, pings > 0 && gap < 8000,
    `${pings} pings, longest gap ${(gap / 1000).toFixed(1)} s${closed ? ' — the browser reconnects by itself' : ''}`);
}

await fetch(`${URL_}/api/auth/logout`, { method: 'POST', headers: { cookie: ca } }).catch(() => {});
await fetch(`${URL_}/api/auth/logout`, { method: 'POST', headers: { cookie: cb } }).catch(() => {});
const bad = results.filter(r => !r.pass);
console.log(bad.length ? `\n${bad.length} of ${results.length} checks failed` : `\nall ${results.length} checks passed`);
process.exitCode = bad.length ? 1 : 0;
