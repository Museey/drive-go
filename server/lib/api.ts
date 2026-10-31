// Helpers for the API routes: every route that touches a shop's data goes
// through inShop(), which finds the session and opens the shop's transaction.
import type pg from 'pg';
import { pool, withShop } from './db.ts';
import { readBody } from './files.ts';
import { type Session, getSession } from './session.ts';

export const json = (body: unknown, status = 200) => Response.json(body, { status });

// A request's JSON body of at most `limit` bytes: too large → 413, not JSON → 400 — never the 500 of an exception,
// which the error alert would count (security review 2026-10-31). The caller checks `instanceof Response`.
export async function readJson<T>(req: Request, limit: number): Promise<T | Response> {
  const raw = await readBody(req, limit);
  if (!raw) return json({ error: 'too-large' }, 413);
  try { return (JSON.parse(raw.toString('utf8')) ?? {}) as T; } catch { return json({ error: 'not json' }, 400); }
}

export async function inShop(req: Request, fn: (c: pg.ClientBase, s: Session) => Promise<Response>): Promise<Response> {
  const s = await getSession(req);
  if (!s) return json({ error: 'signed-out' }, 401);
  try {
    return await withShop(pool(), s.shopId, s.scope, c => fn(c, s));
  } catch (e) {
    // A duplicate document number (decision P2) or record key: someone else
    // saved first. Reported like any other conflict (decision P1).
    if ((e as { code?: string }).code === '23505') return json({ conflicts: [`unique:${(e as { constraint?: string }).constraint}`] }, 409);
    if ((e as { status?: number }).status === 400) return json({ error: (e as Error).message }, 400);
    // Row-Level Security refused a write (e.g. another branch's data): not this session's to change.
    if ((e as { code?: string }).code === '42501') return json({ error: 'forbidden' }, 403);
    throw e;
  }
}
