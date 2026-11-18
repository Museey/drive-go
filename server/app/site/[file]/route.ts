import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_DIR } from '@/lib/config';

export const dynamic = 'force-dynamic';

// The files of DriveGo's own pages (server/site): these and nothing else.
const FILES: Record<string, string> = {
  'site.css': 'text/css; charset=utf-8',
  'login.js': 'text/javascript; charset=utf-8',
  'landing.css': 'text/css; charset=utf-8',
  'landing.js': 'text/javascript; charset=utf-8',
  'logo.jpg': 'image/jpeg',
  // The sub-pages (Test Drive, privacy, articles: tools/subpages-from-design.py); their pictures: site/tour/[file].
  'sub.css': 'text/css; charset=utf-8',
  'sub.js': 'text/javascript; charset=utf-8',
  'testdrive.css': 'text/css; charset=utf-8',
  'testdrive.js': 'text/javascript; charset=utf-8',
  'privacy.css': 'text/css; charset=utf-8',
  'privacy.js': 'text/javascript; charset=utf-8',
  'articles.css': 'text/css; charset=utf-8',
  'articles.js': 'text/javascript; charset=utf-8',
};

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!(file in FILES)) return new Response('not found', { status: 404 });
  const body = await readFile(join(/*turbopackIgnore: true*/ SITE_DIR, file));
  return new Response(new Uint8Array(body), { headers: { 'content-type': FILES[file], 'cache-control': 'no-cache' } });
}
