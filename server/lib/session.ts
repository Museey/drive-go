// Signed-in browsers (design §5). The cookie holds a random token; the
// database keeps only its SHA-256, and session_lookup() finds the shop from it
// before any shop setting exists. Everything a request may reach (shop,
// branch scope) comes from here, never from the request itself (rule 8).
import { createHash, randomBytes } from 'node:crypto';
import type pg from 'pg';
import { pool } from './db.ts';

export const COOKIE = 'dg_session';
export const SESSION_DAYS = 30;   // decision Q2

export interface Session { tokenHash: Buffer; shopId: string; userId: string; scope: string; state: Record<string, string> }

export const hashToken = (token: string) => createHash('sha256').update(token).digest();

function cookieToken(req: Request): string | null {
  const header = req.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function getSession(req: Request, db: pg.Pool = pool()): Promise<Session | null> {
  const token = cookieToken(req);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const tokenHash = hashToken(token);
  const { rows } = await db.query<{ shop_id: string; user_id: string; branch_scope: string; state: Record<string, string> }>(
    'select shop_id, user_id, branch_scope, state from session_lookup($1)', [tokenHash]);
  if (!rows.length) return null;
  return { tokenHash, shopId: rows[0].shop_id, userId: rows[0].user_id, scope: rows[0].branch_scope, state: rows[0].state || {} };
}

// Starts a session; the caller sets the returned cookie. Runs inside withShop.
export async function startSession(c: pg.ClientBase, userId: string, scope: string): Promise<{ token: string; cookie: string }> {
  const token = randomBytes(32).toString('base64url');
  await c.query(
    `insert into sessions (id_hash, shop_id, user_id, branch_scope, expires_at)
     values ($1, app_shop(), $2, $3, now() + make_interval(days => $4))`, [hashToken(token), userId, scope, SESSION_DAYS]);
  return { token, cookie: sessionCookie(token, SESSION_DAYS * 86400) };
}

export function sessionCookie(token: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

// Fields the legacy app keeps per signed-in person (DB.curEmp, DGB.session,
// FR.session), per STORE key: state["<storeKey>|<unit>"] = JSON text.
export function sessionFields(s: Session, storeKey: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.state)) if (k.startsWith(storeKey + '|')) out[k.slice(storeKey.length + 1)] = v;
  return out;
}

// Where a person starts working when they sign in (task 3.10, answer 10.7): an employee in their home branch of the
// data set (emp.branchHome, else the first branch they may use, as 37.js empHome), everyone else in the main one
// (DB.curBranch's default). Runs inside withShop, right after startSession.
export async function startInHomeBranch(c: pg.ClientBase, token: string, storeKey: string, branch: string, empId: string): Promise<void> {
  const { rows } = await c.query<{ data: { branchHome?: unknown; branches?: unknown } }>(
    "select data from records where shop_id = app_shop() and branch_id = $1 and unit = 'DB.emp' and key = $2", [branch, empId]);
  const e = rows[0]?.data;
  const home = e && (e.branchHome || (Array.isArray(e.branches) && e.branches[0]));
  if (typeof home !== 'string' || !home || home === 'main') return;
  await c.query('update sessions set state = $2 where shop_id = app_shop() and id_hash = $1',
    [hashToken(token), JSON.stringify({ [`${storeKey}|DB.curBranch`]: JSON.stringify(home) })]);
}

export async function saveSessionFields(c: pg.ClientBase, s: Session, storeKey: string, fields: Record<string, string>): Promise<void> {
  const changed = Object.entries(fields).filter(([unit, v]) => s.state[`${storeKey}|${unit}`] !== v);
  if (!changed.length) return;
  for (const [unit, v] of changed) s.state[`${storeKey}|${unit}`] = v;
  await c.query('update sessions set state = $2, last_seen_at = now() where shop_id = app_shop() and id_hash = $1', [s.tokenHash, JSON.stringify(s.state)]);
}
