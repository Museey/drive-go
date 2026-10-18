// Sign-in on the server (task T7, docs/PHASE2-DESIGN.md §5). The decisions
// and messages are the legacy app's, case for case:
//   Biz/ProX   the sign-in form's handler + dgbLogin()        (legacy lines 21050–21080, 20586–20607)
//   Franchise  frDoLogin()                                     (legacy lines 19433–19491)
// The legacy app made them in the browser with every password in hand; here
// the passwords are argon2id hashes in users, and the rest comes from the
// shop's own records. Run inside withShop(shop, '*').
import { hash, verify } from '@node-rs/argon2';
import type pg from 'pg';
import { branchOf } from './storage.ts';
import { SECRET_PLACEHOLDER } from './units.ts';

type Rec = Record<string, any>;   // a record of the legacy data, as stored

// Legacy helpers, same definitions.
const telNorm = (t: unknown) => String(t || '').replace(/\D/g, '');
const empActive = (e: Rec | undefined) => !!e && e.active !== false;
const frUserNorm = (u: unknown) => String(u || '').trim().toLowerCase();
const hasSecret = (v: unknown) => typeof v === 'string' && v !== '';

export const LOCKOUT = { failures: 5, minutes: 15 };   // decision Q2
export const MESSAGES = { lockedOut: 'กรอกรหัสผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่' };   // decision Q5

export interface Account { kind: 'owner' | 'emp' | 'fr'; ref: string; branch: string }
export type SignIn = { ok: true; account: Account; scope: string } | { ok: false; error: string };

async function one(c: pg.ClientBase, branch: string, unit: string, key = ''): Promise<Rec | null> {
  const { rows } = await c.query<{ data: string }>(
    'select data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = $3', [branch, unit, key]);
  return rows.length ? JSON.parse(rows[0].data) : null;
}
async function list(c: pg.ClientBase, branch: string, unit: string): Promise<Rec[]> {
  const { rows } = await c.query<{ data: string }>(
    'select data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 order by pos, key', [branch, unit]);
  return rows.map(r => JSON.parse(r.data));
}

// The users row holding an account's password hashes (created when a password is first set).
async function userRow(c: pg.ClientBase, a: Account) {
  const { rows } = await c.query<{ id: string; password_hash: string | null; pin_hash: string | null; failed_logins: Date[] }>(
    'select id, password_hash, pin_hash, failed_logins from users where shop_id = app_shop() and kind = $1 and ref = $2', [a.kind, a.ref]);
  return rows[0] ?? null;
}

// Checks one password (or PIN) of an account, counting failures (decision Q2).
// Returns 'ok', 'wrong' or 'locked'.
export async function checkPassword(c: pg.ClientBase, a: Account, field: 'password' | 'pin', value: string): Promise<'ok' | 'wrong' | 'locked'> {
  const u = await userRow(c, a);
  const since = Date.now() - LOCKOUT.minutes * 60_000;
  const recent = (u?.failed_logins || []).filter(d => new Date(d).getTime() > since);
  if (recent.length >= LOCKOUT.failures) return 'locked';
  const stored = field === 'pin' ? u?.pin_hash : u?.password_hash;
  const ok = !!stored && typeof value === 'string' && await verify(stored, value);
  if (u) await c.query('update users set failed_logins = $2 where id = $1', [u.id, ok ? [] : [...recent, new Date()]]);
  return ok ? 'ok' : 'wrong';
}

export async function signInBiz(c: pg.ClientBase, identityIn: string, password: string): Promise<SignIn> {
  const shop = await one(c, '', 'DGB.shop');
  const emps = await list(c, '', 'DB.emp');
  const identity = String(identityIn || '').trim(), normalized = identity.toLowerCase();
  const owner = !!normalized && [shop?.ownerUser, shop?.email].some(v => v && String(v).toLowerCase() === normalized);
  const phone = /^[+\d\s().-]+$/.test(identity) ? telNorm(identity) : '';
  const employees = phone ? emps.filter(e => telNorm(e.tel) === phone && hasSecret(e.dgbPass)) : [];
  if ((owner && employees.length) || employees.length > 1) return { ok: false, error: 'ข้อมูลเข้าสู่ระบบซ้ำกัน กรุณาให้ผู้ดูแลแก้ไขบัญชีก่อน' };
  if (!owner && !employees.length) return { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  if (!shop) return { ok: false, error: 'ยังไม่มีร้านในระบบ — กดสมัครเปิดร้านก่อน' };
  if (owner) {
    const okUser = normalized === shop.email || normalized === String(shop.ownerUser || '').toLowerCase();
    const account: Account = { kind: 'owner', ref: '', branch: '' };
    const r = okUser ? await checkPassword(c, account, 'password', password) : 'wrong';
    if (r === 'locked') return { ok: false, error: MESSAGES.lockedOut };
    if (r !== 'ok') return { ok: false, error: 'รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง' };
    return { ok: true, account, scope: '' };
  }
  const e = emps.find(x => empActive(x) && telNorm(x.tel) === phone && hasSecret(x.dgbPass));
  if (!e) return { ok: false, error: 'ไม่พบบัญชีพนักงานจากเบอร์นี้ — ให้เจ้าของร้านออกบัญชีในเมนู 10 ก่อน' };
  if (e.dgbActive === false) return { ok: false, error: 'บัญชีนี้ถูกระงับการใช้งาน — ติดต่อเจ้าของร้าน' };
  const account: Account = { kind: 'emp', ref: String(e.id), branch: '' };
  const r = await checkPassword(c, account, 'password', password);
  if (r === 'locked') return { ok: false, error: MESSAGES.lockedOut };
  if (r !== 'ok') return { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' };
  return { ok: true, account, scope: '' };
}

export async function signInFranchise(c: pg.ClientBase, userIn: string, password: string): Promise<SignIn> {
  const accounts = await list(c, '', 'FR.accounts');
  const branches = await list(c, '', 'FR.branches');
  const u = String(userIn || '').trim();
  const branch = (id: unknown) => branches.find(b => b.id === id) || null;
  const empsOf = async (b: Rec) => list(c, branchOf('franchise', b.storeKey || `garage.v22::${b.id}`, branches as { id: string; storeKey?: string }[]), 'DB.emp');
  const bad = (error: string): SignIn => ({ ok: false, error });

  const acc = accounts.find(x => frUserNorm(x.user) === frUserNorm(u));
  if (acc && acc.role === 'SHB') {
    const account: Account = { kind: 'fr', ref: String(acc.id), branch: String(acc.branchId || '') };
    const r = await checkPassword(c, account, 'password', password);
    if (r === 'locked') return bad(MESSAGES.lockedOut);
    if (r !== 'ok') return bad('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    if (acc.active === false) return bad('บัญชีนี้ถูกระงับการใช้งาน — ติดต่อหัวหน้าสาขา');
    const b = branch(acc.branchId);
    if (!b || b.active === false) return bad('สาขานี้ถูกระงับการใช้งานโดย HQ');
    const emp = (await empsOf(b)).find(e => e.id === acc.empId);
    if (!emp) return bad('บัญชีนี้ไม่พบข้อมูลพนักงานในสาขา — ติดต่อหัวหน้าสาขา');
    if (!empActive(emp)) return bad('บัญชีพนักงานนี้ถูกปิดการใช้งานแล้ว เข้าระบบไม่ได้');
    return { ok: true, account, scope: String(b.id) };
  }
  // Older way in: <branch head's user name>.<employee code> + the employee's PIN.
  const mm = acc ? [] : u.split(/[.\/]/).map(x => x.trim());
  if (mm.length === 2 && mm[0] && mm[1]) {
    const hb = accounts.find(x => x.role === 'HB' && String(x.user || '').toLowerCase() === mm[0].toLowerCase());
    if (!hb) return bad(`ไม่พบรหัสสาขา "${mm[0]}" — ส่วนหน้าจุดต้องเป็นรหัสสาขา เช่น b001.EMP001`);
    if (hb.active === false) return bad('รหัสสาขานี้ถูกระงับการใช้งานโดย HQ');
    const b = branch(hb.branchId);
    if (!b || b.active === false) return bad('สาขานี้ถูกระงับการใช้งานโดย HQ');
    const emp = (await empsOf(b)).find(e => String(e.code || '').toLowerCase() === mm[1].toLowerCase());
    if (!emp) return bad(`ไม่พบรหัสพนักงาน "${mm[1]}" ในสาขา ${b.code} — ตรวจสอบรหัสในเมนู 10 ส่วนที่ 2`);
    if (!empActive(emp)) return bad('บัญชีพนักงานนี้ถูกปิดการใช้งานแล้ว เข้าระบบไม่ได้');
    if (!hasSecret(emp.pin)) return bad('พนักงานคนนี้ยังไม่ได้ตั้งรหัส PIN — ให้หัวหน้าสาขา (HB) ตั้งให้ในเมนู 10 ก่อน');
    const account: Account = { kind: 'emp', ref: String(emp.id), branch: String(b.id) };
    const r = await checkPassword(c, account, 'pin', password);
    if (r === 'locked') return bad(MESSAGES.lockedOut);
    if (r !== 'ok') return bad('รหัสผ่าน (PIN) ไม่ถูกต้อง');
    return { ok: true, account, scope: String(b.id) };
  }
  // HQ / branch head: user name in any case, password exact.
  const a = accounts.find(x => String(x.user || '').toLowerCase() === u.toLowerCase());
  const account: Account | null = a ? { kind: 'fr', ref: String(a.id), branch: String(a.branchId || '') } : null;
  const r = account ? await checkPassword(c, account, 'password', password) : 'wrong';
  if (r === 'locked') return bad(MESSAGES.lockedOut);
  if (!a || r !== 'ok') return bad('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  if (a.active === false) return bad('รหัสนี้ถูกระงับการใช้งานโดย HQ — ติดต่อสำนักงานใหญ่');
  if (a.role === 'HB') {
    const b = branch(a.branchId);
    if (!b || b.active === false) return bad('สาขานี้ถูกระงับการใช้งานโดย HQ');
    return { ok: true, account: account!, scope: String(b.id) };
  }
  return { ok: true, account: account!, scope: '*' };
}

// Which account a secret field belongs to (design §1.4).
export function accountOfSecret(unit: string, key: string, branch: string): { account: Account; field: 'password' | 'pin' } | null {
  if (unit === 'DGB.shop') return { account: { kind: 'owner', ref: '', branch: '' }, field: 'password' };
  if (unit === 'FR.accounts') return { account: { kind: 'fr', ref: key, branch: '' }, field: 'password' };
  if (unit === 'DB.emp') return { account: { kind: 'emp', ref: key, branch }, field: 'password' };
  return null;
}

// Stores new passwords as hashes (the rows keep SECRET_PLACEHOLDER). A field
// set to '' clears the hash. Returns the users whose password changed, so
// their other sessions can be ended (decision Q2).
export async function storeSecrets(c: pg.ClientBase, branch: string, secrets: { unit: string; key: string; field: string; value: string }[]): Promise<string[]> {
  const changed: string[] = [];
  for (const s of secrets) {
    if (s.value === SECRET_PLACEHOLDER) continue;
    const target = accountOfSecret(s.unit, s.key, branch);
    if (!target) continue;
    const column = s.unit === 'DB.emp' && s.field === 'pin' ? 'pin_hash' : 'password_hash';
    const value = s.value === '' ? null : await hash(s.value);
    const { rows } = await c.query<{ id: string }>(
      `insert into users (shop_id, branch_id, kind, ref, ${column}) values (app_shop(), $1, $2, $3, $4)
       on conflict (shop_id, kind, ref) do update set ${column} = excluded.${column}, failed_logins = '{}', updated_at = now()
       returning id`, [target.account.branch, target.account.kind, target.account.ref, value]);
    changed.push(rows[0].id);
  }
  return changed;
}

// Whether an account may still be signed in, by the same rules as signing in
// minus the password (decision Q2: a suspended account, branch or employee
// is signed out everywhere at once).
export async function accountStillValid(c: pg.ClientBase, pkg: string, a: Account): Promise<boolean> {
  if (a.kind === 'owner') return !!(await one(c, '', 'DGB.shop'));
  if (pkg !== 'franchise') {
    const e = (await list(c, '', 'DB.emp')).find(x => String(x.id) === a.ref);
    return empActive(e) && hasSecret(e!.dgbPass) && e!.dgbActive !== false;
  }
  const accounts = await list(c, '', 'FR.accounts');
  const branches = await list(c, '', 'FR.branches');
  const branchOk = (id: unknown) => { const b = branches.find(x => x.id === id); return !!b && b.active !== false; };
  const empsOf = async (id: string) => {
    const b = branches.find(x => x.id === id);
    return b ? list(c, branchOf('franchise', b.storeKey || `garage.v22::${b.id}`, branches as { id: string; storeKey?: string }[]), 'DB.emp') : [];
  };
  if (a.kind === 'emp') {
    const hb = accounts.find(x => x.role === 'HB' && x.branchId === a.branch);
    const e = (await empsOf(a.branch)).find(x => String(x.id) === a.ref);
    return !!hb && hb.active !== false && branchOk(a.branch) && empActive(e) && hasSecret(e!.pin);
  }
  const acc = accounts.find(x => String(x.id) === a.ref);
  if (!acc || acc.active === false) return false;
  if (acc.role === 'HQ') return true;
  if (!branchOk(acc.branchId)) return false;
  if (acc.role !== 'SHB') return true;
  return empActive((await empsOf(acc.branchId)).find(x => x.id === acc.empId));
}

// Ends the sessions that may no longer exist after a save: those of users
// whose password changed (except the session that changed it) and those of
// accounts no longer valid. Runs after saves that touch accounts.
export async function endStaleSessions(c: pg.ClientBase, pkg: string, keep: Buffer | null, passwordChanged: string[]): Promise<void> {
  const { rows } = await c.query<{ id_hash: Buffer; user_id: string; kind: Account['kind']; ref: string; branch_id: string }>(
    `select s.id_hash, s.user_id, u.kind, u.ref, u.branch_id from sessions s join users u on u.id = s.user_id
      where s.shop_id = app_shop()`);
  const end: Buffer[] = [];
  const valid = new Map<string, boolean>();
  for (const r of rows) {
    if (keep && r.id_hash.equals(keep)) continue;
    if (passwordChanged.includes(r.user_id)) { end.push(r.id_hash); continue; }
    if (!valid.has(r.user_id)) valid.set(r.user_id, await accountStillValid(c, pkg, { kind: r.kind, ref: r.ref, branch: r.branch_id }));
    if (!valid.get(r.user_id)) end.push(r.id_hash);
  }
  if (end.length) await c.query('delete from sessions where shop_id = app_shop() and id_hash = any($1)', [end]);
}

// The users row of an account (its id is what a session points at).
export async function userIdOf(c: pg.ClientBase, a: Account): Promise<string | null> {
  return (await userRow(c, a))?.id ?? null;
}
