import { json } from '@/lib/api';
import { body, staffApi, stepResponse } from '@/lib/staff-api';
import { changePassword, getStaffSession } from '@/lib/staff';

export const dynamic = 'force-dynamic';

// A new password: right after a temporary one (the password step), or the account's own change (signed in, with
// the current password).
export async function POST(req: Request) {
  return staffApi(req, 'none', async ({ db, address }) => {
    const s = await getStaffSession(req, db);
    if (!s) return json({ error: 'signed-out' }, 401);
    const b = await body(req);
    if (b instanceof Response) return b;
    if (typeof b.password !== 'string') return json({ error: 'short' }, 400);
    return stepResponse(await changePassword(db, s, { current: typeof b.current === 'string' ? b.current : undefined, password: b.password }, address));
  });
}
