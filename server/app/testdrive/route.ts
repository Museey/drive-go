import { sitePage } from '@/lib/site-page';

export const dynamic = 'force-dynamic';

// Test Drive: the team's tour of the system's screens, step by step (server/site/testdrive.html, owner 2026-11-18).
export async function GET() {
  return sitePage('testdrive.html');
}
