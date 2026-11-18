import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_DIR } from '@/lib/config';

// One of DriveGo's own pages (server/site/<file>), for app/<page>/route.ts: the page's security headers come from
// next.config.ts (SITE_CSP).
export async function sitePage(file: string): Promise<Response> {
  const body = await readFile(join(/*turbopackIgnore: true*/ SITE_DIR, file));
  return new Response(new Uint8Array(body), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}
