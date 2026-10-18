// Helpers for the API routes: every route that touches a shop's data goes
// through inShop(), which finds the session and opens the shop's transaction.
import type pg from 'pg';
import { pool, withShop } from './db.ts';
import { type Session, getSession } from './session.ts';

export const json = (body: unknown, status = 200) => Response.json(body, { status });

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
    throw e;
  }
}
