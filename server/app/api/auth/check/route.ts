// Checks a password or PIN the legacy screens used to compare in the browser
// (old password before changing it, PIN to switch user, …):
// { storeKey, unit, key, field, value } -> { ok, locked }.
import { inShop, json } from '@/lib/api';
import { accountOfSecret, checkPassword } from '@/lib/auth';
import { branchOfKey } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const b = await req.json() as { storeKey: string; unit: string; key: string; field: string; value: string };
  return inShop(req, async c => {
    const target = accountOfSecret(b.unit, b.key, await branchOfKey(c, b.storeKey));
    if (!target) return json({ error: 'not a password field' }, 400);
    const r = await checkPassword(c, target.account, b.unit === 'DB.emp' && b.field === 'pin' ? 'pin' : 'password', String(b.value ?? ''));
    return json({ ok: r === 'ok', locked: r === 'locked' });
  });
}
