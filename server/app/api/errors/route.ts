// Errors a page did not catch (server/client/errors.ts), from any page of the app, signed in or not (the sign-in page
// too): recorded with the session's shop and person when there is one (server/lib/errors.ts). Never more than a few
// a minute per session or address; the answer never says anything about the shop.
import { json } from '@/lib/api';
import { pool } from '@/lib/db';
import { allowReport, recordError } from '@/lib/errors';
import { readBody } from '@/lib/files';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const raw = await readBody(req, 16 * 1024);
  if (!raw) return json({ error: 'too-large' }, 413);
  let body: { message?: unknown; detail?: unknown; path?: unknown };
  try { body = JSON.parse(raw.toString('utf8')); } catch { return json({ error: 'not json' }, 400); }
  if (typeof body?.message !== 'string' || !body.message) return json({ error: 'no message' }, 400);
  try {
    const s = await getSession(req);
    const address = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
    if (!allowReport(s ? `s:${s.shopId}:${s.userId}` : `a:${address}`)) return new Response(null, { status: 429 });
    const text = (v: unknown) => typeof v === 'string' ? v : '';
    await recordError(pool(), { source: 'browser', shopId: s?.shopId, userId: s?.userId, path: text(body.path), message: body.message,
      detail: text(body.detail), agent: req.headers.get('user-agent') ?? '' });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
