import { inShop, json } from '@/lib/api';
import { listKeys } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// window.storage.list(): every STORE key the session can reach.
export async function GET(req: Request) {
  return inShop(req, async c => json({ keys: await listKeys(c) }));
}
