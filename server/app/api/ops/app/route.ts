import { json } from '@/lib/api';
import { staffApi } from '@/lib/staff-api';
import { appSetUp } from '@/lib/staff';

export const dynamic = 'force-dynamic';

// Setting up the authenticator app (the first sign-in, or after a new temporary password): the QR code to scan
// and the same secret as text, for a phone that cannot scan.
export async function GET(req: Request) {
  return staffApi(req, 'password-step', async ({ db, s }) => {
    const r = await appSetUp(db, s!);
    return r ? json(r) : json({ error: 'stage' }, 409);
  });
}
