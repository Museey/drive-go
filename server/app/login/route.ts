import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_DIR } from '@/lib/config';

export const dynamic = 'force-dynamic';

// The central sign-in page (server/site/login.html, the owner's decision of 2026-11-17): shop code, user and password on
// one page, then the shop's own page (site/login.js, frontend/js/78-central-login.js). A shop's own address still works.
export async function GET() {
  const body = await readFile(join(/*turbopackIgnore: true*/ SITE_DIR, 'login.html'));
  return new Response(new Uint8Array(body), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}
