// The staff web page's accounts and sign-in (0008_staff.sql; docs/NOTES.md "หน้าเว็บของทีมงาน"). Signing in takes
// three steps: the password, then the code of the authenticator app; a temporary password (a new account, or one
// given again) must be changed first, and the app set up the first time. Accounts are added, given a new temporary
// password, turned off and on only by the database owner (tools/shop-admin.mjs staff …).
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import pg from 'pg';
import { LOCKOUT, deviceFailed, deviceLocked } from './auth.ts';
import { pgConfig } from './pg-config.ts';
import { temporaryPassword } from './shop-open.ts';
import { matchingStep, newSecret, otpauthUri, qrSvg } from './totp.ts';

export const STAFF_COOKIE = 'dg_staff';
export const STAFF_MIN_PASSWORD = 12;
export const STAGE_MINUTES = 10;   // from the right password to the code (or the new password, or the app's set-up)
export const SESSION_HOURS = 8;    // a signed-in staff page, at most
export const IDLE_MINUTES = 60;    // signed out after this long without a request
const LOGIN = /^[a-z0-9._-]{2,40}$/;

// The staff page's connection, as drivego_staff (its own app: .do/staff.yaml). One pool per process, kept on
// globalThis as db.ts does.
const holder = globalThis as typeof globalThis & { __drivegoStaffPool?: pg.Pool };
export function staffPool(): pg.Pool {
  if (!process.env.STAFF_DATABASE_URL) throw new Error('STAFF_DATABASE_URL is not set');
  return (holder.__drivegoStaffPool ??= new pg.Pool({ ...pgConfig(process.env.STAFF_DATABASE_URL), max: 5 }));
}

type Db = pg.Pool | pg.ClientBase;
export interface StaffRow {
  id: string; login: string; name: string; password_hash: string; must_change: boolean; totp_secret: string | null;
  totp_pending: string | null; totp_last_step: string; active: boolean; failed_logins: Date[];
}
export type Next = 'password' | 'app' | 'code';
export interface StaffSession { tokenHash: Buffer; stage: 'password' | 'full'; staff: StaffRow }

const tokenHash = (token: string) => createHash('sha256').update(token).digest();
const norm = (login: unknown) => String(login ?? '').trim().toLowerCase();
const recent = (failed: Date[]) => (failed || []).filter(d => new Date(d).getTime() > Date.now() - LOCKOUT.minutes * 60_000);
export const nextStep = (s: Pick<StaffRow, 'must_change' | 'totp_secret'>): Next => s.must_change ? 'password' : !s.totp_secret ? 'app' : 'code';
// Who did it, as licence_log keeps it (tools/shop-admin.mjs: --by or the operating system user).
export const actorOf = (s: StaffSession) => `web:${s.staff.login}`;

async function log(db: Db, login: string, actor: string, action: string, address = '', detail: object = {}) {
  await db.query('insert into staff_log (login, actor, action, address, detail) values ($1, $2, $3, $4, $5)',
    [login, actor, action, address, JSON.stringify(detail)]);
}
async function byLogin(db: Db, login: string): Promise<StaffRow | null> {
  const { rows } = await db.query<StaffRow>('select * from staff where login = $1', [login]);
  return rows[0] ?? null;
}

// ---------- accounts (the database owner: tools/shop-admin.mjs staff …) ----------

export async function addStaff(db: pg.Pool, o: { login: string; name: string; actor: string }): Promise<{ login: string; password: string }> {
  const login = norm(o.login), name = String(o.name ?? '').trim();
  if (!LOGIN.test(login)) throw new Error(`login: 2–40 small letters, digits, dots, hyphens or underscores: ${login}`);
  if (!name) throw new Error('--name is required');
  if (await byLogin(db, login)) throw new Error(`a staff account ${login} exists already`);
  const password = temporaryPassword(12);
  await db.query('insert into staff (login, name, password_hash) values ($1, $2, $3)', [login, name, await hash(password)]);
  await log(db, login, o.actor, 'add', '', { name });
  return { login, password };
}

// A new temporary password, and the authenticator app to set up again (a lost phone): every sign-in of the account ends.
export async function resetStaff(db: pg.Pool, loginIn: string, o: { actor: string }): Promise<{ login: string; password: string }> {
  const login = norm(loginIn);
  const s = await byLogin(db, login);
  if (!s) throw new Error(`no staff account ${login}`);
  const password = temporaryPassword(12);
  await db.query(`update staff set password_hash = $2, must_change = true, totp_secret = null, totp_pending = null,
    failed_logins = '{}', updated_at = now() where id = $1`, [s.id, await hash(password)]);
  await db.query('delete from staff_sessions where staff_id = $1', [s.id]);
  await log(db, login, o.actor, 'reset');
  return { login, password };
}

export async function setStaffActive(db: pg.Pool, loginIn: string, active: boolean, o: { actor: string }): Promise<void> {
  const login = norm(loginIn);
  const s = await byLogin(db, login);
  if (!s) throw new Error(`no staff account ${login}`);
  await db.query('update staff set active = $2, failed_logins = \'{}\', updated_at = now() where id = $1', [s.id, active]);
  if (!active) await db.query('delete from staff_sessions where staff_id = $1', [s.id]);
  await log(db, login, o.actor, active ? 'on' : 'off');
}

export async function listStaff(db: pg.Pool) {
  const { rows } = await db.query<{ login: string; name: string; active: boolean; must_change: boolean; app: boolean; created_at: Date; last_in: Date | null }>(
    `select s.login, s.name, s.active, s.must_change, s.totp_secret is not null as app, s.created_at,
            (select max(l.at) from staff_log l where l.login = s.login and l.action = 'signed-in') as last_in
       from staff s order by s.login`);
  return rows;
}

// ---------- sessions ----------

function cookieToken(req: Request): string | null {
  for (const part of (req.headers.get('cookie') || '').split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === STAFF_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function staffCookie(token: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1' ? '; Secure' : '';
  return `${STAFF_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}
export const signedOutCookie = () => staffCookie('', 0);

async function startSession(db: Db, staffId: string, stage: 'password' | 'full', address: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const minutes = stage === 'full' ? SESSION_HOURS * 60 : STAGE_MINUTES;
  await db.query(`insert into staff_sessions (id_hash, staff_id, stage, address, expires_at)
    values ($1, $2, $3, $4, now() + make_interval(mins => $5))`, [tokenHash(token), staffId, stage, address, minutes]);
  return staffCookie(token, minutes * 60);
}

// The signed-in staff session of a request: not expired, not idle too long, its account still on.
export async function getStaffSession(req: Request, db: Db = staffPool()): Promise<StaffSession | null> {
  const token = cookieToken(req);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const h = tokenHash(token);
  const { rows } = await db.query<{ stage: 'password' | 'full'; staff: StaffRow }>(
    `select x.stage, row_to_json(s) as staff from staff_sessions x join staff s on s.id = x.staff_id
      where x.id_hash = $1 and x.expires_at > now() and s.active
        and (x.stage = 'password' or x.last_seen_at > now() - make_interval(mins => $2))`, [h, IDLE_MINUTES]);
  if (!rows.length) return null;
  if (rows[0].stage === 'full') await db.query('update staff_sessions set last_seen_at = now() where id_hash = $1', [h]);
  return { tokenHash: h, stage: rows[0].stage, staff: rows[0].staff };
}

// The password step's session becomes a signed-in one with a new token (the old one stops working).
async function promote(db: Db, s: StaffSession, address: string): Promise<string> {
  await db.query('delete from staff_sessions where id_hash = $1', [s.tokenHash]);
  await db.query('update staff set failed_logins = \'{}\' where id = $1', [s.staff.id]);
  await log(db, s.staff.login, s.staff.login, 'signed-in', address);
  return startSession(db, s.staff.id, 'full', address);
}

export async function signOut(db: Db, s: StaffSession, address: string): Promise<void> {
  await db.query('delete from staff_sessions where id_hash = $1', [s.tokenHash]);
  await log(db, s.staff.login, s.staff.login, 'signed-out', address);
}

// ---------- signing in ----------

export type Step = { ok: true; next: Next | 'done'; cookie?: string } | { ok: false; error: 'wrong' | 'locked' | 'short' | 'same' | 'stage' };

// Checked even when there is no such account, so the time taken does not tell which names exist.
let dummy: Promise<string> | undefined;

// One more failure, counted in one statement (requests at the same time each count).
async function failed(db: Db, s: StaffRow, action: string, address: string): Promise<Step> {
  const { rows } = await db.query<{ n: number }>(
    `update staff set failed_logins = array_append(array(select t from unnest(failed_logins) t where t > now() - make_interval(mins => $2)), now())
      where id = $1 returning cardinality(failed_logins) as n`, [s.id, LOCKOUT.minutes]);
  deviceFailed(address);
  await log(db, s.login, s.login, (rows[0]?.n ?? 0) >= LOCKOUT.failures ? 'locked' : action, address);
  return { ok: false, error: 'wrong' };
}

export async function signIn(db: Db, loginIn: string, password: string, address: string): Promise<Step> {
  if (deviceLocked(address)) return { ok: false, error: 'locked' };
  const s = await byLogin(db, norm(loginIn));
  if (!s || !s.active) {
    await verify(await (dummy ??= hash(randomBytes(16).toString('hex'))), String(password ?? '')).catch(() => false);
    deviceFailed(address);
    return { ok: false, error: 'wrong' };
  }
  if (recent(s.failed_logins).length >= LOCKOUT.failures) return { ok: false, error: 'locked' };
  if (typeof password !== 'string' || !await verify(s.password_hash, password)) return failed(db, s, 'wrong-password', address);
  return { ok: true, next: nextStep(s), cookie: await startSession(db, s.id, 'password', address) };
}

// The new password: right after a temporary one (the password step), or the account's own change later (signed in,
// with the current one). Every other sign-in of the account ends.
export async function changePassword(db: Db, s: StaffSession, o: { current?: string; password: string }, address: string): Promise<Step> {
  if (s.stage === 'password' && !s.staff.must_change) return { ok: false, error: 'stage' };
  if (s.stage === 'full' && (typeof o.current !== 'string' || !await verify(s.staff.password_hash, o.current))) return failed(db, s.staff, 'wrong-password', address);
  const p = String(o.password ?? '');
  if (p.length < STAFF_MIN_PASSWORD) return { ok: false, error: 'short' };
  if (await verify(s.staff.password_hash, p)) return { ok: false, error: 'same' };
  await db.query('update staff set password_hash = $2, must_change = false, failed_logins = \'{}\', updated_at = now() where id = $1', [s.staff.id, await hash(p)]);
  await db.query('delete from staff_sessions where staff_id = $1 and id_hash <> $2', [s.staff.id, s.tokenHash]);
  await log(db, s.staff.login, s.staff.login, 'password', address);
  return { ok: true, next: s.stage === 'full' ? 'done' : nextStep({ must_change: false, totp_secret: s.staff.totp_secret }) };
}

// The authenticator app's set-up: the secret to scan (made once, kept until a first code matches).
export async function appSetUp(db: Db, s: StaffSession): Promise<{ secret: string; uri: string; qr: string } | null> {
  if (s.stage !== 'password' || nextStep(s.staff) !== 'app') return null;
  const { rows } = await db.query<{ totp_pending: string }>(
    'update staff set totp_pending = coalesce(totp_pending, $2) where id = $1 returning totp_pending', [s.staff.id, newSecret()]);
  const secret = rows[0].totp_pending;
  const uri = otpauthUri(secret, s.staff.login);
  return { secret, uri, qr: `data:image/svg+xml;base64,${Buffer.from(qrSvg(uri)).toString('base64')}` };
}

// A code: the first one of a set-up (it saves the secret), or the second step of signing in.
export async function checkCode(db: Db, s: StaffSession, code: string, address: string, now = Date.now()): Promise<Step> {
  const next = nextStep(s.staff);
  if (s.stage !== 'password' || next === 'password') return { ok: false, error: 'stage' };
  if (recent(s.staff.failed_logins).length >= LOCKOUT.failures) return { ok: false, error: 'locked' };
  const secret = next === 'app' ? s.staff.totp_pending : s.staff.totp_secret;
  const step = secret ? matchingStep(secret, code, now, next === 'app' ? 0 : Number(s.staff.totp_last_step)) : null;
  if (step === null) return failed(db, s.staff, 'wrong-code', address);
  // Taken in one statement: the same code sent twice at once passes once.
  const taken = next === 'app'
    ? await db.query(`update staff set totp_secret = totp_pending, totp_pending = null, totp_last_step = $3, updated_at = now()
        where id = $1 and totp_pending = $2 returning id`, [s.staff.id, secret, step])
    : await db.query('update staff set totp_last_step = $2 where id = $1 and totp_last_step < $2 returning id', [s.staff.id, step]);
  if (!taken.rowCount) return failed(db, s.staff, 'wrong-code', address);
  if (next === 'app') await log(db, s.staff.login, s.staff.login, 'app-set-up', address);
  return { ok: true, next: 'done', cookie: await promote(db, s, address) };
}
