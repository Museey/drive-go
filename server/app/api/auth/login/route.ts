// Signs in at a shop's address (decision Q1): { code, user, pass } -> sets the
// session cookie, or { error } with the legacy app's message for that case.
import { json, readJson } from '@/lib/api';
import { signInBiz, signInFranchise, userIdOf } from '@/lib/auth';
import { pool, withShop } from '@/lib/db';
import { shopByCode } from '@/lib/public';
import { startInHomeBranch, startSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await readJson<{ code?: string; user?: string; pass?: string }>(req, 16 * 1024);
  if (body instanceof Response) return body;
  const { code, user, pass } = body;
  const shop = typeof code === 'string' ? await shopByCode(pool(), code) : null;
  if (!shop || shop.status !== 'active') return json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, 401);
  const r = await withShop(pool(), shop.id, '*', async c => {
    const s = shop.package === 'franchise' ? await signInFranchise(c, String(user ?? ''), String(pass ?? ''))
      : await signInBiz(c, String(user ?? ''), String(pass ?? ''));
    if (!s.ok) return { error: s.error };
    const userId = await userIdOf(c, s.account);
    if (!userId) return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    const started = await startSession(c, userId, s.scope);
    // Each person's own working branch (task 3.10, 10.7); a franchise branch's data has one branch of its own.
    if (s.account.kind === 'emp' && shop.package !== 'franchise') await startInHomeBranch(c, started.token, 'garage.v22', '', s.account.ref);
    return { cookie: started.cookie };
  });
  if ('error' in r) return json({ error: r.error }, 401);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json', 'set-cookie': r.cookie } });
}
