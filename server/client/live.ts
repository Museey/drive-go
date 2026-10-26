// Hearing the other devices' saves (task 3.10, decision Q8, the owner's answers 10.1–10.7), for window.storage.
//
// The server streams every save of the shop within this person's branch scope (GET /api/live, server-sent events).
// For a save of a key this browser holds, it asks for the rows it does not have yet (POST /api/storage/<key>/rows,
// with what the person may not see left out) and keeps them pending; they go into the app's data (DB, FR or DGB, in
// place: units.ts applyRows) and into the copy window.storage compares saves with, together, as one step of the
// write queue, so a save never goes out half on the old rows and half on the new. While the screens say they are
// busy (a pop-up, a side panel or a confirmation card is open, or a menu page that is a form: 67-live.js), the rows
// wait: the app goes on with what it showed, and a save of a row someone else changed meanwhile gets the usual
// "someone saved first" message (P1/Q5, answer 10.1) instead of writing over it.
//
// The screens hear of it (window events, for 67-live.js): 'drivego:heard' {key, rows, removed, by, at} as soon as
// the rows are known (the banner of an open document, 10.1–10.3), 'drivego:applied' {key} once they are in the
// app's data (redraw what is behind). A save that replaced the whole data set (10.5), a session that ended (10.6)
// and too much missed ask the user to reload; a change of what the person may see (task 3.9 masks) reads the data
// again. Without a word from the server for about 8 seconds the screen is covered until it answers again (10.4).
import type { LiveEntry } from '../lib/live.ts';
import { MAIN, stockToBranch } from '../lib/branch-stock.ts';
import { type Row, type Split, applyRows, assemble, diff, rootOf, split } from '../lib/units.ts';
import type { Mask } from '../lib/visibility.ts';

export interface LiveMain {
  value: string | null; sent: string | null; last: Split | null; base: Record<string, number>;
  forbidden?: boolean; masks?: Mask[];
  cursor?: number;   // saves up to this one are in the data it was read with
}
export interface LiveDeps {
  mains: Map<string, LiveMain>;
  enqueue<T>(job: () => Promise<T>): Promise<T>;
  send(input: string, init: RequestInit, saving: boolean): Promise<Response>;
  read(key: string): Promise<LiveMain>;
  mustReload(text: string, why: string): Promise<never>;
  problems: string[];
}

export const LIVE_MESSAGES = {
  // answer 10.4 (new text, waiting for the owner's approval)
  offline: 'เชื่อมต่อ server ไม่ได้ — ออกเอกสารและรับเงินไม่ได้จนกว่าจะเชื่อมต่อได้ ระบบกำลังลองเชื่อมต่อใหม่',
  // answer 10.5 (new text): another device wiped, restored, imported or loaded the sample data
  whole: (kind: string) => `${({ wipe: 'ล้างข้อมูล', restore: 'กู้คืนข้อมูล', import: 'นำเข้าข้อมูล', sample: 'โหลดข้อมูลตัวอย่าง' } as Record<string, string>)[kind] || 'แทนที่ข้อมูล'}ทั้งหมดจากเครื่องอื่นแล้ว — กดตกลงเพื่อโหลดข้อมูลล่าสุด`,
};
const SIGNED_OUT = 'หมดเวลาการเข้าระบบ กรุณาเข้าสู่ระบบใหม่';   // Q5, as window.storage says it

const vk = (unit: string, key: string) => `${unit}|${key}`;
const unitOf = (k: string) => k.slice(0, k.indexOf('|'));
const keyOf = (k: string) => k.slice(k.indexOf('|') + 1);
const QUIET_TICKS = 8;   // seconds without a word from the server before the screen is covered (pings come every 3)

// The legacy app's live data: global bindings of its scripts (frontend/js/03.js and the franchise / account files).
declare const DB: unknown;
declare const FR: unknown;
declare const DGB: unknown;
declare const KEY: string;

interface Pending {
  rows: Map<string, (Row & { version: number }) | null>;   // null: removed
  order: Record<string, string[]>;
  replace?: { json: string; versions: Record<string, number>; masks?: Mask[] };   // read again whole
}

export function createLive(d: LiveDeps) {
  const own = new Set<number>();             // ids of this browser's own saves (they come back too)
  const pending = new Map<string, Pending>();
  let busy: () => boolean = () => false;
  let source: EventSource | null = null, heardUpTo = 0, quiet = 0, started = false, cover: HTMLElement | null = null;
  let watch: ReturnType<typeof setInterval> | null = null;

  const emit = (name: string, detail: unknown) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const pendingOf = (key: string) => pending.get(key) ?? pending.set(key, { rows: new Map(), order: {} }).get(key)!;
  const known = (m: LiveMain, key: string, k: string) => {
    const p = pending.get(key)?.rows;
    if (p?.has(k)) { const r = p.get(k); return r ? r.version : -1; }
    return m.base[k] ?? -1;
  };

  // The app's live object for a key, if the app has it open.
  function liveObject(key: string): Record<string, unknown> | null {
    const root = rootOf(key);
    const v = root === 'DB' ? (typeof KEY !== 'undefined' && KEY === key && typeof DB !== 'undefined' ? DB : null)
      : root === 'FR' ? (typeof FR !== 'undefined' ? FR : null) : root === 'DGB' ? (typeof DGB !== 'undefined' ? DGB : null) : null;
    return v && typeof v === 'object' ? v as Record<string, unknown> : null;
  }
  // The branch whose stock the app has inline (answer 10.7, server/lib/branch-stock.ts).
  const ctxOf = (live: Record<string, unknown> | null) => live && typeof live.stockCtx === 'string' ? live.stockCtx : MAIN;
  const forApp = (ctx: string) => (r: Row) => { const v = JSON.parse(r.data); return ctx !== MAIN && r.unit === 'DB.stock' ? stockToBranch(v, ctx) : v; };

  async function heard(e: LiveEntry): Promise<void> {
    if (own.has(e.id)) return;
    const m = d.mains.get(e.key);
    if (!m || m.forbidden || !m.last || (m.cursor !== undefined && e.id <= m.cursor)) return;
    if (e.whole) return d.mustReload(LIVE_MESSAGES.whole(e.whole), `whole data of ${e.key} replaced elsewhere (${e.whole})`);
    if (e.layout) return reread(e.key);
    const want = e.rows.filter(([u, k, v]) => known(m, e.key, vk(u, k)) < v).map(([u, k]): [string, string] => [u, k]);
    const removed = e.removed.filter(([u, k]) => known(m, e.key, vk(u, k)) >= 0);
    const ordered = e.ordered;
    if (!want.length && !removed.length && !ordered.length) return;
    const p = pendingOf(e.key);
    const changed: string[] = [], gone: string[] = [];
    if (want.length || ordered.length) {
      const r = await d.send(`/api/storage/${encodeURIComponent(e.key)}/rows`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rows: want, ordered }),
      }, false);
      if (r.status === 401) return d.mustReload(SIGNED_OUT, `signed out while reading rows of ${e.key}`);
      if (!r.ok) { d.problems.push(`rows of ${e.key}: ${r.status}`); return reread(e.key); }
      const got = await r.json() as { rows: (Row & { version: number })[]; gone: [string, string][]; order: Record<string, string[]> };
      for (const row of got.rows) if (known(m, e.key, vk(row.unit, row.key)) < row.version) { p.rows.set(vk(row.unit, row.key), row); changed.push(vk(row.unit, row.key)); }
      for (const [u, k] of got.gone) if (known(m, e.key, vk(u, k)) >= 0) { p.rows.set(vk(u, k), null); gone.push(vk(u, k)); }
      Object.assign(p.order, got.order);
    }
    for (const [u, k] of removed) if (!gone.includes(vk(u, k))) { p.rows.set(vk(u, k), null); gone.push(vk(u, k)); }
    if (changed.length || gone.length)
      emit('drivego:heard', { key: e.key, rows: changed, removed: gone, by: e.by, at: e.late ? e.at : new Date().toISOString() });
    if (!busy()) applyNow(e.key);
  }

  // Puts what is pending for a key into the app's data and window.storage's copy. Runs as a step of the write queue.
  function applyNow(key: string): void {
    const p = pending.get(key), m = d.mains.get(key);
    if (!p || !m || !m.last) return;
    pending.delete(key);
    const live = liveObject(key), ctx = ctxOf(live);
    if (p.replace) {
      const s = split(key, p.replace.json);
      m.base = { ...p.replace.versions };
      if (p.replace.masks) m.masks = p.replace.masks;
      m.last = s; m.sent = p.replace.json;
      if (live) {
        const next = JSON.parse(p.replace.json) as Record<string, unknown>;
        // the person's own session fields stay as the app has them (the server sent the same ones)
        for (const k of Object.keys(live)) delete live[k];
        Object.assign(live, next);
        if (ctx !== MAIN && Array.isArray(live.stock)) {
          live.stock = (live.stock as unknown[]).map(x => x && typeof x === 'object' ? stockToBranch(x as Record<string, unknown>, ctx) : x);
          live.stockCtx = ctx;
        }
      }
      m.value = live ? JSON.stringify(live) : m.sent;
      emit('drivego:applied', { key, whole: true });
      return;
    }
    const upsert = [...p.rows.values()].filter((r): r is Row & { version: number } => !!r);
    const remove = [...p.rows].filter(([, r]) => !r).map(([k]) => ({ unit: unitOf(k), key: keyOf(k) }));
    if (live && !applyRows(key, live, { upsert, remove, order: p.order }, forApp(ctx))) { void reread(key); return; }
    // window.storage's copy of what the server holds, the same way.
    const rows = m.last.rows.slice();
    const at = new Map(rows.map((r, i) => [vk(r.unit, r.key), i]));
    for (const r of upsert) {
      const row = { unit: r.unit, key: r.key, data: r.data }, i = at.get(vk(r.unit, r.key));
      if (i === undefined) { at.set(vk(r.unit, r.key), rows.length); rows.push(row); } else rows[i] = row;
      m.base[vk(r.unit, r.key)] = r.version;
    }
    const goneKeys = new Set(remove.map(r => vk(r.unit, r.key)));
    for (const k of goneKeys) delete m.base[k];
    let next = rows.filter(r => !goneKeys.has(vk(r.unit, r.key)));
    for (const [unit, keys] of Object.entries(p.order)) {
      const rank = new Map(keys.map((k, i) => [k, i]));
      const mine = next.filter(r => r.unit === unit).sort((a, b) => (rank.get(a.key) ?? Infinity) - (rank.get(b.key) ?? Infinity));
      let j = 0;
      next = next.map(r => r.unit === unit ? mine[j++] : r);
    }
    m.last = { ...m.last, rows: next };
    m.sent = assemble(key, m.last.layout, next, { session: m.last.session });
    m.value = live ? JSON.stringify(live) : m.sent;
    emit('drivego:applied', { key });
  }

  // Reads a key whole again and keeps it pending as a replacement (layout changed, rights changed, too much missed).
  async function reread(key: string): Promise<void> {
    const m = d.mains.get(key);
    if (!m || m.forbidden || !m.last) return;
    const fresh = await d.read(key);
    if (fresh.forbidden || fresh.value === null) return;
    const s = split(key, fresh.value), was = m.last;
    const c = diff(was, s);
    pending.set(key, { rows: new Map(), order: {}, replace: { json: fresh.value, versions: fresh.base, masks: fresh.masks } });
    m.cursor = Math.max(m.cursor ?? 0, fresh.cursor ?? 0);
    const changed = c.upsert.map(r => vk(r.unit, r.key)), gone = c.remove.map(r => vk(r.unit, r.key));
    if (changed.length || gone.length || c.layout !== undefined) emit('drivego:heard', { key, rows: changed, removed: gone, by: null, at: new Date().toISOString() });
    if (!busy()) applyNow(key);
  }
  const rereadAll = () => { for (const key of [...d.mains.keys()]) void d.enqueue(() => reread(key)); };

  // ---------- the stream ----------
  function connect(): void {
    if (source) return;
    const es = new EventSource(`/api/live?since=${heardUpTo}`);
    source = es;
    const alive = () => { quiet = 0; if (cover) { cover.remove(); cover = null; } };
    es.addEventListener('ping', alive);
    es.addEventListener('change', ev => {
      alive();
      const e = JSON.parse((ev as MessageEvent).data) as LiveEntry;
      heardUpTo = Math.max(heardUpTo, e.id);
      void d.enqueue(() => heard(e)).catch(err => d.problems.push(`live ${e.key}: ${err}`));
    });
    es.addEventListener('resync', () => { alive(); reconnect(); rereadAll(); });
    es.addEventListener('rights', () => { alive(); reconnect(); rereadAll(); emit('drivego:rights', {}); });
    es.addEventListener('signedOut', () => { es.close(); source = null; void d.mustReload(SIGNED_OUT, 'session ended elsewhere'); });
    // Lost: try again with what was heard so far (the browser's own retry would ask from the start).
    es.addEventListener('error', () => { if (source === es) { es.close(); source = null; setTimeout(connect, 2000); } });
  }
  function reconnect(): void { if (source) { source.close(); source = null; } setTimeout(connect, 0); }

  function showCover(): void {
    if (cover || !document.body) return;
    cover = document.createElement('div');
    cover.id = 'drivegoOffline';
    cover.setAttribute('role', 'alert');
    cover.textContent = LIVE_MESSAGES.offline;
    cover.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;'
      + 'background:rgba(15,23,42,.72);color:#fff;font:600 18px/1.6 inherit;text-align:center';
    document.body.append(cover);
  }

  return {
    // Starts listening once there is a session and data, from the cursor that data was read at.
    start(cursor: number): void {
      if (started) return;
      started = true;
      heardUpTo = cursor;
      quiet = 0;
      connect();
      watch ??= setInterval(() => { if (started && ++quiet >= QUIET_TICKS) showCover(); }, 1000);
    },
    stop(): void { started = false; source?.close(); source = null; if (cover) { cover.remove(); cover = null; } },
    own(id: number | null | undefined): void { if (typeof id === 'number') own.add(id); },
    // For the screens (67-live.js).
    api: {
      setBusy(fn: () => boolean) { busy = fn; },
      // Put what is pending into the app's data now (the screens are no longer busy, or the user asked for it).
      apply: () => d.enqueue(async () => { for (const key of [...pending.keys()]) applyNow(key); }),
      pending: (key: string, unit: string, k: string) => pending.get(key)?.rows.has(vk(unit, k)) || !!pending.get(key)?.replace,
      get waiting() { return [...pending.values()].some(p => p.rows.size || p.replace || Object.keys(p.order).length); },
      get offline() { return !!cover; },
    },
  };
}
