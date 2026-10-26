// How long a shop may use DriveGo (task 3.15, decision A2 and the owner's answers 15.1–15.9 in
// docs/PHASE3-QUESTIONS.md). The licence is the server's (table licences, kept by DriveGo's staff with
// tools/shop-admin.mjs); the shop cannot move its own dates any more:
//   · its dates are copied into the shop's data where the legacy screens read them (DB.shop.licStart / licEnd
//     of every data set: the top bar's "Expired Date … · เหลืออายุการใช้งาน N วัน", the home banner, menu 10)
//     when the shop is opened, when staff change the licence, and over whatever a save sends (pinData); the rest
//     (its kind, for the owner panel's tag) the screens ask for (api/licence, 65-licence.js). The legacy
//     simulated cloud account's own trial fields (DGB.shop.trialStart / licensed / licEnd) are not read any more;
//   · after the last day the shop is read-only (15.3): everyone still signs in, views, prints and exports, and
//     may change their own password or suspend an employee's account; any other save is refused (403
//     { error: 'expired' }, the screens say so and reload). A franchise chain has one licence (15.7).
//   · 90 days after the last day the shop's data is removed for good, after a notice 30 days before
//     (15.5, 15.6; tools/retention.mjs). A renewal starts the count again.
// Shared by the API routes (the app's role, its own shop's row) and the staff tools (the owner, any shop).
import type pg from 'pg';
import type { Actor } from './permissions.ts';
import { type Changes, type Row, rootOf } from './units.ts';

export type Kind = 'trial' | 'pilot' | 'paid';
export const TRIAL_DAYS = 60;    // 15.2: from the day staff open the shop
export const PILOT_YEARS = 1;    // 15.2: pilot garages, from opening
export const KEEP_DAYS = 90;     // 15.5: after the last day, then the data is removed
export const NOTICE_DAYS = 30;   // 15.5: the shop is told this long before
export const WARN_DAYS = 30;     // 15.4: the legacy home banner (renderLicense) shows from this many days before

export interface Licence {
  kind: Kind;
  start: string;           // yyyy-mm-dd
  end: string;             // last day the shop may change its data
  deleteOn: string;        // when the data is removed (ends_on + KEEP_DAYS unless staff moved it)
  noticeSentOn: string | null;   // when the shop was told its data will be removed
  contact: string;
}

// ---------- days (yyyy-mm-dd, as the legacy app counts them: iso(), addDays(), daysBetween()) ----------

const DAY = /^\d{4}-\d\d-\d\d$/;
const utc = (d: string) => new Date(d + 'T00:00:00Z');
const fmt = (d: Date) => d.toISOString().slice(0, 10);
export const isDay = (d: unknown): d is string => typeof d === 'string' && DAY.test(d) && fmt(utc(d)) === d;
export function addDays(d: string, n: number): string { const x = utc(d); x.setUTCDate(x.getUTCDate() + n); return fmt(x); }
// Like the legacy extendLic(): setFullYear, so 29 Feb + 1 year is 1 Mar.
export function addYears(d: string, n: number): string { const x = utc(d); x.setUTCFullYear(x.getUTCFullYear() + n); return fmt(x); }
export const daysBetween = (a: string, b: string) => Math.round((utc(b).getTime() - utc(a).getTime()) / 86400000);

// Today in Thailand, where the shops are. The tests freeze the browsers' clock at 2026-10-13 and their shops'
// licences come from the fixtures, so the server they start (tools/serve-new.mjs) is given that day too; both
// settings are needed, so a production server never runs on a fixed day by accident.
export function today(): string {
  const fixed = process.env.DRIVEGO_TODAY;
  if (fixed && process.env.DRIVEGO_TEST_SERVER === '1') {
    if (!isDay(fixed)) throw new Error(`DRIVEGO_TODAY is not a day: ${fixed}`);
    return fixed;
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

// ---------- reading ----------

export type LicenceRow = { kind: Kind; starts_on: string; ends_on: string; delete_on: string | null; notice_sent_on: string | null; contact: string };
export const COLUMNS = "kind, starts_on::text, ends_on::text, delete_on::text, notice_sent_on::text, contact";
export const fromRow = (r: LicenceRow): Licence => ({
  kind: r.kind, start: r.starts_on, end: r.ends_on, deleteOn: r.delete_on ?? addDays(r.ends_on, KEEP_DAYS),
  noticeSentOn: r.notice_sent_on, contact: r.contact,
});

// The licence of the transaction's shop (inside withShop). null: none (the shop is treated as expired).
export async function licenceOf(c: pg.ClientBase, { lock = false } = {}): Promise<Licence | null> {
  const { rows } = await c.query<LicenceRow>(`select ${COLUMNS} from licences where shop_id = app_shop()${lock ? ' for update' : ''}`);
  return rows.length ? fromRow(rows[0]) : null;
}

export const expired = (l: Licence | null, day = today()) => !l || day > l.end;

// ---------- the dates in the shop's data ----------

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);

// A DB.shop row with the licence's dates, the other fields untouched and in place.
export function pinRow(row: Row, l: Licence): Row {
  if (row.unit !== 'DB.shop' || row.key !== '') return row;
  const v = JSON.parse(row.data);
  if (!isObj(v)) return row;
  Object.assign(v, { licStart: l.start, licEnd: l.end });
  const data = JSON.stringify(v);
  return data === row.data ? row : { ...row, data };
}

// What a save writes, with the licence's dates over whatever the browser sent (saveSetting, a wipe, an import,
// the sample data, a franchise branch's new data set all write dates of their own).
export function pinData(changes: Changes, l: Licence | null): Changes {
  if (!l) return changes;
  let changed = false;
  const upsert = changes.upsert.map(r => { const p = pinRow(r, l); if (p !== r) changed = true; return p; });
  return changed ? { ...changes, upsert } : changes;
}

// Puts the licence into every stored DB.shop row of the shop (every franchise branch). Run inside
// withShop(shop, '*') by the owner (staff tools, opening a shop). Each changed row gets a new version, so a
// browser that still shows the old dates and saves that row hears that someone else changed it (decision P1),
// and is recorded in change_log like any change.
export async function writeLicenceIntoData(c: pg.ClientBase, l: Licence): Promise<number> {
  const { rows } = await c.query<{ branch_id: string; unit: string; key: string; data: string }>(
    `select branch_id, unit, key, data::text as data from records
      where shop_id = app_shop() and unit = 'DB.shop' and key = '' order by branch_id`);
  let n = 0;
  for (const r of rows) {
    const p = pinRow(r, l);
    if (p === r) continue;
    const { rows: [u] } = await c.query<{ version: number }>(
      `update records set data = $4::json, version = version + 1, updated_at = now()
        where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = $3 returning version`, [r.branch_id, r.unit, r.key, p.data]);
    const storeKey = await storeKeyOf(c, r.branch_id);
    await c.query(
      `insert into change_log (shop_id, branch_id, user_id, store_key, unit, key, op, version, before, after)
       values (app_shop(), $1, null, $2, $3, $4, 'update', $5, $6::json, $7::json)`, [r.branch_id, storeKey, r.unit, r.key, u.version, r.data, p.data]);
    n++;
  }
  return n;
}

// The STORE key of a branch's data set (the layout row of its DB records).
async function storeKeyOf(c: pg.ClientBase, branch: string): Promise<string> {
  const { rows } = await c.query<{ key: string }>("select key from records where shop_id = app_shop() and branch_id = $1 and unit = 'DB' limit 1", [branch]);
  return rows[0]?.key ?? 'garage.v22';
}

// ---------- read-only after the last day (15.3) ----------

// What viewing writes, which a read-only shop must still be able to do: the legacy app logs opening, printing
// and exporting a document in the audit log (logAudit, sent with the next save) and trims the log to its last
// 3,000 entries above 4,000.
export const VIEW_ACTS = ['open', 'print', 'export'];
const AUDIT_MAX = 4000, AUDIT_KEEP = 3000;

export type Refusal = { error: 'expired' | 'suspended'; what: string };

async function stored(c: pg.ClientBase, branch: string, unit: string, keys: string[]): Promise<Map<string, string>> {
  if (!keys.length) return new Map();
  const { rows } = await c.query<{ key: string; data: string }>(
    'select key, data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = any($3)', [branch, unit, keys]);
  return new Map(rows.map(r => [r.key, r.data]));
}
async function shopStatus(c: pg.ClientBase): Promise<string> {
  return (await c.query<{ status: string }>('select status from shops where id = app_shop()')).rows[0]?.status ?? '';
}

// A save of a main data key (after pinData): null when it may be written.
export async function refuseExpiredSave(c: pg.ClientBase, a: Actor, branch: string, key: string, changes: Changes,
  secrets: { unit: string; key: string; field: string }[], l: Licence | null): Promise<Refusal | null> {
  if (await shopStatus(c) !== 'active') return { error: 'suspended', what: key };
  if (!expired(l)) return null;
  const no = (what: string): Refusal => ({ error: 'expired', what });
  if (changes.layout !== undefined) return no(`${key}: layout`);
  const ordered = Object.keys(changes.order);
  if (ordered.length) return no(ordered[0]);

  const units = [...new Set([...changes.upsert, ...changes.remove].map(r => r.unit))];
  for (const unit of units) {
    const up = changes.upsert.filter(r => r.unit === unit), rm = changes.remove.filter(r => r.unit === unit);
    const before = await stored(c, branch, unit, [...up, ...rm].map(r => r.key));
    for (const r of up) {
      const old = before.get(r.key);
      if (old === r.data) continue;                         // written as it is (a pinned DB.shop row, …)
      const now = JSON.parse(r.data) as unknown;
      if (unit === 'DB.audit' && old === undefined && isObj(now) && VIEW_ACTS.includes(String(now.act))) continue;
      if (old !== undefined && isObj(now) && suspendsAccount(unit, JSON.parse(old), now)) continue;
      return no(`${unit}|${r.key}`);
    }
    if (rm.length) {
      // Only the audit log's own trimming: its oldest entries, while it stays at least AUDIT_KEEP long.
      if (unit !== 'DB.audit') return no(`${unit}|${rm[0].key}`);
      const { rows: [{ n }] } = await c.query<{ n: number }>(
        "select count(*)::int as n from records where shop_id = app_shop() and branch_id = $1 and unit = 'DB.audit'", [branch]);
      const added = up.filter(r => !before.has(r.key)).length;
      if (n + added <= AUDIT_MAX || n - rm.length + added < AUDIT_KEEP) return no(`${unit}|${rm[0].key}`);
    }
  }
  // Passwords: only one's own (the screens' change-password forms).
  for (const s of secrets) if (!ownSecret(a, s, rootOf(key))) return no(`${s.unit}|${s.key}.${s.field}`);
  return null;
}

// Suspending an employee's sign-in (15.3): only the account's on/off switch, turned off. Who may do it is
// lib/permissions.ts's to decide, as always.
function suspendsAccount(unit: string, old: unknown, now: Rec): boolean {
  if (!isObj(old)) return false;
  const field = unit === 'DB.emp' ? 'dgbActive' : unit === 'FR.accounts' ? 'active' : '';
  if (!field || now[field] !== false || old[field] === false) return false;
  const rest = (x: Rec) => JSON.stringify({ ...x, [field]: null });
  return rest(old) === rest(now);
}

function ownSecret(a: Actor, s: { unit: string; key: string }, root: string | null): boolean {
  if (s.unit === 'DGB.shop') return root === 'DGB' && a.role === 'owner';
  if (s.unit === 'DB.emp') return (a.role === 'emp' ? a.ref : a.emp) === s.key;
  if (s.unit === 'FR.accounts') return a.ref === s.key;
  return false;
}

// Other STORE keys (PUT, DELETE): a backup point is a copy of the server's own data, and the daily backups trim
// the oldest ones (03.js autoBackup), so those go on; nothing else is written or removed.
export async function refuseExpiredKey(c: pg.ClientBase, key: string, method: 'PUT' | 'DELETE', isBackup: boolean,
  isSafety: boolean, l: Licence | null): Promise<Refusal | null> {
  if (await shopStatus(c) !== 'active') return { error: 'suspended', what: key };
  if (!expired(l)) return null;
  if (isBackup && (method === 'PUT' || !isSafety)) return null;
  return { error: 'expired', what: key };
}
