// The shop's licence for its screens (task 3.15, frontend/js/65-licence.js): its kind and days, today as the
// server counts it, and whether the shop is read-only. The dates are in the shop's data as well (DB.shop).
import { inShop, json } from '@/lib/api';
import { expired, licenceOf, today } from '@/lib/licence';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return inShop(req, async c => {
    const l = await licenceOf(c);
    const day = today();
    if (!l) return json({ today: day, readOnly: true });
    return json({ kind: l.kind, start: l.start, end: l.end, deleteOn: l.deleteOn, today: day, readOnly: expired(l, day) });
  });
}
