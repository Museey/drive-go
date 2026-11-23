// Requests that hold a shop's whole data in memory at once — reading a main data key (14 MB for a shop with three
// years of documents), reading or making a backup point — run at most HEAVY_AT_ONCE at a time per server; the others
// wait their turn (tools/load-test.mjs, docs/LOAD-TEST.md: 15 devices opening the program together took the 1 GB
// test server to 1,009 MB, about 100 MB each). Callers take their turn before they take a database connection, so
// waiting requests hold none.
//
// A request waits at most WAIT_MS (security review 2026-11-23, docs/SECURITY-AUDIT-2026-11.md ก1: one slow request
// held the only turn and every shop's program took minutes to open), and stops waiting when its browser goes away.
// It is then answered 503: the browser tries again (server/client/storage.ts send).
const AT_ONCE = Math.max(1, Number(process.env.HEAVY_AT_ONCE) || 2);
export const WAIT_MS = Math.max(1000, Number(process.env.HEAVY_WAIT_MS) || 60_000);

let running = 0;
const waiting: (() => void)[] = [];

// Thrown when the turn did not come: the route answers busy().
export class Busy extends Error {}
export const busy = () => Response.json({ error: 'busy' }, { status: 503, headers: { 'retry-after': '5', 'cache-control': 'no-store' } });

export async function heavy<T>(work: () => Promise<T>, o: { signal?: AbortSignal; waitMs?: number } = {}): Promise<T> {
  if (running < AT_ONCE) running++;
  else {
    await new Promise<void>((go, no) => {
      let done = false;
      const give = () => { if (done) return; done = true; clearTimeout(timer); o.signal?.removeEventListener('abort', leave); go(); };
      const leave = () => {
        if (done) return;
        done = true; clearTimeout(timer);
        const i = waiting.indexOf(give);
        if (i >= 0) waiting.splice(i, 1);
        no(new Busy('no turn'));
      };
      const timer = setTimeout(leave, o.waitMs ?? WAIT_MS);
      if (o.signal?.aborted) { leave(); return; }
      o.signal?.addEventListener('abort', leave, { once: true });
      waiting.push(give);   // the finishing request hands its turn over
    });
  }
  try {
    return await work();
  } finally {
    const next = waiting.shift();
    if (next) next(); else running--;
  }
}

// A heavy request answered 503 when its turn does not come.
export async function heavyOrBusy(work: () => Promise<Response>, signal?: AbortSignal): Promise<Response> {
  try { return await heavy(work, { signal }); } catch (e) { if (e instanceof Busy) return busy(); throw e; }
}

// For tests: how many run and wait now.
export const heavyNow = () => ({ running, waiting: waiting.length });
