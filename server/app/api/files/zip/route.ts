// Every attachment in one zip (answer 11.5, server/lib/files-zip.ts):
//   GET /api/files/zip?key=<STORE key>  -> garage-files-<day>.zip: the files of the key's branch (Biz, ProX: the shop)
// For the owner (franchise: HQ, the branch head), like the backup file; anyone else 403. Written as it is sent, each
// file read in its own short transaction, so 2 GB of files never sit in the server's memory nor hold a connection.
import { json } from '@/lib/api';
import { pool, withShop } from '@/lib/db';
import { fileStore } from '@/lib/files';
import { listFiles, zipEntries, zipFileName } from '@/lib/files-zip';
import { actorOf, rightsOf } from '@/lib/permissions';
import { getSession } from '@/lib/session';
import { branchOfKey, inScope } from '@/lib/storage';
import { zipChunks } from '@/lib/zip';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key') || '';
  const s = await getSession(req);
  if (!s) return json({ error: 'signed-out' }, 401);
  const r = await withShop(pool(), s.shopId, s.scope, async c => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return { error: 'another branch' } as const;
    if (!(await rightsOf(c, await actorOf(c, s))).owner) return { error: 'not allowed' } as const;
    return { branch, files: await listFiles(c, branch) };
  });
  if ('error' in r) return json({ error: r.error }, 403);

  const { entries, length } = zipEntries(r.files, f => withShop(pool(), s.shopId, s.scope, async c => {
    const bytes = await fileStore().get(c, r.branch, f.id);
    if (!bytes) throw new Error(`file ${f.id} of branch '${r.branch}' has no bytes`);
    return bytes;
  }));
  const chunks = zipChunks(entries);
  const body = new ReadableStream<Uint8Array>({
    async pull(ctrl) {
      const next = await chunks.next();
      if (next.done) ctrl.close();
      else ctrl.enqueue(new Uint8Array(next.value.buffer, next.value.byteOffset, next.value.length));
    },
    async cancel() { await chunks.return(undefined); },
  });
  return new Response(body, {
    headers: {
      'content-type': 'application/zip',
      'content-length': String(length),
      'content-disposition': `attachment; filename="${zipFileName()}"`,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
