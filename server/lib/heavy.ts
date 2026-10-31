// Requests that hold a shop's whole data in memory at once — reading a main data key (14 MB for a shop with three
// years of documents), reading or making a backup point — run at most HEAVY_AT_ONCE at a time per server; the others
// wait their turn (tools/load-test.mjs, docs/LOAD-TEST.md: 15 devices opening the program together took the 1 GB
// test server to 1,009 MB, about 100 MB each). Callers take their turn before they take a database connection, so
// waiting requests hold none.
const AT_ONCE = Math.max(1, Number(process.env.HEAVY_AT_ONCE) || 2);

let running = 0;
const waiting: (() => void)[] = [];

export async function heavy<T>(work: () => Promise<T>): Promise<T> {
  if (running < AT_ONCE) running++;
  else await new Promise<void>(go => waiting.push(go));   // the finishing request hands its turn over
  try {
    return await work();
  } finally {
    const next = waiting.shift();
    if (next) next(); else running--;
  }
}

// For tests: how many run and wait now.
export const heavyNow = () => ({ running, waiting: waiting.length });
