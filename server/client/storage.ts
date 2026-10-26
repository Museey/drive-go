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
// Other devices' saves come in as they happen (task 3.10, ./live.ts).
//
// Before signing in, the app gets only what the sign-in screen needs (the
// server's /api/public) and nothing it writes is sent. Passwords never travel
// with the data: the server sends a placeholder, and a password the user types
// is split off and sent once, to be stored as a hash (design §3.2).
import { type Counters, type Issued, type Renumbered, baseOf, claimsIn, correctSplit, isRow, renumberValue, rowsToRenumber, setCounters, shiftLater } from '../lib/numbers.ts';
import { type Split, SECRET_PLACEHOLDER, assemble, diff, eachRecord, rootOf, split } from '../lib/units.ts';
import { type Mask, maskRows } from '../lib/visibility.ts';
import { type Refused, linkInPlace, setSpace, space, uploadFiles, withLinks } from './files.ts';
import { createLive } from './live.ts';
import { dataToMain } from '../lib/branch-stock.ts';

const API = '/api/storage';
// The legacy app later wraps window.fetch to show its loading overlay on every
// call; saves happen in the background and must not cover the screen.
const fetch0 = window.fetch.bind(window);

const MESSAGES = {   // decision Q5
  conflict: 'มีคนแก้ข้อมูลนี้จากเครื่องอื่นก่อนหน้า สิ่งที่เพิ่งทำยังไม่ถูกบันทึก — กดตกลงเพื่อโหลดข้อมูลล่าสุด',
  offline: 'บันทึกไม่สำเร็จ — เชื่อมต่อ server ไม่ได้ ระบบจะลองใหม่อัตโนมัติ อย่าเพิ่งปิดหน้านี้',
  signedOut: 'หมดเวลาการเข้าระบบ กรุณาเข้าสู่ระบบใหม่',
  notAllowed: 'บันทึกไม่สำเร็จ — บัญชีนี้ไม่มีสิทธิ์แก้ข้อมูลส่วนนี้ กดตกลงเพื่อโหลดข้อมูลล่าสุด',   // task T10, owner 2026-10-19
  lockedOut: 'กรอกรหัสผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่',
  // task 3.15, decision 15.3: after the licence's last day the shop is read-only
  expired: 'บันทึกไม่สำเร็จ — โปรแกรมหมดอายุการใช้งานแล้ว ยังเปิดดู พิมพ์ และส่งออกข้อมูลได้ แต่สร้างหรือแก้ไขข้อมูลไม่ได้จนกว่าจะต่ออายุ (โทร. 082-1087000) กดตกลงเพื่อโหลดข้อมูลล่าสุด',
  // task 3.2, decision R1-ก, owner 2026-10-23: the number a document got when the one it showed was taken
  // task 3.11 (R19-ค, answers 11.2 and 11.4): a file the server would not keep
  fileTooLarge: 'บันทึกไม่สำเร็จ — ไฟล์แนบใหญ่เกิน 5 MB (คลิปเกิน 15 MB) กรุณาลดขนาดไฟล์ก่อนแนบ กดตกลงเพื่อโหลดข้อมูลล่าสุด',
  spaceFull: 'บันทึกไม่สำเร็จ — พื้นที่ไฟล์ของร้านเต็มแล้ว (2 GB) แนบรูปสินค้า ไฟล์คลังความรู้ และคลิปไม่ได้ กดตกลงเพื่อโหลดข้อมูลล่าสุด',
  renumbered: (r: Renumbered) => `บันทึกแล้ว เอกสารได้เลขที่ ${r.map(x => x[1]).join(', ')} เพราะเลขที่ ${r.map(x => x[0]).join(', ')} ถูกใช้ไปแล้ว`,
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
  // Another branch's data (or HQ's) for a franchise branch account: the
  // server refuses it (403). The legacy app still reads and writes the first
  // branch's key while it starts; it gets no data and its writes are not sent.
  forbidden?: boolean;
  // What the server left out for this person (task 3.9): their copy is compared with the server's through it.
  masks?: Mask[];
  raw?: string | null;           // the app's write that `sent` was made from (they differ for the stock of another branch, 10.7)
  cursor?: number;               // other devices' saves up to this one are in the data as read (task 3.10)
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
// The legacy app's live data and the key it is stored under (frontend/js/03.js):
// global bindings of its own scripts, not properties of window.
declare const DB: unknown;
declare const KEY: string;

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

// A write the server refused (403): the permission checks (task T10), or the shop is read-only (task 3.15).
const refused = (what: string, body: string) =>
  mustReload(/"error":"expired"/.test(body) ? MESSAGES.expired : MESSAGES.notAllowed, `not allowed to ${what}: ${body}`);

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
    m.masks = JSON.parse(decodeURIComponent(r.headers.get('x-drivego-masks') || '%5B%5D'));   // escaped: a header is Latin-1
    m.value = m.sent = m.raw = body.slice(nl + 1);
    m.last = split(key, m.sent);
    m.cursor = Number(r.headers.get('x-drivego-live')) || 0;
  } else if (r.status === 403) {
    m.forbidden = true;
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

// The app's data as the server keeps it (task 3.10, answer 10.7): working in another branch, its stock records
// have that branch's values inline; the server's have the main branch's (server/lib/branch-stock.ts).
const storedStock = new WeakMap<Split, Map<string, Record<string, unknown>>>();
function serverShape(key: string, value: string, m: Main): string {
  if (rootOf(key) !== 'DB' || !/"stockCtx":"(?!main")/.test(value)) return value;
  const db = JSON.parse(value) as Record<string, unknown>;
  let stored = m.last ? storedStock.get(m.last) : undefined;
  if (m.last && !stored) {
    stored = new Map(m.last.rows.filter(r => r.unit === 'DB.stock').map(r => [r.key, JSON.parse(r.data)]));
    storedStock.set(m.last, stored);
  }
  return dataToMain(db, stored ?? new Map()) ? JSON.stringify(db) : value;
}

// A save that replaces the whole data set (3.2d: the app keeps a safety copy first, guardWholeData): the other
// devices are told to reload (task 3.10, answer 10.5).
const whole = new Map<string, string>();

// Sends what changed in a main key since the server's last confirmed value.
async function flush(key: string): Promise<void> {
  const m = mains.get(key)!;
  let value = m.value;
  if (value === null || value === m.raw || !signedIn || m.forbidden) return;
  let shaped = serverShape(key, value, m);
  let next = split(key, shaped);
  const secrets = newSecrets(m.last, next);
  let changes = m.last ? diff(m.last, next)
    : { layout: next.layout, upsert: next.rows, remove: [], order: {} };
  // Task 3.11: files the app put into the rows go up first; the save, what the app wrote since and its data get their links.
  const files = await uploadFiles(key, changes, (u, init) => send(u, init, true));
  if (!(files instanceof Map)) return refusedFile(key, files);
  if (files.size) {
    const linked = withLinks(key, value, files);
    m.value = m.value === value ? linked : withLinks(key, m.value!, files);
    if (typeof KEY !== 'undefined' && KEY === key && typeof DB !== 'undefined') linkInPlace(key, DB, files);
    value = linked;
    shaped = serverShape(key, value, m);
    next = split(key, shaped);
    changes = m.last ? diff(m.last, next) : { layout: next.layout, upsert: next.rows, remove: [], order: {} };
  }
  const sessionChanged = JSON.stringify(next.session) !== JSON.stringify(m.last?.session ?? {});
  if (changes.layout === undefined && !changes.upsert.length && !changes.remove.length && !Object.keys(changes.order).length && !sessionChanged && !secrets.length) {
    m.sent = shaped; m.raw = value; m.last = next;
    return;
  }
  const root = rootOf(key)!;
  const base: Record<string, number> = {};
  const known = (unit: string, k: string) => { const v = m.base[vk(unit, k)]; if (v !== undefined) base[vk(unit, k)] = v; };
  if (changes.layout !== undefined) known(root, key);
  for (const r of changes.upsert) known(r.unit, r.key);
  for (const r of changes.remove) known(r.unit, r.key);
  const numbers = claimsIn(issuedFor(key), value);
  const replacing = whole.get(key);
  whole.delete(key);
  const r = await send(url(key), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ base, changes, session: next.session, secrets, numbers, ...(replacing ? { whole: replacing } : {}) }),
  }, true);
  if (r.status === 409) return mustReload(MESSAGES.conflict, `conflict ${key}: ${JSON.stringify((await r.json()).conflicts)}`);
  if (r.status === 401) return mustReload(MESSAGES.signedOut, `signed out while saving ${key}`);
  // The server's permission checks refused it (task T10): the screen must not go on as if it were saved.
  if (r.status === 403) return refused(`save ${key}`, await r.text());
  if (!r.ok) { problems.push(`save ${key}: ${r.status} ${await r.text()}`); return; }
  const { versions, renumbered = [], counters = [], live: logId } = await r.json() as
    { versions: Record<string, number>; renumbered?: Renumbered; counters?: Counters; live?: number | null };
  live.own(logId);
  for (const x of changes.remove) delete m.base[vk(x.unit, x.key)];
  Object.assign(m.base, versions);
  const claimed = new Set(Object.values(numbers).flat());
  const later = issuedFor(key).filter(x => !claimed.has(x.no));
  if (!renumbered.length && !counters.length) {
    issued.set(key, later);
    m.sent = shaped;
    m.raw = value;
    m.last = next;
    return;
  }
  // The server gave documents other numbers, or kept counters higher than the
  // app wrote (task 3.2): the app goes on from what was saved, in the rows
  // that save wrote and the ones changed since (older rows keep their
  // numbers). Numbers it issued since the save was sent move up after the
  // corrected counters.
  m.sent = correctSplit(key, next, rowsToRenumber(next, changes, next), renumbered, counters);
  m.last = split(key, m.sent);
  const shift = shiftLater(later, counters);
  const all = [...renumbered, ...shift.renumbered];
  const moved = new Map(shift.renumbered);
  issued.set(key, later.map(x => ({ base: x.base, no: moved.get(x.no) ?? x.no })));
  m.raw = null;
  if (m.value === value && shaped === value) m.value = m.sent;
  else { const now = split(key, m.value!); m.value = correctSplit(key, now, rowsToRenumber(next, changes, now), all, shift.counters); }
  if (typeof KEY !== 'undefined' && KEY === key && typeof DB !== 'undefined') {
    const rows = rowsToRenumber(next, changes, split(key, JSON.stringify(DB)));
    if (all.length) eachRecord(key, DB, (unit, k, get, set) => { if (isRow(rows, unit, k)) set(renumberValue(get(), all)); });
    setCounters(DB, shift.counters);
  }
  // After the app's own message for the save, if it shows one.
  if (renumbered.length && typeof window.toast === 'function') setTimeout(() => window.toast!(MESSAGES.renumbered(renumbered)), 0);
}

// An upload the server refused (task 3.11): the save cannot go without it.
function refusedFile(key: string, r: Refused): Promise<void> {
  if (r.error === 'signed-out') return mustReload(MESSAGES.signedOut, `signed out while uploading a file of ${key}`);
  if (r.error === 'not-allowed') return mustReload(MESSAGES.notAllowed, `not allowed to upload a file of ${key}`);
  if (r.error === 'too-large') return mustReload(MESSAGES.fileTooLarge, `file too large for ${key}`);
  if (r.error === 'quota') return mustReload(MESSAGES.spaceFull, `no space for a file of ${key}`);
  problems.push(`upload for ${key}: ${r.error}`);
  return Promise.resolve();
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

// Numbers the app issued (docNo, frontend/js/03.js and 19.js: the only place it
// takes a number from a counter) that the server has not confirmed yet, by
// main data key: they go with the save that first holds them (task 3.2).
const issued = new Map<string, Issued[]>();
const issuedFor = (key: string) => issued.get(key) ?? [];
scriptsLoaded.then(() => {
  const w = window as unknown as { docNo?: (this: unknown, ...a: unknown[]) => unknown };
  const docNo = w.docNo;
  if (typeof docNo !== 'function') return;
  w.docNo = function (this: unknown, ...args: unknown[]) {
    const no = docNo.apply(this, args);
    const seq = (typeof DB !== 'undefined' && (DB as { seq?: Record<string, unknown> } | null)?.seq) || null;
    const base = typeof no === 'string' && seq ? baseOf(seq, no) : undefined;
    if (base && typeof KEY !== 'undefined') issued.set(KEY, [...issuedFor(KEY), { base, no: no as string }]);
    return no;
  };
});

const live = createLive({
  mains, enqueue, send, problems,
  read: async key => { const m = await readMain(key); return m; },
  mustReload,
});

const storage = {
  async get(key: string): Promise<{ key: string; value: string } | null> {
    if (rootOf(key)) {
      let m = mains.get(key);
      if (!m) { m = await readMain(key); if (!mains.has(key)) mains.set(key, m); else m = mains.get(key)!; }
      if (signedIn && !m.forbidden && m.last) live.start(m.cursor ?? 0);
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
      const safety = /^(.+?)\.bak\.safety-.*-([a-z]+)$/.exec(key);
      if (safety && rootOf(safety[1])) whole.set(safety[1], safety[2]);
      await enqueue(async () => {
        const r = await send(url(key), { method: 'PUT', body: backup ? '' : value }, true);
        if (r.status === 403) return refused(`put ${key}`, await r.text());
        if (!r.ok) problems.push(`put ${key}: ${r.status}`);
      });
    }
    return { key, value };
  },

  async delete(key: string): Promise<{ key: string; deleted: boolean }> {
    if (signedIn === false) return { key, deleted: false };
    await enqueue(async () => {
      const r = await send(url(key), { method: 'DELETE' }, true);
      if (r.status === 403) return refused(`delete ${key}`, await r.text());
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

  // Attachments (task 3.11): the space the shop or branch uses, for the screens (66-files.js).
  files: {
    space,
    async usage(key: string): Promise<typeof space> {
      const r = await send(`/api/files?key=${encodeURIComponent(key)}`, {}, false);
      if (r.ok) setSpace(await r.json());
      return space;
    },
  },

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
    live.stop();
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

  // Other devices' saves (task 3.10): for the screens (frontend/js/67-live.js).
  live: live.api,

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
      if (m.value === null || m.forbidden) continue;
      checked.push(key);
      const r = await fetch0(url(key), { cache: 'no-store' });
      const body = await r.text();
      const s = split(key, serverShape(key, m.value, m));
      const expected = assemble(key, s.layout, m.masks?.length ? maskRows(s.rows, m.masks) : s.rows, { session: s.session });
      if (r.status !== 200 || body.slice(body.indexOf('\n') + 1) !== expected) wrong.push(key);
    }
    return { checked, wrong };
  },
};

(window as unknown as { storage: typeof storage }).storage = storage;
