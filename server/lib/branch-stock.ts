// Stock of each branch of a data set, for the browser (task 3.10, answer 10.7: each person works in their own branch).
// The legacy app keeps the working branch's quantity, min, max, place and last move inline in every stock record and
// the other branches' in s.bq[branch]; DB.stockCtx says whose values are inline, and changing branch rewrites every
// record (frontend/js/19.js swapStock). With the working branch per person, the server keeps the records with the
// main branch's values inline (and DB.stockCtx 'main') whoever saves them: window.storage turns the app's records back
// to that shape before it compares and saves, and turns records another device saved to the app's shape before it
// puts them into the app's data. Used by server/client (bundled), so no Node or browser APIs.
type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);

export const MAIN = 'main';
const SF = ['qty', 'min', 'max', 'zone', 'shelf', 'loc', 'lastMove'];
const NUMERIC = new Set(['qty', 'min', 'max']);
const blank = (k: string) => (NUMERIC.has(k) ? 0 : '');
// As swapStock keeps a branch's values: missing ones as 0 or ''.
const valuesOf = (s: Rec) => Object.fromEntries(SF.map(k => [k, s[k] == null ? blank(k) : s[k]]));
const zero = () => Object.fromEntries(SF.map(k => [k, blank(k)]));

// A record in the main branch's shape, for working branch `to` (swapStock(to) on one record).
export function stockToBranch(s: Rec, to: string): Rec {
  if (to === MAIN) return s;
  const out: Rec = { ...s }, bq: Rec = isObj(s.bq) ? { ...s.bq } : {};
  bq[MAIN] = valuesOf(s);
  const t = isObj(bq[to]) ? bq[to] as Rec : zero();
  for (const k of SF) out[k] = t[k];
  delete bq[to];
  out.bq = bq;
  return out;
}

// Whether two records are the same stock record but for what swapping branches adds: a branch's values kept with
// nothing in them (0 and ''), fields of those values missing instead of 0 or '', an empty bq.
function lenient(s: Rec): Rec {
  const out: Rec = { ...s };
  for (const k of SF) if (out[k] == null || out[k] === blank(k)) delete out[k];
  if (isObj(s.bq)) {
    const bq: Rec = {};
    for (const [br, v] of Object.entries(s.bq)) {
      if (!isObj(v)) { bq[br] = v; continue; }
      const kept = Object.fromEntries(Object.entries(v).filter(([k, x]) => !(SF.includes(k) && (x == null || x === blank(k)))));
      if (Object.keys(kept).length) bq[br] = kept;
    }
    if (Object.keys(bq).length) out.bq = bq; else delete out.bq;
  }
  return out;
}
const canon = (v: unknown): unknown => Array.isArray(v) ? v.map(canon)
  : isObj(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a: Rec, b: Rec) => JSON.stringify(canon(lenient(a))) === JSON.stringify(canon(lenient(b)));

// A record of working branch `from` in the main branch's shape (swapStock('main') on one record). stored: the
// server's copy of it, returned as it is when nothing but the shape differs, so a person working in another branch
// does not send every stock record back.
export function stockToMain(s: Rec, from: string, stored?: Rec): Rec {
  if (from === MAIN) return s;
  const out: Rec = { ...s }, bq: Rec = isObj(s.bq) ? { ...s.bq } : {};
  bq[from] = valuesOf(s);
  const t = isObj(bq[MAIN]) ? bq[MAIN] as Rec : zero();
  for (const k of SF) out[k] = t[k];
  delete bq[MAIN];
  out.bq = bq;
  return stored && same(out, stored) ? stored : out;
}

// The app's data (a parsed garage.v22 value) in the server's shape: when it works in another branch, its stock
// records with the main branch's values inline and stockCtx 'main'. stored: the server's stock records by id.
// Returns whether anything changed.
export function dataToMain(db: Rec, stored: Map<string, Rec>): boolean {
  const from = typeof db.stockCtx === 'string' ? db.stockCtx : MAIN;
  if (from === MAIN) return false;
  if (Array.isArray(db.stock)) db.stock = db.stock.map(s => isObj(s) ? stockToMain(s, from, typeof s.id === 'string' || typeof s.id === 'number' ? stored.get(String(s.id)) : undefined) : s);
  db.stockCtx = MAIN;
  return true;
}
