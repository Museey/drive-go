import { pool, withShop } from '@/lib/db';
import { publicValue, shopByCode } from '@/lib/public';
import { SHOP_CODE } from '@/lib/config';

export const dynamic = 'force-dynamic';

// The sign-in screen's data before signing in (lib/public.ts).
export async function GET(_req: Request, ctx: { params: Promise<{ code: string; key: string }> }) {
  const { code, key } = await ctx.params;
  const none = () => new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  if (!SHOP_CODE.test(code)) return none();
  const shop = await shopByCode(pool(), code);
  if (!shop || shop.status !== 'active') return none();
  const value = await withShop(pool(), shop.id, '*', c => publicValue(c, key));
  return value === null ? none() : new Response(value, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}
