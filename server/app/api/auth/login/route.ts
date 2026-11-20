// Signs in at a shop's address (decision Q1): { code, user, pass } -> sets the
// session cookie, or { error } with the legacy app's message for that case.
// check: true (the central sign-in page /login, owner 2026-11-17): the same checks and the same limit on wrong tries,
// but no session: the shop's own page signs in after it (frontend/js/78-central-login.js). Its refusal names the shop
// code too, as the shop code is typed there. Its answer names the shop's package (biz, prox, franchise), only once the
// password is right: the page has one card per package and refuses the wrong card (owner 2026-11-17).
import { clientAddress, json, readJson } from '@/lib/api';
import { MESSAGES, deviceFailed, deviceLocked, signInBiz, signInFranchise, userIdOf } from '@/lib/auth';
import { pool, withShop } from '@/lib/db';
import { shopByCode } from '@/lib/public';
import { startInHomeBranch, startSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await readJson<{ code?: string; user?: string; pass?: string; check?: boolean }>(req, 16 * 1024);
  if (body instanceof Response) return body;
  const { code, user, pass } = body, check = body.check === true;
  const WRONG = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
  // Too many wrong sign-ins from this device (any account, any shop): not even checked (DEVICE in lib/auth.ts).
  const address = clientAddress(req);
  if (deviceLocked(address)) return json({ error: MESSAGES.lockedOut }, 401);
  const refused = (error: string) => {
    deviceFailed(address);
    return json({ error: check && error === WRONG ? 'รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' : error }, 401);
  };
  const shop = typeof code === 'string' ? await shopByCode(pool(), code) : null;
  if (!shop || shop.status !== 'active') return refused(WRONG);
  const r = await withShop(pool(), shop.id, '*', async c => {
    const s = shop.package === 'franchise' ? await signInFranchise(c, String(user ?? ''), String(pass ?? ''))
      : await signInBiz(c, String(user ?? ''), String(pass ?? ''));
    if (!s.ok) return { error: s.error };
    const userId = await userIdOf(c, s.account);
    if (!userId) return { error: WRONG };
    if (check) return { checked: true as const };
    // A password DriveGo's team issued: the shop's page asks for one of the person's own first (0010_must_change.sql).
    const mustChange = (await c.query<{ m: boolean }>('select must_change as m from users where id = $1', [userId])).rows[0]?.m === true;
    const started = await startSession(c, userId, s.scope);
    // Each person's own working branch (task 3.10, 10.7); a franchise branch's data has one branch of its own.
    if (s.account.kind === 'emp' && shop.package !== 'franchise') await startInHomeBranch(c, started.token, 'garage.v22', '', s.account.ref);
    return { cookie: started.cookie, mustChange };
  });
  if ('error' in r) return refused(r.error as string);
  if ('checked' in r) return json({ ok: true, package: shop.package });
  return new Response(JSON.stringify(r.mustChange ? { ok: true, mustChange: true } : { ok: true }), { headers: { 'content-type': 'application/json', 'set-cookie': r.cookie } });
}
