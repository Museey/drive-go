// Coarse permission checks on the server (task T10, docs/PHASE2-DESIGN.md
// §5.1): who may change which part of a shop's data. The fine rules (each
// employee's menus, seeing prices) stay in the screens until phase 3.
import { appendFileSync } from 'node:fs';
import type pg from 'pg';
import type { Session } from './session.ts';
import type { Changes } from './units.ts';

// Who is signed in, as the legacy screens know them.
//   Biz/ProX   owner | emp (an employee signed in with a phone number)
//   Franchise  HQ | HB (branch head) | SHB (staff account) | emp (<branch>.<employee code> + PIN)
export interface Actor { pkg: string; role: 'owner' | 'emp' | 'HQ' | 'HB' | 'SHB'; ref: string; branch: string }

export async function actorOf(c: pg.ClientBase, s: Session): Promise<Actor> {
  const { rows } = await c.query<{ kind: string; ref: string; branch_id: string; package: string }>(
    `select u.kind, u.ref, u.branch_id, s.package from users u join shops s on s.id = u.shop_id
      where u.shop_id = app_shop() and u.id = $1`, [s.userId]);
  const u = rows[0];
  if (!u) throw new Error('session without a user');
  if (u.kind !== 'fr') return { pkg: u.package, role: u.kind as 'owner' | 'emp', ref: u.ref, branch: u.branch_id };
  const acc = await c.query<{ data: string }>(
    "select data::text as data from records where shop_id = app_shop() and branch_id = '' and unit = 'FR.accounts' and key = $1", [u.ref]);
  const role = acc.rows.length ? JSON.parse(acc.rows[0].data).role : '';
  if (!['HQ', 'HB', 'SHB'].includes(role)) throw new Error(`franchise account ${u.ref} has no role`);
  return { pkg: u.package, role, ref: u.ref, branch: s.scope === '*' ? '' : s.scope };
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
