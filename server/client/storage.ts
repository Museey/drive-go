// window.storage for the legacy screens (docs/PHASE2-DESIGN.md §4.1): the
// "host" storage the legacy STORE was already written for, kept on the server.
// Built into frontend/js/00-server-storage.js by tools/build-client.mjs and
// loaded before every legacy script.
//
//   get(key)          main data keys come from the server once, then from the
//                     copy kept here (save() reads its own last write back);
//                     other keys are read from the server
//   set(key, value)   main data keys: only the rows that changed are sent;
//                     backup points: the server copies its own data
//   delete(key), list()
//   signIn, signOut, checkSecret   used by the legacy sign-in screens (frontend/CHANGES.md)
//
// All writes go out one at a time, in call order. A save the server refuses
// because someone else saved first (decision P1) asks the user to reload.
//
// Before signing in, the app gets only what the sign-in screen needs (the
// server's /api/public) and nothing it writes is sent. Passwords never travel
// with the data: the server sends a placeholder, and a password the user types
// is split off and sent once, to be stored as a hash (design §3.2).
import { type Split, SECRET_PLACEHOLDER, assemble, diff, rootOf, split } from '../lib/units.ts';

const API = '/api/storage';
// The legacy app later wraps window.fetch to show its loading overlay on every
// call; saves happen in the background and must not cover the screen.
const fetch0 = window.fetch.bind(window);

const MESSAGES = {   // decision Q5
  conflict: 'มีคนแก้ข้อมูลนี้จากเครื่องอื่นก่อนหน้า สิ่งที่เพิ่งทำยังไม่ถูกบันทึก — กดตกลงเพื่อโหลดข้อมูลล่าสุด',
  offline: 'บันทึกไม่สำเร็จ — เชื่อมต่อ server ไม่ได้ ระบบจะลองใหม่อัตโนมัติ อย่าเพิ่งปิดหน้านี้',
  signedOut: 'หมดเวลาการเข้าระบบ กรุณาเข้าสู่ระบบใหม่',
  lockedOut: 'กรอกรหัสผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่',
};

// The shop's address is /<shop code>/ (decision Q1).
const SHOP = decodeURIComponent(location.pathname.split('/')[1] || '');
// Whether this browser has a session: unknown until the first answer.
let signedIn: boolean | null = null;

interface Main {
  value: string | null;          // what get() returns: the app's latest write
  sent: string | null;           // the value the server has confirmed
  last: Split | null;            // split of `sent`
  base: Record<string, number>;  // row versions the server confirmed
}
const mains = new Map<string, Main>();
const vk = (unit: string, key: string) => `${unit}|${key}`;
const url = (key: string) => `${API}/${encodeURIComponent(key)}`;
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// Problems are kept for the tests (window.storage.problems), which require none.
const problems: string[] = [];

// One write at a time, in the order the app made them.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job);
  queue = run.catch(() => {});
  return run;
}

declare global {
  interface Window { toast?: (m: string) => void; askP?: (o: object) => Promise<boolean> }
}

// Asks the user to reload, then reloads. Never resolves: nothing else may be
// written on top of a refused save.
async function mustReload(text: string, why: string): Promise<never> {
  problems.push(why);
  // The legacy spinner covers the screen while a save runs, and this save
  // never ends: keep it off the question.
  const style = document.createElement('style');
  style.textContent = '#pkg-loading{display:none!important}';
  document.head.append(style);
  try {
    if (typeof window.askP === 'function') await window.askP({ title: 'โหลดข้อมูลใหม่', text, yes: 'ตกลง', no: '' });
    else window.alert(text);
  } finally {
    location.reload();
  }
  return new Promise<never>(() => {});
}

// Sends a request, retrying while the server cannot be reached. Returns the
// response for any answer the server gave (including 409 / 401).
async function send(input: string, init: RequestInit, saving: boolean): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch0(input, { cache: 'no-store', credentials: 'same-origin', ...init });
      if (r.status < 500) return r;
    } catch { /* network error: retry */ }
    if (attempt === 0) problems.push(`unreachable: ${init.method || 'GET'} ${input}`);
    if (saving && attempt === 0 && typeof window.toast === 'function') window.toast(MESSAGES.offline);
    await wait(Math.min(10_000, 500 * 2 ** attempt));
  }
}

async function readMain(key: string): Promise<Main> {
  const r = await send(url(key), {}, false);
  const m: Main = { value: null, sent: null, last: null, base: {} };
  if (r.status === 200) {
    signedIn = true;
    const body = await r.text();
    const nl = body.indexOf('\n');
    m.base = JSON.parse(body.slice(0, nl));
    m.value = m.sent = body.slice(nl + 1);
    m.last = split(key, m.sent);
  } else if (r.status === 401) {
    signedIn = false;
    const pub = await send(`/api/public/${encodeURIComponent(SHOP)}/${encodeURIComponent(key)}`, {}, false);
    if (pub.status === 200) m.value = await pub.text();
  } else if (r.status !== 404) {
    problems.push(`read ${key}: ${r.status}`);
  }
  return m;
}

// Passwords the user typed since the last save (the rows keep the placeholder).
function newSecrets(before: Split | null, next: Split) {
  const was = new Map((before?.secrets || []).map(s => [`${s.unit}|${s.key}|${s.field}`, s.value]));
  return next.secrets.filter(s => s.value !== SECRET_PLACEHOLDER && was.get(`${s.unit}|${s.key}|${s.field}`) !== s.value);
}

// Sends what changed in a main key since the server's last confirmed value.
async function flush(key: string): Promise<void> {
  const m = mains.get(key)!;
  const value = m.value;
  if (value === null || value === m.sent || !signedIn) return;
  const next = split(key, value);
  const secrets = newSecrets(m.last, next);
  const changes = m.last ? diff(m.last, next)
    : { layout: next.layout, upsert: next.rows, remove: [], order: {} };
  const sessionChanged = JSON.stringify(next.session) !== JSON.stringify(m.last?.session ?? {});
  if (changes.layout === undefined && !changes.upsert.length && !changes.remove.length && !Object.keys(changes.order).length && !sessionChanged && !secrets.length) {
    m.sent = value; m.last = next;
    return;
  }
  const root = rootOf(key)!;
  const base: Record<string, number> = {};
  const known = (unit: string, k: string) => { const v = m.base[vk(unit, k)]; if (v !== undefined) base[vk(unit, k)] = v; };
  if (changes.layout !== undefined) known(root, key);
  for (const r of changes.upsert) known(r.unit, r.key);
  for (const r of changes.remove) known(r.unit, r.key);
  const r = await send(url(key), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ base, changes, session: next.session, secrets }),
  }, true);
  if (r.status === 409) return mustReload(MESSAGES.conflict, `conflict ${key}: ${JSON.stringify((await r.json()).conflicts)}`);
  if (r.status === 401) return mustReload(MESSAGES.signedOut, `signed out while saving ${key}`);
  if (!r.ok) { problems.push(`save ${key}: ${r.status} ${await r.text()}`); return; }
  const { versions } = await r.json() as { versions: Record<string, number> };
  Object.assign(m.base, versions);
  for (const x of changes.remove) delete m.base[vk(x.unit, x.key)];
  m.sent = value;
  m.last = next;
}

// The legacy scripts keep wrapping the app's functions while the page loads.
// Data handed over before the last of them has run would be shown through
// only some of the wrappers (the legacy app's own start-up race: with fast
// local data its first screen showed figures that a later script corrects),
// so the app gets its data once every script has run.
const scriptsLoaded = new Promise<void>(resolve => {
  if (document.readyState !== 'loading') resolve();
  else document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
});

const storage = {
  async get(key: string): Promise<{ key: string; value: string } | null> {
    if (rootOf(key)) {
      let m = mains.get(key);
      if (!m) { m = await readMain(key); if (!mains.has(key)) mains.set(key, m); else m = mains.get(key)!; }
      await scriptsLoaded;
      return m.value === null ? null : { key, value: m.value };
    }
    await queue;   // see the app's own earlier writes (a backup point it just made)
    const r = await send(url(key), {}, false);
    return r.status === 200 ? { key, value: await r.text() } : null;
  },

  async set(key: string, value: string): Promise<{ key: string; value: string }> {
    if (signedIn === false) {
      // Signed out: the app may write while it starts; none of it is kept.
      if (rootOf(key)) (mains.get(key) ?? mains.set(key, { value: null, sent: null, last: null, base: {} }).get(key)!).value = value;
      return { key, value };
    }
    if (rootOf(key)) {
      const m = mains.get(key) ?? { value: null, sent: null, last: null, base: {} };
      mains.set(key, m);
      m.value = value;
      await enqueue(() => flush(key));
    } else {
      // Backup points are copied on the server from its own data, so their
      // (whole-data) value is not uploaded.
      const backup = /\.bak\./.test(key);
      await enqueue(async () => {
        const r = await send(url(key), { method: 'PUT', body: backup ? '' : value }, true);
        if (!r.ok) problems.push(`put ${key}: ${r.status}`);
      });
    }
    return { key, value };
  },

  async delete(key: string): Promise<{ key: string; deleted: boolean }> {
    if (signedIn === false) return { key, deleted: false };
    await enqueue(async () => {
      const r = await send(url(key), { method: 'DELETE' }, true);
      if (!r.ok) problems.push(`delete ${key}: ${r.status}`);
      if (rootOf(key)) mains.set(key, { value: null, sent: null, last: null, base: {} });
    });
    return { key, deleted: true };
  },

  // Every key, like IndexedDB's keys() (callers filter by prefix themselves).
  async list(_prefix?: string): Promise<{ keys: string[] }> {
    if (signedIn === false) return { keys: [] };
    await queue;
    const r = await send(API, {}, false);
    return r.ok ? await r.json() as { keys: string[] } : { keys: [] };
  },

  get signedIn() { return signedIn === true; },

  // Signs in at this shop. The server decides, with the legacy app's rules and
  // messages; on success everything is read again, now with the shop's data.
  async signIn(user: string, pass: string): Promise<{ ok: true } | { ok: false; error: string }> {
    await queue;
    const r = await send('/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: SHOP, user, pass }),
    }, false);
    const body = await r.json().catch(() => ({})) as { error?: string };
    if (!r.ok) return { ok: false, error: body.error || 'เข้าสู่ระบบไม่สำเร็จ' };
    signedIn = true;
    mains.clear();
    return { ok: true };
  },

  // Ends the session once the app's own saves are done.
  async signOut(): Promise<void> {
    await queue;
    // The tests check after every scenario that the server holds what the app
    // saved; a sign-out would drop that copy, so they check here too.
    if ((window as unknown as { __drivegoTest?: boolean }).__drivegoTest)
      for (const key of (await storage.verify()).wrong) problems.push(`not on the server at sign-out: ${key}`);
    await send('/api/auth/logout', { method: 'POST' }, false);
    signedIn = false;
    mains.clear();
  },

  // A password or PIN the legacy screens used to compare in the browser.
  async checkSecret(storeKey: string, unit: string, key: string, field: string, value: unknown): Promise<boolean> {
    const r = await send('/api/auth/check', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ storeKey, unit, key, field, value: String(value ?? '') }),
    }, false);
    const body = await r.json().catch(() => ({})) as { ok?: boolean; locked?: boolean };
    if (body.locked && typeof window.toast === 'function') window.toast(MESSAGES.lockedOut);
    return r.ok && body.ok === true;
  },

  // For the tests: resolves when every write so far has been answered.
  idle: () => queue.then(() => {}),
  problems,
  // For the tests: whether the server holds exactly what the app last wrote,
  // for every main data key the app used (passwords as placeholders).
  async verify(): Promise<{ checked: string[]; wrong: string[] }> {
    await queue;
    const checked: string[] = [], wrong: string[] = [];
    if (!signedIn) return { checked, wrong };
    for (const [key, m] of mains) {
      if (m.value === null) continue;
      checked.push(key);
      const r = await fetch0(url(key), { cache: 'no-store' });
      const body = await r.text();
      const s = split(key, m.value);
      const expected = assemble(key, s.layout, s.rows, { session: s.session });
      if (r.status !== 200 || body.slice(body.indexOf('\n') + 1) !== expected) wrong.push(key);
    }
    return { checked, wrong };
  },
};

(window as unknown as { storage: typeof storage }).storage = storage;
