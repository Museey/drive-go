import { json } from '@/lib/api';
import { body, staffApi } from '@/lib/staff-api';
import { actorOf } from '@/lib/staff';
import { shopAction, shopDetail } from '@/lib/staff-shops';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ code: string }> };

// One shop, its licence and log (tools/shop-admin.mjs show).
export async function GET(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  return staffApi(req, 'signed-in', async ({ db }) => json(await shopDetail(db, code)));
}

// password | open | renew | postpone | close | contact | told, as the commands of tools/shop-admin.mjs.
export async function POST(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  return staffApi(req, 'signed-in', async ({ db, s }) => {
    const b = await body(req);
    if (b instanceof Response) return b;
    return json(await shopAction(db, code, b, actorOf(s!)));
  });
}
