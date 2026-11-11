import { body, staffApi, stepResponse } from '@/lib/staff-api';
import { checkCode } from '@/lib/staff';

export const dynamic = 'force-dynamic';

// The code of the authenticator app: the second step of signing in, or the first code of setting the app up.
export async function POST(req: Request) {
  return staffApi(req, 'password-step', async ({ db, s, address }) => {
    const b = await body(req);
    if (b instanceof Response) return b;
    return stepResponse(await checkCode(db, s!, String(b.code ?? ''), address));
  });
}
