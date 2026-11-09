import { json } from '@/lib/api';
import { body, staffApi, stepResponse } from '@/lib/staff-api';
import { signIn } from '@/lib/staff';

export const dynamic = 'force-dynamic';

// The staff page's first step: user name and password (lib/staff.ts).
export async function POST(req: Request) {
  return staffApi(req, 'none', async ({ db, address }) => {
    const b = await body(req);
    if (b instanceof Response) return b;
    if (typeof b.login !== 'string' || typeof b.password !== 'string') return json({ error: 'wrong' }, 400);
    return stepResponse(await signIn(db, b.login, b.password, address));
  });
}
