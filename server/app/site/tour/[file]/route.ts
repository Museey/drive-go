import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_DIR } from '@/lib/config';

export const dynamic = 'force-dynamic';

// The Test Drive page's pictures (server/site/tour/*.webp): a name of small letters and hyphens, nothing else.
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!/^[a-z]+(-[a-z]+)*\.webp$/.test(file)) return new Response('not found', { status: 404 });
  let body: Buffer;
  try { body = await readFile(join(/*turbopackIgnore: true*/ SITE_DIR, 'tour', file)); }
  catch { return new Response('not found', { status: 404 }); }
  return new Response(new Uint8Array(body), { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=86400' } });
}
