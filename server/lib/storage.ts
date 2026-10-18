// The legacy STORE on the server (design §4): main data keys are kept as rows
// of records (split by units.ts) and put back together on read; backup points
// and other keys are kept whole. Every function runs inside withShop(): Row-
// Level Security limits it to the session's shop and branch scope, and every
// query also names the shop (app_shop()) itself, so it stays right for a role
// that RLS does not apply to (the owner opening a shop, tools/new-shop.mjs).
import type pg from 'pg';
import { gunzipSync, gzipSync } from 'node:zlib';
import { type Changes, type Row, assemble, rootOf } from './units.ts';

// Version of each row, keyed "<unit>|<key>"; the browser sends back the
// versions it last saw so the server can refuse a save that would overwrite
// someone else's change (decision P1).
export type Versions = Record<string, number>;
export const vkey = (unit: string, key: string) => `${unit}|${key}`;

export const isBackupKey = (k: string) => /^garage\.v22(::[^.]+)?\.bak\./.test(k);
const mainOfBackup = (k: string) => k.slice(0, k.indexOf('.bak.'));

// Which branch a STORE key's data belongs to. Biz/ProX: one data set ('').
// Franchise: garage.v22::<id> is that branch; garage.v22 is the branch whose
// storeKey it is (B001 in the trial chain). Chain data (franchise.v22) and
// the shop account (dgb.v22) are chain-wide ('').
export function branchOf(pkg: string, storeKey: string, branches: { id: string; storeKey?: string }[] = []): string {
  if (pkg !== 'franchise' || rootOf(storeKey) !== 'DB') return '';
  const m = /^garage\.v22::(.+)$/.exec(storeKey);
  if (m) return m[1];
  return branches.find(b => b.storeKey === storeKey)?.id ?? 'HQ';
}

// The layout row of a STORE key: unit = its root (DB, FR, DGB), key = the STORE key.
const layoutUnit = (storeKey: string) => rootOf(storeKey)!;

export async function readMain(c: pg.ClientBase, branch: string, storeKey: string, session: Record<string, string> = {}):
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
  return { json: assemble(storeKey, layout.rows[0].data, rows, { session }), versions };
}

export type WriteResult = { ok: true; versions: Versions } | { ok: false; conflicts: string[] };

// Applies one save. base: the versions the browser saw of every row it
// changes or removes (missing = it thinks the row is new). All or nothing: on
// any conflict nothing is written. A duplicate document number raises 23505,
// which the caller also reports as a conflict.
export async function writeMain(c: pg.ClientBase, branch: string, storeKey: string, base: Versions, changes: Changes,
  userId: string | null = null): Promise<WriteResult> {
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
  if (touched.length) {
    const { rows } = await c.query<{ unit: string; key: string; version: number }>(
      `select unit, key, version from records
        where shop_id = app_shop() and branch_id = $1 and (unit, key) in (select * from unnest($2::text[], $3::text[]))
        order by unit, key for update`, [branch, touched.map(t => t[0]), touched.map(t => t[1])]);
    for (const r of rows) current.set(vkey(r.unit, r.key), r.version);
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
  return { ok: true, versions };
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
  await c.query(
    `insert into backups (shop_id, branch_id, key, data) values (app_shop(), $1, $2, $3)
     on conflict (shop_id, branch_id, key) do update set data = excluded.data, created_at = now()`,
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
