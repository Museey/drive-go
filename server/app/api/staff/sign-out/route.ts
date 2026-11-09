import { json } from '@/lib/api';
import { staffApi } from '@/lib/staff-api';
import { getStaffSession, signOut, signedOutCookie } from '@/lib/staff';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return staffApi(req, 'none', async ({ db, address }) => {
    const s = await getStaffSession(req, db);
    if (s) await signOut(db, s, address);
    const res = json({ ok: true });
    res.headers.set('set-cookie', signedOutCookie());
    return res;
  });
}
