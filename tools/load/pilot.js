// k6 load test at pilot size (LAUNCH-CHECKLIST stage 1, docs/LOAD-TEST.md): several shops, several devices in each,
// all opening the program in the morning at about the same time and then doing repair jobs one after another.
// Each device sends what a real browser sends, recorded from the real screens by tools/load/capture.mjs:
//   - opening the program and signing in (every request, in order; the 36-month data is read whole),
//   - the live updates stream (held open as the browser does) and, for every save, the other devices of the shop
//     asking for the rows it changed (what they do when the stream tells them),
//   - a repair job: quotation → approval → stock cut paid in cash (three saves), with new record ids and the next
//     document numbers each time, the rows it changes read first as a browser that heard them would have them.
// Run it with tools/load-test.mjs, which opens the shops, records the job and reads the results; by hand:
//   k6 run -e BASE_URL=http://127.0.0.1:3000 -e SHOPS=load-1,load-2 -e USER=dg1688 -e PASS=… \
//          -e CAPTURE=/abs/path/capture.json tools/load/pilot.js
// Settings (-e NAME=value): DEVICES per shop (5), MINUTES of work after opening (5), THINK seconds between two
// saves of a device, "min-max" (5-15), RAMP seconds over which the devices open the program (10), SUMMARY a file
// for the results as JSON.
// Only async requests are used (http.asyncRequest), so tools/load/k6-node can run the same file without k6.
import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';
import { Counter, Rate, Trend } from 'k6/metrics';
import { setTimeout } from 'k6/timers';

const BASE = (__ENV.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const SHOPS = (__ENV.SHOPS || 'load-1').split(',').map(s => s.trim()).filter(Boolean);
const USER = __ENV.USER || 'dg1688';
const PASS = __ENV.PASS || '';
const DEVICES = Number(__ENV.DEVICES || 5);
const MINUTES = Number(__ENV.MINUTES || 5);
const [THINK_MIN, THINK_MAX] = (__ENV.THINK || '5-15').split('-').map(Number);
const RAMP = Number(__ENV.RAMP || 10);
const CAPTURE = JSON.parse(open(__ENV.CAPTURE || './capture.json'));
const VUS = DEVICES * SHOPS.length;

export const options = {
  scenarios: {
    devices: { executor: 'per-vu-iterations', vus: VUS, iterations: 1, maxDuration: `${Math.ceil(MINUTES + RAMP / 60 + 5)}m`, gracefulStop: '60s' },
  },
  thresholds: {
    login_ms: ['p(95)<1500'],
    open_ms: ['p(95)<8000'],
    save_ms: ['p(95)<1000'],
    hear_ms: ['p(95)<500'],
    save_ok: ['rate>0.99'],
    failures: ['count==0'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max', 'count'],
};

const loginMs = new Trend('login_ms', true);
const openMs = new Trend('open_ms', true);      // GET garage.v22: the shop's whole data
const bootMs = new Trend('boot_ms', true);      // from the first request to the program ready, sign-in included
const saveMs = new Trend('save_ms', true);
const hearMs = new Trend('hear_ms', true);      // another device asking for the rows a save changed
const jobMs = new Trend('job_ms', true);        // the three saves of a job, without the time between them
const saveOk = new Rate('save_ok');
const jobs = new Counter('jobs');
const conflicts = new Counter('conflicts');     // 409: a row changed by another device in between (the app reloads)
const renumbered = new Counter('renumbered');   // a document number another device took first (the server gives the next)
const failures = new Counter('failures');       // any other answer that is not what the browser expects

// ---- what the capture says ---------------------------------------------------------------------------------------
const vk = (unit, key) => `${unit}|${key}`;
const COUNTERS = 'DB.seq';
// Records a job creates: their first save answered version 1 (the counters are not records: their key is the
// number's base, and the server keeps them).
const NEW = new Set();
{
  const seen = new Set();
  for (const s of CAPTURE.job) {
    if (s.body.changes.layout !== undefined) throw new Error(`the recorded ${s.step} save changes the data's layout: record the job again`);
    for (const r of s.body.changes.upsert) {
      const k = vk(r.unit, r.key);
      if (!seen.has(k) && r.unit !== COUNTERS && s.answer.versions[k] === 1) NEW.add(k);
      seen.add(k);
    }
  }
}
const NEW_IDS = [...new Set([...NEW].map(k => k.slice(k.indexOf('|') + 1)))];

// ---- helpers -----------------------------------------------------------------------------------------------------
const pause = s => new Promise(r => setTimeout(r, s * 1000));
const think = () => pause(THINK_MIN + Math.random() * Math.max(0, THINK_MAX - THINK_MIN));
const header = (res, name) => {
  for (const k of Object.keys(res.headers || {})) if (k.toLowerCase() === name) return res.headers[k];
  return '';
};
const newId = () => ('k' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 13);
const replaceAll = (text, map) => {
  for (const [from, to] of map) text = text.split(from).join(to);
  return text;
};

async function call(method, path, body, { cookie = '', tag, timeout = '120s', none = false } = {}) {
  const params = { headers: {}, tags: { name: tag || `${method} ${path.replace(/\?.*/, '')}` }, timeout, responseType: none ? 'none' : 'text' };
  if (cookie) params.headers.Cookie = cookie;
  if (body !== null && body !== undefined) params.headers['Content-Type'] = typeof body === 'string' && body[0] !== '{' ? 'text/plain;charset=UTF-8' : 'application/json';
  return http.asyncRequest(method, BASE + path, body ?? null, params);
}

let shown = 0;
function expect(res, what, ok = s => s >= 200 && s < 300) {
  const good = ok(res.status);
  check(res, { [what]: () => good });
  if (!good) {
    failures.add(1, { what });
    if (shown++ < 5) console.warn(`${what}: ${res.status} ${String(res.body || res.error || '').slice(0, 300)}`);
  }
  return good;
}

// ---- one device --------------------------------------------------------------------------------------------------
export default async function () {
  const vu = exec.vu.idInTest;
  const shop = SHOPS[(vu - 1) % SHOPS.length];
  const ends = Date.now() + (RAMP + MINUTES * 60) * 1000;
  await pause(Math.random() * RAMP);

  // Opening the program and signing in, as recorded (the shop's code and the password are this run's).
  const started = Date.now();
  const path = p => p.split(`/api/public/${CAPTURE.shop}/`).join(`/api/public/${shop}/`);
  let cookie = '', cursor = 0, i = 0;
  const boot = CAPTURE.boot;
  while (i < boot.length) {
    const b = boot[i];
    if (b.method === 'POST' && b.path === '/api/auth/login') {
      const res = await call('POST', b.path, JSON.stringify({ code: shop, user: USER, pass: PASS }), { tag: 'login' });
      loginMs.add(res.timings.duration);
      if (!expect(res, 'sign in')) return;
      cookie = String(header(res, 'set-cookie')).split(';')[0];
      i++;
      continue;
    }
    // Requests one after another of the same kind (reads) go together, as the browser sends them.
    const group = [b];
    while (b.method === 'GET' && i + group.length < boot.length && boot[i + group.length].method === 'GET'
      && boot[i + group.length].signedIn === b.signedIn) group.push(boot[i + group.length]);
    i += group.length;
    const answers = await Promise.all(group.map(g => {
      const main = g.method === 'GET' && /^\/api\/storage\/garage\.v22$/.test(g.path);
      const body = g.body === null ? null : g.body.split('__PASS__').join(PASS);
      return call(g.method, path(g.path), body, { cookie: g.signedIn ? cookie : '', tag: main ? 'open' : undefined, none: main });
    }));
    answers.forEach((res, n) => {
      const g = group[n];
      if (g.method === 'GET' && /^\/api\/storage\/garage\.v22$/.test(g.path) && g.signedIn) {
        openMs.add(res.timings.duration);
        cursor = Number(header(res, 'x-drivego-live')) || 0;
      }
      // Before signing in the browser reads what it may (401 for the rest).
      expect(res, `open: ${g.method} ${g.path.replace(/\?.*/, '')}`, s => (s >= 200 && s < 300) || (!g.signedIn && (s === 401 || s === 404)) || s === 404);
    });
  }
  if (!cookie) return;
  bootMs.add(Date.now() - started);

  // The live updates stream, open until the end (the server sends a ping every 3 s; nothing is read from it here).
  call('GET', `/api/live?since=${cursor}`, null, { cookie, tag: 'live', none: true, timeout: `${Math.max(1, Math.ceil((ends - Date.now()) / 1000) + 5)}s` });

  // Repair jobs until the time is up.
  while (Date.now() < ends) {
    const ids = new Map(NEW_IDS.map(id => [id, newId()]));
    const numbers = new Map();
    const made = {};          // versions of the records this job created
    let jobTime = 0, ok = true;
    for (const s of CAPTURE.job) {
      await think();
      if (Date.now() >= ends) { ok = false; break; }
      const t = await save(s, cookie, ids, numbers, made);
      if (t < 0) { ok = false; break; }
      jobTime += t;
    }
    if (ok) { jobs.add(1); jobMs.add(jobTime); }
  }
}

// The rows of a save that were there before the job, as the server has them now: [{unit, key, data, version}].
async function hear(rows, cookie, tag = 'hear') {
  if (!rows.length) return [];
  const res = await call('POST', '/api/storage/garage.v22/rows', JSON.stringify({ rows, ordered: [] }), { cookie, tag });
  hearMs.add(res.timings.duration);
  if (!expect(res, 'rows')) return null;
  return JSON.parse(res.body).rows;
}

// One recorded save, sent again; returns its time in ms, or -1. A save another device's save got in the way of
// (409) is done again after reading the data again, as a person does after the program reloads, up to TRIES times.
const TRIES = 3;
async function save(s, cookie, ids, numbers, made, tries = TRIES) {
  const before = s.body.changes.upsert.concat(s.body.changes.remove).filter(r => !NEW.has(vk(r.unit, r.key)));
  const heard = await hear(before.map(r => [r.unit, r.key]), cookie);
  if (!heard) return -1;
  const now = new Map(heard.map(r => [vk(r.unit, r.key), r]));
  // The next number of each counter the save issues a number from.
  const counters = new Map();
  for (const [base, nos] of Object.entries(s.body.numbers || {})) {
    let last = Number(now.get(vk(COUNTERS, base))?.data) || 0;
    for (const no of nos) {
      last++;
      numbers.set(no, base + String(last).padStart(no.length - base.length, '0'));
    }
    counters.set(base, last);
  }
  const body = JSON.parse(replaceAll(JSON.stringify(s.body), [...ids, ...numbers]));
  for (const r of body.changes.upsert) if (r.unit === COUNTERS && counters.has(r.key)) r.data = String(counters.get(r.key));
  body.base = {};
  for (const r of body.changes.upsert.concat(body.changes.remove)) {
    const k = vk(r.unit, r.key);
    if (made[k] !== undefined) body.base[k] = made[k];
    else if (now.has(k)) body.base[k] = now.get(k).version;
  }
  const res = await call('POST', '/api/storage/garage.v22', JSON.stringify(body), { cookie, tag: `save ${s.step}` });
  saveMs.add(res.timings.duration, { step: s.step });
  if (res.status === 409 && tries > 1) {
    conflicts.add(1);
    saveOk.add(true);
    const again = await call('GET', '/api/storage/garage.v22', null, { cookie, tag: 'reload', none: true });
    expect(again, 'reload');
    const t = await save(s, cookie, ids, numbers, made, tries - 1);
    return t < 0 ? -1 : t + res.timings.duration;
  }
  const good = expect(res, `save ${s.step}`);
  saveOk.add(good);
  if (!good) return -1;
  const answer = JSON.parse(res.body);
  for (const [k, v] of Object.entries(answer.versions)) if (!now.has(k) && !k.startsWith(`${COUNTERS}|`)) made[k] = v;
  for (const [from, to] of answer.renumbered || []) {
    renumbered.add(1);
    for (const [no, issued] of numbers) if (issued === from) numbers.set(no, to);
  }
  // The other devices of the shop hear of the save and ask for its rows.
  const rows = Object.keys(answer.versions).map(k => [k.slice(0, k.indexOf('|')), k.slice(k.indexOf('|') + 1)]);
  await Promise.all(Array.from({ length: DEVICES - 1 }, () => hear(rows, cookie, 'hear (other devices)')));
  return res.timings.duration;
}

// ---- results -----------------------------------------------------------------------------------------------------
export function handleSummary(data) {
  const m = data.metrics;
  const ms = v => (v === undefined ? '-' : `${Math.round(v)} ms`);
  const trend = (name, label) => {
    const v = m[name]?.values;
    return v ? `${label.padEnd(34)} p95 ${ms(v['p(95)']).padStart(9)}  median ${ms(v.med).padStart(9)}  max ${ms(v.max).padStart(9)}  (${v.count ?? '?'})` : `${label}: none`;
  };
  const count = name => m[name]?.values?.count ?? 0;
  const failed = Object.entries(m).flatMap(([name, x]) => Object.entries(x.thresholds || {}).filter(([, t]) => !t.ok).map(([expr]) => `${name} ${expr}`));
  const lines = [
    '',
    `DriveGo load test: ${SHOPS.length} shop(s) × ${DEVICES} device(s), ${MINUTES} min, ${THINK_MIN}-${THINK_MAX} s between saves`,
    trend('login_ms', 'sign in'),
    trend('open_ms', 'read the whole data (garage.v22)'),
    trend('boot_ms', 'open the program (sign in included)'),
    trend('save_ms', 'save'),
    trend('hear_ms', 'rows asked after a save'),
    trend('job_ms', 'repair job (3 saves)'),
    `jobs done ${count('jobs')} · conflicts ${count('conflicts')} · renumbered ${count('renumbered')} · failures ${count('failures')}`,
    failed.length ? `THRESHOLDS NOT MET: ${failed.join('; ')}` : 'all thresholds met',
    '',
  ];
  const out = { stdout: lines.join('\n') };
  if (__ENV.SUMMARY) {
    out[__ENV.SUMMARY] = JSON.stringify(data, null, 1);
    out[__ENV.SUMMARY.replace(/\.json$/, '') + '.txt'] = lines.join('\n');
  }
  return out;
}
