import { sitePage } from '@/lib/site-page';

export const dynamic = 'force-dynamic';

// Articles for garages (server/site/articles.html, the team's texts, owner 2026-11-18).
export async function GET() {
  return sitePage('articles.html');
}
