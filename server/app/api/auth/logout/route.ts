import { pool, withShop } from '@/lib/db';
import { getSession, sessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Ends this browser's session.
export async function POST(req: Request) {
  const s = await getSession(req);
  if (s) await withShop(pool(), s.shopId, s.scope, c => c.query('delete from sessions where shop_id = app_shop() and id_hash = $1', [s.tokenHash]));
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json', 'set-cookie': sessionCookie('', 0) } });
}
