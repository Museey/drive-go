import { json } from '@/lib/api';
import { body, staffApi } from '@/lib/staff-api';
import { actorOf } from '@/lib/staff';
import { openShop, shopsOverview } from '@/lib/staff-shops';

export const dynamic = 'force-dynamic';

// Every shop with its licence (tools/shop-admin.mjs list).
export async function GET(req: Request) {
  return staffApi(req, 'signed-in', async ({ db }) => json(await shopsOverview(db)));
}

// Opens a real shop (tools/shop-admin.mjs new): the owner's user name and temporary password come back once.
export async function POST(req: Request) {
  return staffApi(req, 'signed-in', async ({ db, s }) => {
    const b = await body(req);
    if (b instanceof Response) return b;
    return json(await openShop(db, b, actorOf(s!)));
  });
}
