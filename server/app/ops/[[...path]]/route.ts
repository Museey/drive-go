import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { STAFF_UI_DIR } from '@/lib/config';
import { staffPageOn } from '@/lib/staff';

export const dynamic = 'force-dynamic';

// The staff web page (server/staff-ui): /ops/ is index.html, /ops/staff.js and /ops/staff.css its script and style,
// nothing else; nothing at all while the page is off (no STAFF_DATABASE_URL). Its Content-Security-Policy (only its own script and style, never framed) is in next.config.ts:
// the headers there win over a route's own.
const FILES: Record<string, string> = {
  '': 'text/html; charset=utf-8',
  'staff.js': 'text/javascript; charset=utf-8',
  'staff.css': 'text/css; charset=utf-8',
};

export async function GET(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  if (!staffPageOn()) return new Response('not found', { status: 404 });
  const { path = [] } = await ctx.params;
  const url = new URL(req.url);
  if (!path.length && !url.pathname.endsWith('/')) return new Response(null, { status: 308, headers: { location: '/ops/' } });
  const name = path.join('/');
  if (path.length > 1 || !(name in FILES)) return new Response('not found', { status: 404 });
  // (not traced into the build: the files are read where server/ is, STAFF_UI_DIR)
  const body = await readFile(join(/*turbopackIgnore: true*/ STAFF_UI_DIR, name || 'index.html'));
  return new Response(new Uint8Array(body), { headers: { 'content-type': FILES[name], 'cache-control': 'no-cache' } });
}
