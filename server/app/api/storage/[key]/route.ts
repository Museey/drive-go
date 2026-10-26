// The legacy STORE, one key at a time (docs/PHASE2-DESIGN.md §4):
//   GET     main data key: "<versions JSON>\n<stored JSON>"; backup point or other key: the stored text
//   POST    main data key: one save, {base, changes, session, secrets, numbers} -> {versions, renumbered, counters} or 409 {conflicts}
//           (numbers: the document numbers the save issued; renumbered, counters: what the server changed, task 3.2)
//   PUT     backup point (made from the server's own data, body ignored) or other key (body = value)
//   DELETE  any key
// A key of a branch outside the session's scope (another branch, or HQ's own
// data for a branch account) answers 403 to every method; so does a save or a
// removal the account may not make (lib/permissions.ts, task T10), and any
// change but viewing while the shop's licence has run out (lib/licence.ts, task 3.15).
import { inShop, json } from '@/lib/api';
import { endStaleSessions, storeSecrets } from '@/lib/auth';
import type { Claims } from '@/lib/numbers';
import { actorOf, refuseRemoveKey, refuseSave, rightsOf, traceWrite } from '@/lib/permissions';
import { saveSessionFields, sessionFields } from '@/lib/session';
import { branchOfKey, inScope, isBackupKey, isDataCopyKey, isSafetyBackupKey, makeBackup, readBackup, readBlob, readMain, removeKey, restoreHidden, saveMain, writeBlob } from '@/lib/storage';
import { type Changes, rootOf } from '@/lib/units';
import { masksFor } from '@/lib/visibility';
import { fillCosts } from '@/lib/costing';
import { refuseRules } from '@/lib/rules';
import { MAX_SAVE_BYTES, inlineFile, readBody } from '@/lib/files';
import { licenceOf, pinData, refuseExpiredKey, refuseExpiredSave } from '@/lib/licence';
import { liveCursor } from '@/lib/live';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ key: string }> };
const text = (body: string, more: Record<string, string> = {}) =>
  new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', ...more } });
const missing = () => new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
// Another branch's data (or HQ's) for a branch account: refused, not empty.
const forbidden = () => json({ error: 'another branch' }, 403);

export async function GET(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return forbidden();
    // What this person may see (task 3.9): the masks go with the data, so the browser can compare its copy.
    const rights = await rightsOf(c, await actorOf(c, s));
    if (rootOf(key)) {
      const masks = masksFor(rights);
      // Where the browser starts hearing other devices' saves (task 3.10): taken first, so none made while it reads is missed.
      const cursor = await liveCursor(c);
      const main = await readMain(c, branch, key, sessionFields(s, key), masks);
      if (!main) return missing();
      return text(JSON.stringify(main.versions) + '\n' + main.json,
        { 'x-drivego-masks': encodeURIComponent(JSON.stringify(masks)), 'x-drivego-live': String(cursor) });
    }
    if (isDataCopyKey(key) && !rights.owner) return json({ error: 'not allowed', what: key }, 403);
    const value = isBackupKey(key) ? await readBackup(c, branch, key) : await readBlob(c, branch, key);
    return value === null ? missing() : text(value);
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!rootOf(key)) return json({ error: 'not a main data key' }, 400);
  const raw = await readBody(req, MAX_SAVE_BYTES);
  if (!raw) return json({ error: 'too-large' }, 413);
  const body = JSON.parse(raw.toString('utf8')) as { base: Record<string, number>; changes: Changes; session?: Record<string, string>;
    secrets?: { unit: string; key: string; field: string; value: string }[]; numbers?: Claims; whole?: unknown };
  // Files are uploaded before a save, the data keeps links (task 3.11).
  const inline = inlineFile(body.changes);
  if (inline) return json({ error: 'file inside the data', what: inline }, 400);
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return forbidden();
    const actor = await actorOf(c, s);
    // The licence's dates over whatever the browser sent; read-only after its last day (task 3.15).
    const lic = await licenceOf(c);
    body.changes = pinData(body.changes, lic);
    const late = await refuseExpiredSave(c, actor, branch, key, body.changes, body.secrets || [], lic);
    if (late) return json(late, 403);
    await traceWrite(c, actor, branch, key, body.changes, body.secrets || [], req.headers.get('x-drivego-test') || '');
    const refused = await refuseSave(c, actor, branch, key, body.changes, body.secrets || []);
    if (refused) return json({ error: 'not allowed', what: refused }, 403);
    // What the person could not see goes back in, and the costs they could not work out are worked out here (task 3.9).
    const rights = await rightsOf(c, actor);
    let changes = await restoreHidden(c, branch, body.changes, masksFor(rights));
    if (!rights.cost && rootOf(key) === 'DB') changes = await fillCosts(c, branch, changes);
    // Money, tax, people and settings: what the screens would not have let this person do (task 3.9).
    const broken = await refuseRules(c, actor, branch, key, changes);
    if (broken) return json({ error: 'not allowed', what: broken }, 403);
    // whole: the browser is replacing the whole data set (3.2d: wipe, restore, import, sample data); the other devices reload (10.5).
    const whole = typeof body.whole === 'string' && /^[a-z-]{1,20}$/.test(body.whole) ? body.whole : undefined;
    const r = await saveMain(c, branch, key, body.base || {}, changes, body.numbers || {}, s.userId, whole);
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
    return json({ versions: r.versions, renumbered: r.renumbered, counters: r.counters, live: r.logId });
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  if (rootOf(key)) return json({ error: 'main data keys are saved with POST' }, 400);
  const raw = await readBody(req, MAX_SAVE_BYTES);
  if (!raw) return json({ error: 'too-large' }, 413);
  const value = raw.toString('utf8');
  return inShop(req, async (c, s) => {
    const branch = await branchOfKey(c, key);
    if (!inScope(s.scope, branch)) return forbidden();
    const late = await refuseExpiredKey(c, key, 'PUT', isBackupKey(key), isSafetyBackupKey(key), await licenceOf(c));
    if (late) return json(late, 403);
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
    const refused = refuseRemoveKey(await actorOf(c, s), branch, key);
    if (refused) return json({ error: 'not allowed', what: refused }, 403);
    const late = await refuseExpiredKey(c, key, 'DELETE', isBackupKey(key), isSafetyBackupKey(key), await licenceOf(c));
    if (late) return json(late, 403);
    await removeKey(c, branch, key);
    return json({ ok: true });
  });
}
