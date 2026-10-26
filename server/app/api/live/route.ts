// What other devices of the shop save, as it happens (task 3.10, server/lib/live.ts): a stream of server-sent
// events for the signed-in browser.
//   ?since=<id>   the last save it heard of (or the cursor its data was read at: x-drivego-live)
// Events:
//   change     one save (LiveEntry); the browser asks for the rows it does not have yet
//   resync     too much was missed: read the data again
//   rights     what this person may see changed (task 3.9 masks): read the data again
//   signedOut  the session ended (password changed, account suspended, signed out elsewhere: Q2, 10.6)
//   ping       every few seconds, so the browser knows the server is reachable (10.4)
// Only saves within the session's branch scope are sent; the browser's own saves come too (it skips them).
import { json } from '@/lib/api';
import { pool, withShop } from '@/lib/db';
import { type LiveEntry, entriesSince, hub } from '@/lib/live';
import { actorOf, rightsOf } from '@/lib/permissions';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const PING_MS = 3000;          // the browser covers its screen after about 8 s without one (answer 10.4: 5–10 s)
const CHECK_MS = 30_000;       // the session is also checked after every save of the shop
const SLACK = 100;             // saves commit out of id order now and then: look back this far after a gap
const MAX_CATCH_UP = 500;      // more than this missed: read the data again
const RIGHTS_UNITS = new Set(['DB.emp', 'FR.accounts']);

export async function GET(req: Request) {
  const s = await getSession(req);
  if (!s) return json({ error: 'signed-out' }, 401);
  const since = Math.max(0, Number(new URL(req.url).searchParams.get('since')) || 0);
  const rights = async () => withShop(pool(), s.shopId, s.scope, async c => JSON.stringify(await rightsOf(c, await actorOf(c, s))));
  const startRights = await rights();
  const enc = new TextEncoder();
  let end = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      let open = true, cursor = since;
      const seen = new Set<number>();
      const send = (event: string, data: unknown) => {
        if (!open) return;
        try { ctrl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); } catch { end(); }
      };
      const deliver = (e: LiveEntry) => {
        if (seen.has(e.id)) return;
        seen.add(e.id);
        if (seen.size > 4000) for (const id of [...seen].slice(0, 2000)) seen.delete(id);
        cursor = Math.max(cursor, e.id);
        send('change', e);
      };
      let checking = false;
      const check = async (all: boolean) => {
        if (checking || !open) return;
        checking = true;
        try {
          if (!await getSession(req)) { send('signedOut', {}); end(); return; }
          if (all && await rights() !== startRights) { send('rights', {}); end(); }
        } catch { /* the database is away: the next check tries again */ } finally { checking = false; }
      };
      const catchUp = async () => {
        try {
          const list = await withShop(pool(), s.shopId, s.scope, c => entriesSince(c, Math.max(0, cursor - SLACK), MAX_CATCH_UP + 1));
          if (list.length > MAX_CATCH_UP) { send('resync', {}); end(); return; }
          for (const e of list) deliver({ ...e, late: true });
        } catch { send('resync', {}); end(); }
      };
      const unsubscribe = hub().subscribe({
        shopId: s.shopId, scope: s.scope,
        deliver: e => { deliver(e); void check(e.rows.some(r => RIGHTS_UNITS.has(r[0])) || e.whole !== undefined); },
        gap: () => void catchUp(),
      });
      const ping = setInterval(() => send('ping', {}), PING_MS);
      const slow = setInterval(() => void check(true), CHECK_MS);
      end = () => {
        if (!open) return;
        open = false;
        clearInterval(ping); clearInterval(slow); unsubscribe();
        try { ctrl.close(); } catch { /* already closed */ }
      };
      req.signal.addEventListener('abort', () => end());
      ctrl.enqueue(enc.encode('retry: 2000\n\n'));
      send('ping', {});
      void catchUp();
    },
    cancel() { end(); },
  });
  return new Response(stream, {
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no' },
  });
}
