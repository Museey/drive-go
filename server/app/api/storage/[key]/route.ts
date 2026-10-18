// The legacy STORE, one key at a time (docs/PHASE2-DESIGN.md §4):
//   GET     main data key: "<versions JSON>\n<stored JSON>"; backup point or other key: the stored text
//   POST    main data key: one save, {base, changes, session} -> {versions} or 409 {conflicts}
//   PUT     backup point (made from the server's own data, body ignored) or other key (body = value)
//   DELETE  any key
import { inShop, json } from '@/lib/api';
import { saveSessionFields, sessionFields } from '@/lib/session';
import { branchOfKey, isBackupKey, makeBackup, readBackup, readBlob, readMain, removeKey, writeBlob, writeMain } from '@/lib/storage';
import { type Changes, rootOf } from '@/lib/units';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ key: string }> };
const text = (body: string) => new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
const missing = () => new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });

export async function GET(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (rootOf(key)) {
      const main = await readMain(c, branch, key, sessionFields(s, key));
      return main ? text(JSON.stringify(main.versions) + '\n' + main.json) : missing();
    }
    const value = isBackupKey(key) ? await readBackup(c, branch, key) : await readBlob(c, branch, key);
    return value === null ? missing() : text(value);
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!rootOf(key)) return json({ error: 'not a main data key' }, 400);
  const body = await req.json() as { base: Record<string, number>; changes: Changes; session?: Record<string, string> };
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    const r = await writeMain(c, branch, key, body.base || {}, body.changes, s.userId);
    if (!r.ok) return json({ conflicts: r.conflicts }, 409);
    if (body.session) await saveSessionFields(c, s, key, body.session);
    return json({ versions: r.versions });
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (rootOf(key)) return json({ error: 'main data keys are saved with POST' }, 400);
  const value = await req.text();
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (isBackupKey(key)) {
      const main = key.slice(0, key.indexOf('.bak.'));
      return (await makeBackup(c, branch, key, sessionFields(s, main))) ? json({ ok: true }) : missing();
    }
    await writeBlob(c, branch, key, value);
    return json({ ok: true });
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  return inShop(req, async c => {
    await removeKey(c, await branchOfKey(c, key), key);
    return json({ ok: true });
  });
}
