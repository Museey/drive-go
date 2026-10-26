// Coarse permission checks on the server (task T10, docs/PHASE2-DESIGN.md
// §5.1): who may change which part of a shop's data. The fine rules (each
// employee's menus, seeing prices) stay in the screens until phase 3.
import { appendFileSync } from 'node:fs';
import type pg from 'pg';
import type { Session } from './session.ts';
import { isSafetyBackupKey } from './storage.ts';
import { type Changes, rootOf } from './units.ts';
import type { Rights } from './visibility.ts';

// Who is signed in, as the legacy screens know them.
//   Biz/ProX   owner | emp (an employee signed in with a phone number)
//   Franchise  HQ | HB (branch head) | SHB (staff account) | emp (<branch>.<employee code> + PIN)
// emp: the branch employee a staff account (SHB) signs in as, when it has one (its screens follow that employee's rights).
export interface Actor { pkg: string; role: 'owner' | 'emp' | 'HQ' | 'HB' | 'SHB'; ref: string; branch: string; emp?: string }

export async function actorOf(c: pg.ClientBase, s: Session): Promise<Actor> {
  const { rows } = await c.query<{ kind: string; ref: string; branch_id: string; package: string }>(
    `select u.kind, u.ref, u.branch_id, s.package from users u join shops s on s.id = u.shop_id
      where u.shop_id = app_shop() and u.id = $1`, [s.userId]);
  const u = rows[0];
  if (!u) throw new Error('session without a user');
  if (u.kind !== 'fr') return { pkg: u.package, role: u.kind as 'owner' | 'emp', ref: u.ref, branch: u.branch_id };
  const acc = await c.query<{ data: string }>(
    "select data::text as data from records where shop_id = app_shop() and branch_id = '' and unit = 'FR.accounts' and key = $1", [u.ref]);
  const data = acc.rows.length ? JSON.parse(acc.rows[0].data) : {};
  const role = data.role || '';
  if (!['HQ', 'HB', 'SHB'].includes(role)) throw new Error(`franchise account ${u.ref} has no role`);
  return { pkg: u.package, role, ref: u.ref, branch: s.scope === '*' ? '' : s.scope, ...(role === 'SHB' && data.empId ? { emp: String(data.empId) } : {}) };
}

// What the person may see (task 3.9, lib/visibility.ts): an employee (or a staff account signed in as one) by
// the rights on that employee's record — the legacy keys the screens check (doc.fin, doc.emp); everyone else
// sees all of their scope. owner: the shop's owner, Franchise HQ or a branch head (the whole-data copies).
export async function rightsOf(c: pg.ClientBase, a: Actor): Promise<Rights> {
  const owner = a.role === 'owner' || a.role === 'HQ' || a.role === 'HB';
  const self = a.role === 'emp' ? a.ref : a.emp ?? '';
  if (!self) return { owner, pay: true, self: '' };
  const e = (await current(c, a.branch, 'DB.emp', [self])).get(self);
  const doc = ((e?.perms as Rec | undefined)?.doc ?? {}) as Rec;
  return { owner, pay: doc.fin === true || doc.emp === true, self };
}

// For working out the rules (task T10): with DRIVEGO_WRITE_TRACE set, every
// save is written to that file as one JSON line: who saved which units.
export function traceWrite(actor: Actor, key: string, changes: Changes, secrets: { unit: string; field: string }[]): void {
  const file = process.env.DRIVEGO_WRITE_TRACE;
  if (!file) return;
  const units = [...new Set([...changes.upsert, ...changes.remove].map(r => r.unit))].sort();
  appendFileSync(file, JSON.stringify({
    pkg: actor.pkg, role: actor.role, key, units, layout: changes.layout !== undefined,
    removed: [...new Set(changes.remove.map(r => r.unit))].sort(),
    secrets: [...new Set(secrets.map(x => `${x.unit}.${x.field}`))].sort(),
  }) + '\n');
}

// The rules (design §5.1), worked out from what each role saves in all the
// scenarios (DRIVEGO_WRITE_TRACE): every save of the legacy screens passes,
// and these are refused (answer 403, nothing is written):
//   shop account and chain settings   DGB.*, FR.* other than requests and their counter:
//                                     the owner (Biz/ProX) or HQ (Franchise) only
//   sign-in accounts of the chain     FR.accounts: HQ; a branch head for the staff accounts of
//                                     its own branch; anyone for their own account (password)
//                                     without changing its role, branch or status
//   branch requests                   FR.reqs: HQ, or a branch's own people for that branch's requests
//   employees' accounts               DB.emp fields dgbPass, dgbActive, pin, perms: the owner, HQ,
//                                     or the head of that branch; removing an employee who has an account too
//   passwords sent with a save        the same rules as the record they belong to
// Branch scope (another branch's data) is checked before this (inScope).
type Rec = Record<string, unknown>;
const EMP_ACCOUNT_FIELDS = ['dgbPass', 'dgbActive', 'pin', 'perms'];
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

async function current(c: pg.ClientBase, branch: string, unit: string, keys: string[]): Promise<Map<string, Rec>> {
  if (!keys.length) return new Map();
  const { rows } = await c.query<{ key: string; data: string }>(
    'select key, data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = any($3)', [branch, unit, keys]);
  return new Map(rows.map(r => [r.key, JSON.parse(r.data)]));
}

export async function refuseSave(c: pg.ClientBase, a: Actor, branch: string, key: string, changes: Changes,
  secrets: { unit: string; key: string; field: string; value: string }[]): Promise<string | null> {
  const shopManager = a.role === 'owner' || a.role === 'HQ';
  const branchManager = shopManager || (a.role === 'HB' && a.branch === branch);
  const root = rootOf(key);
  const touched = (unit: string) => [...changes.upsert.filter(r => r.unit === unit), ...changes.remove.filter(r => r.unit === unit)];
  const units = new Set([...changes.upsert, ...changes.remove].map(r => r.unit));

  // Shop account and chain settings.
  if (!shopManager && root !== 'DB') {
    if (changes.layout !== undefined) return `${key}: layout`;
    for (const u of units) if (!['FR.reqs', 'FR.seq', 'FR.accounts'].includes(u)) return u;
  }

  // Sign-in accounts of the chain.
  const accRows = touched('FR.accounts');
  if (accRows.length && !shopManager) {
    const before = await current(c, '', 'FR.accounts', accRows.map(r => r.key));
    const after = new Map(changes.upsert.filter(r => r.unit === 'FR.accounts').map(r => [r.key, JSON.parse(r.data) as Rec]));
    for (const r of accRows) {
      const old = before.get(r.key), now = after.get(r.key);   // now undefined = removed
      const staffOfMine = (x?: Rec) => !x || (a.role === 'HB' && x.role === 'SHB' && x.branchId === a.branch);
      const own = r.key === a.ref && !!old && !!now && ['role', 'branchId', 'active'].every(f => same(old[f], now[f]));
      if (!own && !(staffOfMine(old) && staffOfMine(now) && (old || now))) return `FR.accounts|${r.key}`;
    }
  }

  // Branch requests.
  const reqRows = touched('FR.reqs');
  if (reqRows.length && !shopManager) {
    const before = await current(c, '', 'FR.reqs', reqRows.map(r => r.key));
    const after = new Map(changes.upsert.filter(r => r.unit === 'FR.reqs').map(r => [r.key, JSON.parse(r.data) as Rec]));
    for (const r of reqRows) {
      const old = before.get(r.key), now = after.get(r.key);
      if ((old && old.branchId !== a.branch) || (now && now.branchId !== a.branch) || !a.branch) return `FR.reqs|${r.key}`;
    }
  }

  // Employees' accounts.
  const empRows = touched('DB.emp');
  if (empRows.length && !branchManager) {
    const before = await current(c, branch, 'DB.emp', empRows.map(r => r.key));
    const after = new Map(changes.upsert.filter(r => r.unit === 'DB.emp').map(r => [r.key, JSON.parse(r.data) as Rec]));
    for (const r of empRows) {
      const old = before.get(r.key), now = after.get(r.key);
      const hasAccount = (x?: Rec) => !!x && (!!x.dgbPass || !!x.pin || x.dgbActive === true);
      if (!now && hasAccount(old)) return `DB.emp|${r.key}`;
      if (now && old && EMP_ACCOUNT_FIELDS.some(f => !same(old[f], now[f]))) return `DB.emp|${r.key}`;
      if (now && !old && hasAccount(now)) return `DB.emp|${r.key}`;
    }
  }

  // Passwords sent with the save.
  for (const x of secrets) {
    if (x.unit === 'DGB.shop' && !shopManager) return 'DGB.shop.pass';
    if (x.unit === 'DB.emp' && !branchManager) return `DB.emp|${x.key}.${x.field}`;
    if (x.unit === 'FR.accounts' && !shopManager && x.key !== a.ref) {
      const sent = changes.upsert.find(r => r.unit === 'FR.accounts' && r.key === x.key);
      const target = (await current(c, '', 'FR.accounts', [x.key])).get(x.key) ?? (sent ? JSON.parse(sent.data) as Rec : undefined);
      if (!(a.role === 'HB' && target && target.role === 'SHB' && target.branchId === a.branch)) return `FR.accounts|${x.key}.pass`;
    }
  }
  return null;
}

// Removing a whole data set (wipe, restore): its manager only.
export function refuseRemoveKey(a: Actor, branch: string, key: string): string | null {
  // The copies made before the whole data set is replaced stay their 90 days (task 3.2, F1).
  if (isSafetyBackupKey(key)) return key;
  const shopManager = a.role === 'owner' || a.role === 'HQ';
  const root = rootOf(key.includes('.bak.') ? key.slice(0, key.indexOf('.bak.')) : key);
  if (!root) return null;
  if (root === 'DB') return shopManager || (a.role === 'HB' && a.branch === branch) ? null : key;
  return shopManager ? null : key;
}

