import { json } from '@/lib/api';
import { staffApi } from '@/lib/staff-api';
import { listSignups } from '@/lib/signup';

export const dynamic = 'force-dynamic';

// The sign-ups from the website (server/lib/signup.ts): new ones first, and whether e-mail is set up.
export async function GET(req: Request) {
  return staffApi(req, 'signed-in', async ({ db }) => json(await listSignups(db)));
}
