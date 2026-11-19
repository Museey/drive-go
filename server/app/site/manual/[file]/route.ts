import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_DIR } from '@/lib/config';

export const dynamic = 'force-dynamic';

// The user manuals offered on the sign-in page (server/site/manual/*.pdf, built by tools/manual/build.mjs; the owner's
// decision of 2026-11-19): these three and nothing else, as downloads.
const FILES: Record<string, string> = {
  'drivego-bazix-manual.pdf': 'คู่มือการใช้งาน DriveGo BaziX.pdf',
  'drivego-prox-manual.pdf': 'คู่มือการใช้งาน DriveGo ProX.pdf',
  'drivego-franchise-manual.pdf': 'คู่มือการใช้งาน DriveGo-Franchise.pdf',
};

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!(file in FILES)) return new Response('not found', { status: 404 });
  const body = await readFile(join(/*turbopackIgnore: true*/ SITE_DIR, 'manual', file));
  return new Response(new Uint8Array(body), { headers: { 'content-type': 'application/pdf', 'cache-control': 'no-cache',
    'content-disposition': `attachment; filename="${file}"; filename*=UTF-8''${encodeURIComponent(FILES[file])}` } });
}
