// What a save may do to the shape of a shop's data, whole-data replacements and backup points, checked on the server
// (security review 2026-11-23, docs/SECURITY-AUDIT-2026-11.md ก4). An employee with no rights could, with one request
// made round the screens: change the layout so that the data could not be read any more (every device of the shop
// failed to open), or replace it with anything; wipe the data and overwrite the day's backup point; put text into a
// backup point that gave them every right when the owner restored it. The screens never do any of that.
import type pg from 'pg';
import type { Actor } from './permissions.ts';
import { type Changes, type Root, SESSION_UNITS, kindsOf } from './units.ts';

type Rec = Record<string, unknown>;
type Entry = [string, unknown];

// ---------- the layout ----------
// A layout as split() writes it: a list of [field, kind], kinds as units.ts kindsOf allows, each field once. The
// root is always a list: the app's data is an object ('"D"' is what a non-object would give).
function shapeProblem(entries: unknown, path: string): string | null {
  if (!Array.isArray(entries)) return `${path}: not a layout`;
  const seen = new Set<string>();
  for (const e of entries) {
    if (!Array.isArray(e) || e.length !== 2 || typeof e[0] !== 'string' || !e[0] || e[0].includes('.')) return `${path}: bad entry`;
    const [field, kind] = e as Entry, unit = `${path}.${field}`;
    if (seen.has(field)) return `${unit}: twice`;
    seen.add(field);
    const allowed = kindsOf(unit);
    if (Array.isArray(kind)) {
      if (!allowed.includes('G')) return `${unit}: not a group`;
      const inner = shapeProblem(kind, unit);
      if (inner) return inner;
    } else if (typeof kind !== 'string' || !allowed.includes(kind)) return `${unit}: kind ${String(kind)}`;
  }
  return null;
}

// Fields of the stored layout the new one dropped or changed the kind of (a nested layout counts as 'G').
function dropped(before: unknown, after: unknown, path: string): string | null {
  if (!Array.isArray(before) || !Array.isArray(after)) return null;
  const now = new Map((after as Entry[]).map(([f, k]) => [f, k]));
  for (const [field, kind] of before as Entry[]) {
    const unit = `${path}.${field}`;
    if (!now.has(field)) return `${unit}: removed`;
    const k = now.get(field);
    if (Array.isArray(kind) !== Array.isArray(k)) return `${unit}: kind changed`;
    if (Array.isArray(kind)) { const inner = dropped(kind, k, unit); if (inner) return inner; }
    else if (kind !== k) return `${unit}: kind changed`;
  }
  return null;
}

const managerOf = (a: Actor, branch: string) => a.role === 'owner' || a.role === 'HQ' || (a.role === 'HB' && a.branch === branch);

// Why a save's layout is refused, or null. Anyone: a well-formed layout. Not a manager: nothing of the stored layout
// dropped or changed (the screens add fields, e.g. the first credit note; only the owner's whole-data replacements and
// trial copies drop them).
export async function layoutProblem(c: pg.ClientBase, a: Actor, root: Root, branch: string, storeKey: string, layout: string | undefined,
  whole: unknown): Promise<string | null> {
  if (layout === undefined) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(layout); } catch { return `${root}: layout not JSON`; }
  const bad = shapeProblem(parsed, root);
  if (bad) return bad;
  if (managerOf(a, branch) || whole) return null;
  const { rows } = await c.query<{ data: string }>(   // the layout row: unit = the root, key = the STORE key (storage.ts)
    'select data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = $3', [branch, root, storeKey]);
  if (!rows.length) return null;
  let stored: unknown;
  try { stored = JSON.parse(JSON.parse(rows[0].data)); } catch { try { stored = JSON.parse(rows[0].data); } catch { return null; } }
  return dropped(stored, parsed, root);
}

// Rows outside the key's root, or of no field (`DB.`, which only a non-object root would have).
export function rowsProblem(root: Root, changes: Changes): string | null {
  for (const r of [...changes.upsert, ...changes.remove])
    if (!r.unit.startsWith(`${root}.`) || r.unit.length === root.length + 1) return `${r.unit}|${r.key}: not a field of ${root}`;
  return null;
}

// After a save that changed the layout: every whole-value field ('D') has its one row, so the data can be put back
// together (units.ts assemble); otherwise the save is refused (the caller rolls the transaction back).
export async function layoutComplete(c: pg.ClientBase, root: Root, branch: string, storeKey: string): Promise<string | null> {
  const { rows: l } = await c.query<{ data: string }>(
    'select data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = $3', [branch, root, storeKey]);
  if (!l.length) return null;
  let layout: unknown;
  try { layout = JSON.parse(JSON.parse(l[0].data)); } catch { try { layout = JSON.parse(l[0].data); } catch { return `${root}: layout unreadable`; } }
  const want: string[] = [];
  const walk = (entries: unknown, path: string) => {
    if (!Array.isArray(entries)) return;
    for (const [f, k] of entries as Entry[]) { const unit = `${path}.${f}`; if (Array.isArray(k)) walk(k, unit); else if (k === 'D') want.push(unit); }
  };
  walk(layout, root);
  if (!want.length) return null;
  const { rows } = await c.query<{ unit: string; n: number; blank: number }>(
    `select unit, count(*)::int as n, count(*) filter (where key = '')::int as blank from records
      where shop_id = app_shop() and branch_id = $1 and unit = any($2) group by unit`, [branch, want]);
  const got = new Map(rows.map(r => [r.unit, r]));
  for (const u of want) { const r = got.get(u); if (!r || r.n !== 1 || r.blank !== 1) return `${u}: no single value`; }
  return null;
}

// ---------- rights of the whole-data replacements, backup points ----------
// The legacy rights of menu 10 (03.js): ล้างข้อมูลทั้งระบบ (doc.wipe), นำเข้าข้อมูลจากไฟล์ (doc.import),
// สำรองและกู้คืนข้อมูลทั้งระบบ (doc.backup). The owner, HQ and a branch head have them all; an employee (or a staff
// account signed in as one) by their record; a staff account of no employee has none.
async function hasDocRight(c: pg.ClientBase, a: Actor, branch: string, right: string): Promise<boolean> {
  if (managerOf(a, branch)) return true;
  const self = a.role === 'emp' ? a.ref : a.emp ?? '';
  if (!self) return false;
  const { rows } = await c.query<{ data: string }>(
    "select data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = 'DB.emp' and key = $2", [a.branch, self]);
  if (!rows.length) return false;
  const doc = (((JSON.parse(rows[0].data) as Rec).perms as Rec | undefined)?.doc ?? {}) as Rec;
  return doc[right] === true;
}

const WHOLE_RIGHT: Record<string, string> = { wipe: 'wipe', import: 'import', restore: 'backup' };
// Why a save marked as replacing the whole data (03.js guardWholeData: wipe, import, restore, sample, demo36) is refused.
export async function wholeProblem(c: pg.ClientBase, a: Actor, branch: string, whole: string | undefined): Promise<string | null> {
  if (!whole) return null;
  const right = WHOLE_RIGHT[whole];
  if (right) return (await hasDocRight(c, a, branch, right)) ? null : `whole ${whole}`;
  if (whole === 'sample' || whole === 'demo36') return managerOf(a, branch) ? null : `whole ${whole}`;
  return `whole ${whole}`;
}

// The backup points the screens make (03.js): the day's automatic one, before a restore, before the sale flow, and
// the safety copies of guardWholeData.
const BACKUP_NAME = /^garage\.v22(::[^.]+)?\.bak\.(\d{4}-\d{2}-\d{2}|before-restore|before-saleflow|safety-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-[a-z][a-z0-9]*)$/;
export const backupNameOk = (key: string) => BACKUP_NAME.test(key);
const dayOf = (key: string) => (/\.bak\.(\d{4}-\d{2}-\d{2})$/.exec(key) ?? [])[1];

// What a request to make a backup point may do: 'make' it, 'skip' it (answered as made: the day's point is there
// already, or it is not this person's to make — every device makes the day's point when it first saves), or 'refuse'.
// Someone with the backup right (and managers) make any of them; anyone else only the day's point (today or
// yesterday, Bangkok time) while it does not exist yet, so it cannot be overwritten with emptied data.
export async function backupAllowed(c: pg.ClientBase, a: Actor, branch: string, key: string, today: string): Promise<'make' | 'skip' | 'refuse'> {
  if (!backupNameOk(key)) return 'refuse';
  if (await hasDocRight(c, a, branch, 'backup')) return 'make';
  const day = dayOf(key);
  if (!day) return 'skip';
  const y = new Date(`${today}T00:00:00Z`); y.setUTCDate(y.getUTCDate() - 1);
  if (day !== today && day !== y.toISOString().slice(0, 10)) return 'skip';
  const { rows } = await c.query('select 1 from backups where shop_id = app_shop() and branch_id = $1 and key = $2', [branch, key]);
  return rows.length ? 'skip' : 'make';
}

// ---------- session fields ----------
// A save's session fields (who is signed in on this device, its branch): only the root's session units, each a JSON
// value. Before, any text was kept and put raw into the data the next read (and a backup point) was made of.
export function sessionProblem(root: Root, session: unknown): string | null {
  if (session === undefined || session === null) return null;
  if (typeof session !== 'object' || Array.isArray(session)) return 'session: not an object';
  const known = new Set(SESSION_UNITS(root));
  for (const [unit, v] of Object.entries(session as Rec)) {
    if (!known.has(unit)) return `session: ${unit}`;
    if (typeof v !== 'string') return `session: ${unit}`;
    try { JSON.parse(v); } catch { return `session: ${unit}`; }
  }
  return null;
}

// ---------- the audit log ----------
// The screens keep the last 3,000 entries once there are more than 4,000 (03.js logAudit): a save may remove many
// entries only so; otherwise at most `max` (as other documents, whole-data.ts).
export async function auditProblem(c: pg.ClientBase, branch: string, changes: Changes, max: number, whole: unknown): Promise<string | null> {
  if (whole) return null;
  const removed = changes.remove.filter(r => r.unit === 'DB.audit').length;
  if (removed <= max) return null;
  const { rows } = await c.query<{ n: number }>(
    "select count(*)::int as n from records where shop_id = app_shop() and branch_id = $1 and unit = 'DB.audit'", [branch]);
  const added = changes.upsert.filter(r => r.unit === 'DB.audit').length;
  return rows[0].n - removed + added >= 3000 ? null : 'mass removal';
}
