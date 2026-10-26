// Attachments (task 3.11, decision R19-ค):
//   POST /api/files?key=<STORE key>&use=<evidence|picture|knowledge|other>&name=<file name>
//        body = the file, content-type = its type. Kept for the key's branch;
//        -> {id, url, used, quota}, or 413 {error: 'too-large' | 'quota', limit}
//   GET  /api/files?key=<STORE key>  -> {used, quota}: the space the key's branch uses (menu 10)
// window.storage uploads every file the app put into its data before saving
// (server/client/files.ts); the data keeps the url.
import { inShop, json } from '@/lib/api';
import { limitOf } from '@/lib/attachments';
import { readBody, storeFile, usage } from '@/lib/files';
import { getSession } from '@/lib/session';
import { branchOfKey, inScope } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const USES = ['evidence', 'picture', 'knowledge', 'other'] as const;

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key') || '';
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return json({ error: 'another branch' }, 403);
    return json(await usage(c, branch));
  });
}

export async function POST(req: Request) {
  const q = new URL(req.url).searchParams;
  const key = q.get('key') || '', use = USES.find(u => u === q.get('use')) ?? 'other', name = q.get('name') || '';
  const mime = (req.headers.get('content-type') || '').split(';')[0].trim();
  if (!await getSession(req)) return json({ error: 'signed-out' }, 401);
  const bytes = await readBody(req, limitOf(mime));
  if (!bytes) return json({ error: 'too-large', limit: limitOf(mime) }, 413);
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return json({ error: 'another branch' }, 403);
    const r = await storeFile(c, branch, { bytes, mime, name, use, userId: s.userId });
    return r.ok ? json({ id: r.id, url: r.url, used: r.used, quota: r.quota }) : json({ error: r.error, limit: r.limit }, 413);
  });
}
