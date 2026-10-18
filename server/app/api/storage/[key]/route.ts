// The legacy STORE, one key at a time (docs/PHASE2-DESIGN.md §4):
//   GET     main data key: "<versions JSON>\n<stored JSON>"; backup point or other key: the stored text
//   POST    main data key: one save, {base, changes, session, secrets} -> {versions} or 409 {conflicts}
//   PUT     backup point (made from the server's own data, body ignored) or other key (body = value)
//   DELETE  any key
// A key of a branch outside the session's scope (another branch, or HQ's own
// data for a branch account) answers 403 to every method.
import { inShop, json } from '@/lib/api';
import { endStaleSessions, storeSecrets } from '@/lib/auth';
import { saveSessionFields, sessionFields } from '@/lib/session';
import { branchOfKey, inScope, isBackupKey, makeBackup, readBackup, readBlob, readMain, removeKey, writeBlob, writeMain } from '@/lib/storage';
import { type Changes, rootOf } from '@/lib/units';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ key: string }> };
const text = (body: string) => new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
const missing = () => new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
// Another branch's data (or HQ's) for a branch account: refused, not empty.
const forbidden = () => json({ error: 'another branch' }, 403);

export async function GET(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return forbidden();
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
  const body = await req.json() as { base: Record<string, number>; changes: Changes; session?: Record<string, string>;
    secrets?: { unit: string; key: string; field: string; value: string }[] };
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return forbidden();
    const r = await writeMain(c, branch, key, body.base || {}, body.changes, s.userId);
    if (!r.ok) return json({ conflicts: r.conflicts }, 409);
    if (body.session) await saveSessionFields(c, s, key, body.session);
    // New passwords become hashes; a save that touches accounts may end other
    // people's sessions (decision Q2).
    const changedPasswords = await storeSecrets(c, branch, (body.secrets || []).filter(x => x.unit.startsWith(key === 'dgb.v22' ? 'DGB.' : key === 'franchise.v22' ? 'FR.' : 'DB.')));
    const accountUnits = ['DB.emp', 'FR.accounts', 'FR.branches', 'DGB.shop'];
    const touched = [...body.changes.upsert, ...body.changes.remove].some(x => accountUnits.includes(x.unit));
    if (touched || changedPasswords.length) {
      const pkg = (await c.query<{ package: string }>('select package from shops where id = app_shop()')).rows[0].package;
      await endStaleSessions(c, pkg, s.tokenHash, changedPasswords);
    }
    return json({ versions: r.versions });
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (rootOf(key)) return json({ error: 'main data keys are saved with POST' }, 400);
  const value = await req.text();
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return forbidden();
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
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return forbidden();
    await removeKey(c, branch, key);
    return json({ ok: true });
  });
}
