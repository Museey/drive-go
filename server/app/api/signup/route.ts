// The sign-up form of the landing page (server/site/index.html #contact, the owner's request of 2026-11-20): a garage
// asks for a trial shop; the request waits for staff on the staff web page (server/lib/signup.ts). Anyone may send,
// SIGNUP_LIMIT an hour from one address; the answer says nothing but kept or what to fix.
import { clientAddress, json, readJson } from '@/lib/api';
import { pool } from '@/lib/db';
import { addSignup, allowSignup } from '@/lib/signup';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const b = await readJson<Record<string, unknown>>(req, 16 * 1024);
  if (b instanceof Response) return b;
  if (!allowSignup(clientAddress(req))) return json({ error: 'too-many' }, 429);
  try {
    await addSignup(pool(), b, { address: clientAddress(req), agent: req.headers.get('user-agent') ?? '' });
    return json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 400) return json({ error: err.message }, 400);
    throw e;
  }
}
