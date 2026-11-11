import { json } from '@/lib/api';
import { staffApi } from '@/lib/staff-api';
import { getStaffSession, nextStep } from '@/lib/staff';

export const dynamic = 'force-dynamic';

// Who is signed in, or which step of signing in this browser is at.
export async function GET(req: Request) {
  return staffApi(req, 'none', async ({ db }) => {
    const s = await getStaffSession(req, db);
    if (!s) return json({ signedIn: false });
    return json({ signedIn: s.stage === 'full', next: s.stage === 'full' ? null : nextStep(s.staff), login: s.staff.login, name: s.staff.name });
  });
}
