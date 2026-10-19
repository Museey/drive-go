import { readFile, stat } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { FRONTEND_DIR, SHOP_CODE } from '@/lib/config';
import { pool } from '@/lib/db';
import { shopByCode } from '@/lib/public';

// Serves the legacy screens (frontend/) under a shop's address:
// /DG-1688/ is frontend/index.html, /DG-1688/js/03.js is frontend/js/03.js.
// Same content types as the test server (tools/serve.mjs) so the page behaves
// exactly as it does there. The page picks its screens from ?package=, so the
// shop's own package is put there (task T10): a Biz shop cannot be opened as
// ProX or Franchise by editing the link.
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

const notFound = () => new Response('not found', { status: 404 });

export async function GET(req: Request, ctx: { params: Promise<{ shop: string; path?: string[] }> }) {
  const { shop, path = [] } = await ctx.params;
  if (!SHOP_CODE.test(shop) || shop === 'api') return notFound();
  const url = new URL(req.url);
  if (!path.length && !url.pathname.endsWith('/')) {
    return new Response(null, { status: 308, headers: { location: `${url.pathname}/${url.search}` } });
  }
  if (!path.length) {
    const found = await shopByCode(pool(), shop);
    if (!found) return notFound();
    if (url.searchParams.get('package') !== found.package) {
      url.searchParams.set('package', found.package);
      return new Response(null, { status: 302, headers: { location: `${url.pathname}${url.search}`, 'cache-control': 'no-store' } });
    }
  }
  const file = join(FRONTEND_DIR, ...(path.length ? path : ['index.html']));
  const rel = relative(FRONTEND_DIR, file);
  if (rel.startsWith('..') || rel.split(sep).some(p => p.startsWith('.'))) return notFound();
  const type = TYPES[extname(file)];
  if (!type) return notFound();
  try {
    const info = await stat(file);
    if (!info.isFile()) return notFound();
    const etag = `"${info.size.toString(36)}-${Math.floor(info.mtimeMs).toString(36)}"`;
    if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: { etag } });
    return new Response(new Uint8Array(await readFile(file)), {
      headers: { 'content-type': type, 'cache-control': 'no-cache', etag },
    });
  } catch {
    return notFound();
  }
}
