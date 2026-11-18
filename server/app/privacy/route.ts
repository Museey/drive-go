import { sitePage } from '@/lib/site-page';

export const dynamic = 'force-dynamic';

// The privacy policy in full (server/site/privacy.html, the team's text, owner 2026-11-18).
export async function GET() {
  return sitePage('privacy.html');
}
