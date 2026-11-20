import { json } from '@/lib/api';
import { body, staffApi } from '@/lib/staff-api';
import { actorOf } from '@/lib/staff';
import { approveSignup, rejectSignup } from '@/lib/signup';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// approve (opens the shop with the fields of "เปิดร้านใหม่" and e-mails the sign-in) | reject (with a note).
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return staffApi(req, 'signed-in', async ({ db, s }) => {
    const b = await body(req);
    if (b instanceof Response) return b;
    const n = Number(id);
    if (!Number.isSafeInteger(n) || n < 1) return json({ error: 'no such request' }, 400);
    if (b.action === 'approve') return json(await approveSignup(db, n, b, actorOf(s!)));
    if (b.action === 'reject') return json(await rejectSignup(db, n, String(b.note ?? ''), actorOf(s!)));
    return json({ error: 'action: approve or reject' }, 400);
  });
}
