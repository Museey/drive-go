import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_DIR } from '@/lib/config';

export const dynamic = 'force-dynamic';

// DriveGo's landing page (server/site/index.html, the owner's request of 2026-11-17): what DriveGo is, a sign-in button
// to the central sign-in page (/login) and LINE. Its Content-Security-Policy is in next.config.ts.
export async function GET() {
  // (not traced into the build: read where server/ is, SITE_DIR)
  const body = await readFile(join(/*turbopackIgnore: true*/ SITE_DIR, 'index.html'));
  return new Response(new Uint8Array(body), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}
