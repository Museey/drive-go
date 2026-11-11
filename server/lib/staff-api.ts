// Helpers of the staff web page's API (app/api/ops): nothing at all while the page is off (no STAFF_DATABASE_URL),
// only a page of the same address may send, nothing is kept by the browser's cache, and a mistake in what staff typed
// comes back as 400 with the tools' own message (the page shows it in Thai where it knows it).
import type pg from 'pg';
import { clientAddress, json, readJson } from './api.ts';
import { type StaffSession, getStaffSession, staffPageOn, staffPool } from './staff.ts';

export type Need = 'signed-in' | 'password-step' | 'none';

function sameOrigin(req: Request): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const origin = req.headers.get('origin');
  if (!origin) return false;
  let host: string;
  try { host = new URL(origin).host; } catch { return false; }
  return host === req.headers.get('host') || host === req.headers.get('x-forwarded-host');
}

const noStore = (r: Response) => { r.headers.set('cache-control', 'no-store'); return r; };

export async function staffApi(req: Request, need: Need,
  fn: (o: { db: pg.Pool; s: StaffSession | null; address: string }) => Promise<Response>): Promise<Response> {
  if (!staffPageOn()) return new Response('not found', { status: 404 });
  if (!sameOrigin(req)) return noStore(json({ error: 'origin' }, 403));
  const db = staffPool();
  const s = need === 'none' ? null : await getStaffSession(req, db);
  if (need === 'signed-in' && s?.stage !== 'full') return noStore(json({ error: 'signed-out' }, 401));
  if (need === 'password-step' && s?.stage !== 'password') return noStore(json({ error: 'signed-out' }, 401));
  try {
    return noStore(await fn({ db, s, address: clientAddress(req) }));
  } catch (e) {
    const err = e as Error & { status?: number; code?: string };
    // The tools' checks (plain errors) and the database refusing a duplicate (a shop code taken in between).
    if (err.status === 400 || (err?.constructor === Error && !err.code)) return noStore(json({ error: err.message }, 400));
    if (err.code === '23505') return noStore(json({ error: `exists already (${(err as { constraint?: string }).constraint})` }, 400));
    throw e;
  }
}

export const body = (req: Request) => readJson<Record<string, unknown>>(req, 64 * 1024);

// A step of signing in: the next step, and the tab's new token when it gives one.
export function stepResponse(r: { ok: boolean; next?: string; token?: string; error?: string }): Response {
  if (!r.ok) return json({ error: r.error }, r.error === 'stage' ? 409 : 400);
  return json(r.token ? { next: r.next, token: r.token } : { next: r.next });
}
