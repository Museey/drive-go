// The legacy STORE on the server (design §4): main data keys are kept as rows
// of records (split by units.ts) and put back together on read; backup points
// and other keys are kept whole. Every function runs inside withShop(): Row-
// Level Security limits it to the session's shop and branch scope, and every
// query also names the shop (app_shop()) itself, so it stays right for a role
// that RLS does not apply to (the owner opening a shop, tools/new-shop.mjs).
import type pg from 'pg';
import { gunzipSync, gzipSync } from 'node:zlib';
import { COUNTERS, type Claims, type Counters, type Renumbered, numberOf, numbersIn, renumberText, seqOf } from './numbers.ts';
import { type Changes, type Row, assemble, rootOf } from './units.ts';
import { type Mask, maskRows, masksUnit, restoreRow } from './visibility.ts';

// Version of each row, keyed "<unit>|<key>"; the browser sends back the
// versions it last saw so the server can refuse a save that would overwrite
// someone else's change (decision P1).
export type Versions = Record<string, number>;
export const vkey = (unit: string, key: string) => `${unit}|${key}`;

export const isBackupKey = (k: string) => /^garage\.v22(::[^.]+)?\.bak\./.test(k);
// The copy the app asks for before it wipes, restores, imports or replaces the
// whole data set (task 3.2, decision F1): kept 90 days, never replaced or removed by the app.
export const isSafetyBackupKey = (k: string) => isBackupKey(k) && k.includes('.bak.safety-');
// A whole copy of a branch's data kept beside it: backup points, and other keys under the main key
// (garage.v22.trialkeep, 55.js). Only its managers may read one (task 3.9, owner's answer of 2026-10-26).
export const isDataCopyKey = (k: string) => /^garage\.v22(::[^.]+)?\./.test(k);
const SAFETY_DAYS = 90;
const mainOfBackup = (k: string) => k.slice(0, k.indexOf('.bak.'));

// Which branch a STORE key's data belongs to. Biz/ProX: one data set ('').
// Franchise: garage.v22::<id> is that branch; garage.v22 is the branch whose
// storeKey it is (B001 in the trial chain); HQ's own data is garage.v22::HQ
// (decision Q3). Chain data (franchise.v22) and the shop account (dgb.v22)
// are chain-wide ('').
export function branchOf(pkg: string, storeKey: string, branches: { id: string; storeKey?: string }[] = []): string {
  if (pkg !== 'franchise' || rootOf(storeKey) !== 'DB') return '';
  const m = /^garage\.v22::(.+)$/.exec(storeKey);
  if (m) return m[1];
  return branches.find(b => b.storeKey === storeKey)?.id ?? 'HQ';
}

// Whether a session's branch scope reaches a branch's data: the same rule as
// app_branch_ok() in the database ('*' = HQ, every branch; '' = chain-wide
// data, every session). Routes check it first so that another branch's data
// is refused (403) rather than looking empty.
export const inScope = (scope: string, branch: string) => scope === '*' || branch === '' || branch === scope;

// The layout row of a STORE key: unit = its root (DB, FR, DGB), key = the STORE key.
const layoutUnit = (storeKey: string) => rootOf(storeKey)!;

// masks: what the person may not see (lib/visibility.ts, task 3.9); a backup point copies everything.
export async function readMain(c: pg.ClientBase, branch: string, storeKey: string, session: Record<string, string> = {}, masks: Mask[] = []):
  Promise<{ json: string; versions: Versions } | null> {
  const root = layoutUnit(storeKey);
  const layout = await c.query<{ data: string; version: number }>(
    'select data::text as data, version from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = $3', [branch, root, storeKey]);
  if (!layout.rowCount) return null;
  const { rows } = await c.query<Row & { version: number }>(
    `select unit, key, data::text as data, version from records
      where shop_id = app_shop() and branch_id = $1 and unit like $2 order by unit, pos, key`, [branch, `${root}.%`]);
  const versions: Versions = { [vkey(root, storeKey)]: layout.rows[0].version };
  for (const r of rows) versions[vkey(r.unit, r.key)] = r.version;
  return { json: assemble(storeKey, layout.rows[0].data, masks.length ? maskRows(rows, masks) : rows, { session }), versions };
}

// A save by someone who could not see some values: the rows they send carry blanks there; the stored values
// go back in (task 3.9). A new row keeps what it was sent with.
export async function restoreHidden(c: pg.ClientBase, branch: string, changes: Changes, masks: Mask[]): Promise<Changes> {
  const hidden = changes.upsert.filter(r => masksUnit(masks, r.unit));
  if (!hidden.length) return changes;
  const { rows } = await c.query<{ unit: string; key: string; data: string }>(
    `select unit, key, data::text as data from records
      where shop_id = app_shop() and branch_id = $1 and (unit, key) in (select * from unnest($2::text[], $3::text[]))`,
    [branch, hidden.map(r => r.unit), hidden.map(r => r.key)]);
  const stored = new Map(rows.map(r => [vkey(r.unit, r.key), r.data]));
  return { ...changes, upsert: changes.upsert.map(r => masksUnit(masks, r.unit) ? restoreRow(r, stored.get(vkey(r.unit, r.key)), masks) : r) };
}

export type WriteResult = { ok: true; versions: Versions } | { ok: false; conflicts: string[] };

// Applies one save. base: the versions the browser saw of every row it
// changes or removes (missing = it thinks the row is new). All or nothing: on
// any conflict nothing is written. A duplicate document number raises 23505,
// which the caller also reports as a conflict. Every row written or removed is
// recorded in change_log with its value before and after (task 3.1, R15),
// except when a shop is opened with its starting data (log: false).
export async function writeMain(c: pg.ClientBase, branch: string, storeKey: string, base: Versions, changes: Changes,
  userId: string | null = null, { log: keepLog = true }: { log?: boolean } = {}): Promise<WriteResult> {
  const root = layoutUnit(storeKey);
  // A save of one key may only touch that key's own units (DB.* for
  // garage.v22, FR.* for franchise.v22 …), never the layout row directly.
  const own = (unit: string) => typeof unit === 'string' && unit.startsWith(root + '.');
  const bad = [...changes.upsert.map(r => r.unit), ...changes.remove.map(r => r.unit), ...Object.keys(changes.order)].filter(u => !own(u));
  if (bad.length) throw Object.assign(new Error(`units outside ${storeKey}: ${[...new Set(bad)].join(', ')}`), { status: 400 });
  const upsert: Row[] = changes.layout === undefined ? [...changes.upsert]
    : [{ unit: root, key: storeKey, data: changes.layout }, ...changes.upsert];
  const touched = [...upsert.map(r => [r.unit, r.key]), ...changes.remove.map(r => [r.unit, r.key])];
  const current = new Map<string, number>();
  const before = new Map<string, string>();
  if (touched.length) {
    const { rows } = await c.query<{ unit: string; key: string; version: number; data: string }>(
      `select unit, key, version, data::text as data from records
        where shop_id = app_shop() and branch_id = $1 and (unit, key) in (select * from unnest($2::text[], $3::text[]))
        order by unit, key for update`, [branch, touched.map(t => t[0]), touched.map(t => t[1])]);
    for (const r of rows) { current.set(vkey(r.unit, r.key), r.version); before.set(vkey(r.unit, r.key), r.data); }
  }
  const conflicts = touched.map(([u, k]) => vkey(u, k)).filter(k => current.get(k) !== base[k]);
  if (conflicts.length) return { ok: false, conflicts };

  const versions: Versions = {};
  const updates = upsert.filter(r => current.has(vkey(r.unit, r.key)));
  const inserts = upsert.filter(r => !current.has(vkey(r.unit, r.key)));
  if (updates.length) {
    const { rows } = await c.query<{ unit: string; key: string; version: number }>(
      `update records r set data = u.data::json, version = r.version + 1, updated_at = now(), updated_by = $5
         from unnest($2::text[], $3::text[], $4::text[]) as u(unit, key, data)
        where r.shop_id = app_shop() and r.branch_id = $1 and r.unit = u.unit and r.key = u.key
        returning r.unit, r.key, r.version`,
      [branch, updates.map(r => r.unit), updates.map(r => r.key), updates.map(r => r.data), userId]);
    for (const r of rows) versions[vkey(r.unit, r.key)] = r.version;
  }
  if (inserts.length) {
    // New records go after the unit's last one, in the order they came.
    const units = [...new Set(inserts.map(r => r.unit))];
    const { rows } = await c.query<{ unit: string; last: string }>(
      'select unit, max(pos)::text as last from records where shop_id = app_shop() and branch_id = $1 and unit = any($2) group by unit', [branch, units]);
    const next = new Map(rows.map(r => [r.unit, Number(r.last) + 1]));
    const pos = inserts.map(r => { const p = next.get(r.unit) ?? 0; next.set(r.unit, p + 1); return p; });
    await c.query(
      `insert into records (shop_id, branch_id, unit, key, pos, data, updated_by)
       select app_shop(), $1, u.unit, u.key, u.pos, u.data::json, $6
         from unnest($2::text[], $3::text[], $4::bigint[], $5::text[]) as u(unit, key, pos, data)`,
      [branch, inserts.map(r => r.unit), inserts.map(r => r.key), pos, inserts.map(r => r.data), userId]);
    for (const r of inserts) versions[vkey(r.unit, r.key)] = 1;
  }
  if (changes.remove.length) {
    await c.query(
      `delete from records r using unnest($2::text[], $3::text[]) as d(unit, key)
        where r.shop_id = app_shop() and r.branch_id = $1 and r.unit = d.unit and r.key = d.key`,
      [branch, changes.remove.map(r => r.unit), changes.remove.map(r => r.key)]);
  }
  for (const [unit, keys] of Object.entries(changes.order)) {
    await c.query(
      `update records r set pos = o.ord from unnest($3::text[]) with ordinality as o(key, ord)
        where r.shop_id = app_shop() and r.branch_id = $1 and r.unit = $2 and r.key = o.key`, [branch, unit, keys]);
  }
  if (touched.length || Object.keys(changes.order).length) {
    await c.query('insert into write_log (shop_id, branch_id, user_id, units) values (app_shop(), $1, $2, $3)',
      [branch, userId, JSON.stringify({ key: storeKey, versions, removed: changes.remove.map(r => vkey(r.unit, r.key)) })]);
  }
  // Rows written with the same value they had are not changes.
  const log = [
    ...upsert.filter(r => before.get(vkey(r.unit, r.key)) !== r.data).map(r => ({
      unit: r.unit, key: r.key, op: current.has(vkey(r.unit, r.key)) ? 'update' : 'insert',
      version: versions[vkey(r.unit, r.key)], before: before.get(vkey(r.unit, r.key)) ?? null, after: r.data })),
    ...changes.remove.filter(r => current.has(vkey(r.unit, r.key))).map(r => ({
      unit: r.unit, key: r.key, op: 'delete', version: null, before: before.get(vkey(r.unit, r.key))!, after: null })),
  ];
  if (keepLog && log.length) {
    await c.query(
      `insert into change_log (shop_id, branch_id, user_id, store_key, unit, key, op, version, before, after)
       select app_shop(), $1, $2, $3, l.unit, l.key, l.op, l.version, l.before::json, l.after::json
         from unnest($4::text[], $5::text[], $6::text[], $7::int[], $8::text[], $9::text[]) as l(unit, key, op, version, before, after)`,
      [branch, userId, storeKey, log.map(l => l.unit), log.map(l => l.key), log.map(l => l.op), log.map(l => l.version ?? null),
        log.map(l => l.before), log.map(l => l.after)]);
  }
  return { ok: true, versions };
}

export type SaveResult = { ok: true; versions: Versions; renumbered: Renumbered; counters: Counters } | { ok: false; conflicts: string[] };

// One save from the browser: its document numbers checked against the
// shop's counters (task 3.2), then written (writeMain). claims: the numbers
// the browser issued in this save, by counter (numbers.ts).
export async function saveMain(c: pg.ClientBase, branch: string, storeKey: string, base: Versions, changes: Changes,
  claims: Claims = {}, userId: string | null = null): Promise<SaveResult> {
  const n = await issueNumbers(c, branch, storeKey, base, changes, claims);
  const r = await writeMain(c, branch, storeKey, n.base, n.changes, userId);
  return r.ok ? { ...r, renumbered: n.renumbered, counters: n.counters } : r;
}

// The counters (DB.seq rows) of the numbers a save issued, or that it writes
// or removes, are the server's: each is locked for the rest of the
// transaction (doc_counters), so saves of one counter run one after another,
// and is saved as
//   - the last number issued plus the numbers this save issued, renumbered
//     to follow it, when one of them was issued already (by another browser,
//     or before the data was wiped or an older backup restored);
//   - otherwise the highest of the last number issued, what the browser
//     wrote and the numbers it issued: never lower, never removed.
// What the browser saw of the counter rows does not matter (no conflict on
// them), only the numbers.
async function issueNumbers(c: pg.ClientBase, branch: string, storeKey: string, base: Versions, changes: Changes, claims: Claims) {
  const none = { base, changes, renumbered: [] as Renumbered, counters: [] as Counters };
  if (rootOf(storeKey) !== 'DB') return none;
  const written = new Map(changes.upsert.filter(r => r.unit === COUNTERS).map(r => [r.key, Number(r.data)]));
  const removed = new Set(changes.remove.filter(r => r.unit === COUNTERS).map(r => r.key));
  // Only numbers of the counter's own form that this save writes count.
  const text = changes.upsert.map(r => r.data).join('\n');
  const issued = new Map(Object.entries(claims).map(([key, nos]) => {
    const there = numbersIn(text, key);
    return [key, [...new Set(nos)].filter(no => there.has(no) && /^\d{5,}$/.test(no.slice(key.length)))
      .sort((a, b) => seqOf(key, a) - seqOf(key, b))];
  }).filter(([, nos]) => nos.length) as [string, string[]][]);
  const keys = [...new Set([...written.keys(), ...removed, ...issued.keys()])].sort();
  if (!keys.length) return none;

  await c.query(
    `insert into doc_counters (shop_id, branch_id, base, last)
     select app_shop(), $1, k, 0 from unnest($2::text[]) as k on conflict do nothing`, [branch, keys]);
  const locked = await c.query<{ base: string; last: number }>(
    `select base, last from doc_counters where shop_id = app_shop() and branch_id = $1 and base = any($2) order by base for update`, [branch, keys]);
  const rows = await c.query<{ key: string; version: number; data: string }>(
    `select key, version, data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = any($3)`,
    [branch, COUNTERS, keys]);
  const current = new Map(rows.rows.map(r => [r.key, r]));
  const lastOf = new Map(locked.rows.map(r => [r.base, Math.max(r.last, Number(current.get(r.base)?.data) || 0)]));

  base = { ...base };
  const renumbered: Renumbered = [], counters: Counters = [], readded: string[] = [];
  const finals = new Map<string, number>(), rowsToWrite = new Map<string, number>();
  for (const key of keys) {
    const last = lastOf.get(key) ?? 0, nos = issued.get(key) || [], wrote = written.get(key);
    // A counter neither side has (numbers of a counter the server never had a row for): left as it is.
    if (!written.has(key) && !removed.has(key) && !current.has(key)) continue;
    let final: number;
    if (nos.some(no => seqOf(key, no) <= last)) {
      nos.forEach((no, i) => renumbered.push([no, numberOf(key, last + 1 + i)]));
      final = last + nos.length;
    } else {
      final = Math.max(last, wrote !== undefined && Number.isFinite(wrote) ? wrote : 0, ...nos.map(no => seqOf(key, no)));
    }
    if (removed.has(key) && final === 0) continue;   // nothing was ever issued from it
    finals.set(key, final);
    if (removed.has(key)) readded.push(key);
    else if (written.has(key)) { if (wrote !== final) counters.push([key, final]); }
    else if (Number(current.get(key)!.data) !== final) counters.push([key, final]);
    else continue;
    rowsToWrite.set(key, final);
    const v = current.get(key)?.version;
    if (v === undefined) delete base[vkey(COUNTERS, key)]; else base[vkey(COUNTERS, key)] = v;
  }
  // The browser sets the counters it removed again after the ones it has, so
  // they come last, in the order the server had them.
  const kept = readded.length ? (await c.query<{ key: string }>(
    'select key from records where shop_id = app_shop() and branch_id = $1 and unit = $2 order by pos, key', [branch, COUNTERS])).rows.map(r => r.key) : [];
  readded.sort((a, b) => kept.indexOf(a) - kept.indexOf(b));
  for (const key of readded) counters.push([key, finals.get(key)!]);
  if (finals.size) await c.query(
    `update doc_counters d set last = u.last from unnest($2::text[], $3::int[]) as u(base, last)
      where d.shop_id = app_shop() and d.branch_id = $1 and d.base = u.base and d.last <> u.last`, [branch, [...finals.keys()], [...finals.values()]]);

  const upsert = changes.upsert.map(r => r.unit === COUNTERS && rowsToWrite.has(r.key) ? { ...r, data: String(rowsToWrite.get(r.key)) }
    : renumbered.length ? { ...r, data: renumberText(r.data, renumbered) } : r);
  for (const [key, final] of rowsToWrite) if (!written.has(key) && !readded.includes(key)) upsert.push({ unit: COUNTERS, key, data: String(final) });
  for (const key of readded) upsert.push({ unit: COUNTERS, key, data: String(finals.get(key)) });
  const remove = changes.remove.filter(r => !(r.unit === COUNTERS && finals.has(r.key)));
  const order = { ...changes.order };
  if (readded.length) {
    const known = new Set(kept);
    const keep = order[COUNTERS] ?? [...kept.filter(k => !removed.has(k)),
      ...changes.upsert.filter(r => r.unit === COUNTERS && !known.has(r.key)).map(r => r.key)];
    order[COUNTERS] = [...keep.filter(k => !readded.includes(k)), ...readded];
  }
  return { base, changes: { ...changes, upsert, remove, order }, renumbered, counters };
}

// Every STORE key the session can reach (like IndexedDB's keys(), which lists
// all keys, of every franchise branch): main data keys present, backup
// points, other keys. The branch scope (RLS) decides which branches.
export async function listKeys(c: pg.ClientBase): Promise<string[]> {
  const { rows } = await c.query<{ key: string }>(
    `select key from records where shop_id = app_shop() and unit in ('DB', 'FR', 'DGB') and key <> ''
     union select key from backups where shop_id = app_shop()
     union select key from blobs where shop_id = app_shop()
     order by key`);
  return rows.map(r => r.key);
}

// Branch of any STORE key of the shop: a main key's own branch, a backup's
// main key's branch, '' for other keys.
export async function branchOfKey(c: pg.ClientBase, key: string): Promise<string> {
  const main = isBackupKey(key) ? mainOfBackup(key) : key;
  if (!rootOf(main)) return '';
  const shop = await c.query<{ package: string }>('select package from shops where id = app_shop()');
  if (shop.rows[0]?.package !== 'franchise') return '';
  const { rows } = await c.query<{ data: string }>(
    "select data::text as data from records where shop_id = app_shop() and branch_id = '' and unit = 'FR.branches' order by pos");
  return branchOf('franchise', main, rows.map(r => JSON.parse(r.data)));
}

// A backup point is a copy of the server's own data at that moment (design
// §4.5): the browser asks for one by writing its key, but nothing is uploaded.
export async function makeBackup(c: pg.ClientBase, branch: string, key: string, session: Record<string, string> = {}): Promise<boolean> {
  const main = await readMain(c, branch, mainOfBackup(key), session);
  if (!main) return false;
  const safety = isSafetyBackupKey(key);
  if (safety) await c.query(
    `delete from backups where shop_id = app_shop() and branch_id = $1 and key like '%.bak.safety-%'
        and created_at < now() - make_interval(days => $2)`, [branch, SAFETY_DAYS]);
  await c.query(
    `insert into backups (shop_id, branch_id, key, data) values (app_shop(), $1, $2, $3)
     on conflict (shop_id, branch_id, key) do ${safety ? 'nothing' : 'update set data = excluded.data, created_at = now()'}`,
    [branch, key, gzipSync(Buffer.from(main.json))]);
  return true;
}

export async function readBackup(c: pg.ClientBase, branch: string, key: string): Promise<string | null> {
  const { rows } = await c.query<{ data: Buffer }>('select data from backups where shop_id = app_shop() and branch_id = $1 and key = $2', [branch, key]);
  return rows.length ? gunzipSync(rows[0].data).toString() : null;
}

export async function readBlob(c: pg.ClientBase, branch: string, key: string): Promise<string | null> {
  const { rows } = await c.query<{ value: string }>('select value from blobs where shop_id = app_shop() and branch_id = $1 and key = $2', [branch, key]);
  return rows.length ? rows[0].value : null;
}

export async function writeBlob(c: pg.ClientBase, branch: string, key: string, value: string): Promise<void> {
  await c.query(
    `insert into blobs (shop_id, branch_id, key, value) values (app_shop(), $1, $2, $3)
     on conflict (shop_id, branch_id, key) do update set value = excluded.value, updated_at = now()`, [branch, key, value]);
}

// Removes a STORE key: a backup point, a blob, or a whole main data key.
export async function removeKey(c: pg.ClientBase, branch: string, key: string): Promise<void> {
  if (isBackupKey(key)) {
    await c.query('delete from backups where shop_id = app_shop() and branch_id = $1 and key = $2', [branch, key]);
  } else if (rootOf(key)) {
    const root = layoutUnit(key);
    await c.query('delete from records where shop_id = app_shop() and branch_id = $1 and (unit = $2 and key = $3 or unit like $4)', [branch, root, key, `${root}.%`]);
  } else {
    await c.query('delete from blobs where shop_id = app_shop() and branch_id = $1 and key = $2', [branch, key]);
  }
}
