// One attachment (task 3.11): GET /api/files/<id>, for the session's shop and
// branch scope only (Row-Level Security; HQ reaches every branch). Ranges
// (206) for video players. Files are the users' own, served from our origin:
// never sniffed, scripts never run (CSP sandbox), and anything but a picture,
// a video or a PDF is downloaded rather than opened.
import { inShop } from '@/lib/api';
import { fileStore, findFile } from '@/lib/files';

export const dynamic = 'force-dynamic';

const INLINE = /^(image\/(png|jpeg|gif|webp|bmp)|video\/[\w.+-]+|audio\/[\w.+-]+|application\/pdf)$/;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return inShop(req, async c => {
    const f = await findFile(c, id);
    if (!f) return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
    const inline = INLINE.test(f.mime);
    const headers: Record<string, string> = {
      'content-type': inline ? f.mime : 'application/octet-stream',
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, no-cache',
      etag: `"${id}"`,
      'accept-ranges': 'bytes',
      'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name || id)}`,
    };
    // Chrome's PDF viewer does not open in a sandboxed document.
    if (f.mime !== 'application/pdf') headers['content-security-policy'] = "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'";
    if (req.headers.get('if-none-match') === `"${id}"`) return new Response(null, { status: 304, headers });
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
    if (range && (range[1] || range[2])) {
      let start = range[1] ? Number(range[1]) : Math.max(0, f.size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), f.size - 1) : f.size - 1;
      if (start >= f.size || start > end) return new Response(null, { status: 416, headers: { ...headers, 'content-range': `bytes */${f.size}` } });
      start = Math.max(0, start);
      const part = await fileStore().get(c, f.branch, id, [start, end - start + 1]);
      if (!part) return new Response(null, { status: 404 });
      return new Response(new Uint8Array(part), { status: 206, headers: { ...headers, 'content-range': `bytes ${start}-${end}/${f.size}`, 'content-length': String(part.length) } });
    }
    const bytes = await fileStore().get(c, f.branch, id);
    if (!bytes) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(bytes), { headers: { ...headers, 'content-length': String(bytes.length) } });
  });
}
