// Rows of a main data key that another device just saved (task 3.10, server/lib/live.ts): the browser heard which
// rows changed and asks for those it does not have yet.
//   POST { rows: [[unit, key], …], ordered: [unit, …] }
//     -> { rows: [{ unit, key, data, version }], gone: [[unit, key]], order: { unit: [key, …] } }
// With what the person may not see left out (task 3.9), like GET /api/storage/<key>.
import { inShop, json } from '@/lib/api';
import { actorOf, rightsOf } from '@/lib/permissions';
import { branchOfKey, inScope, readRows } from '@/lib/storage';
import { rootOf } from '@/lib/units';
import { masksFor } from '@/lib/visibility';

export const dynamic = 'force-dynamic';

const MAX_ROWS = 5000;   // more than this: the browser reads the whole key instead

type Ctx = { params: Promise<{ key: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!rootOf(key)) return json({ error: 'not a main data key' }, 400);
  const body = await req.json().catch(() => null) as { rows?: unknown; ordered?: unknown } | null;
  const rows = Array.isArray(body?.rows) ? body!.rows.filter((r): r is [string, string] =>
    Array.isArray(r) && r.length === 2 && typeof r[0] === 'string' && typeof r[1] === 'string') : null;
  const ordered = Array.isArray(body?.ordered) ? body!.ordered.filter((u): u is string => typeof u === 'string') : [];
  if (!rows || rows.length > MAX_ROWS) return json({ error: 'bad request' }, 400);
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return json({ error: 'another branch' }, 403);
    const masks = masksFor(await rightsOf(c, await actorOf(c, s)));
    return Response.json(await readRows(c, branch, key, rows, ordered, masks), { headers: { 'cache-control': 'no-store' } });
  });
}
