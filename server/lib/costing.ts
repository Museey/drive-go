// Costs worked out on the server (task 3.9, decision R14-ข and the owner's answers of 2026-10-26). Someone who
// may not see costs (visibility.ts) still sells, returns, transfers and counts goods: their browser moves the
// FIFO lots without knowing what the goods cost, so every cost it writes is blank or wrong. After the stored
// values are put back (storage.ts restoreHidden), this fills in, the way the legacy screens would have, the costs
// that save made: the cost of what it took from each lot (FIFO allocations), of lots it added, of its moves, the
// documents' cost of goods (sale, revision, transfer, customer claim) and the register cost (the average of what
// is left, task 3.6). Legacy rules mirrored here: frontend/js/09.js (lots, allocations), 59-stock-fifo.js
// (register cost), 03.js logMove, 15.js costs(c), 16.js chainCost, 20.js (transfers), 21.js (customer claims).
import type pg from 'pg';
import type { Changes, Row } from './units.ts';

type Rec = Record<string, unknown>;
const EPS = 1e-9;
const n = (v: unknown) => { const x = parseFloat(String(v)); return Number.isNaN(x) ? 0 : x; };
// round2 of the legacy app (03.js)
const round2 = (v: unknown) => { const x = n(v); return Math.sign(x) * Math.round(Number((Math.abs(x) * 100).toPrecision(12))) / 100; };
const GR_REF = 'รับเข้าจากใบรับสินค้า';

interface Loaded { unit: string; key: string; data: Rec; changed: boolean; pos: number }

async function stored(c: pg.ClientBase, branch: string, unit: string, where: string, args: unknown[]): Promise<{ key: string; data: Rec }[]> {
  const { rows } = await c.query<{ key: string; data: string }>(
    `select key, data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and ${where} order by pos, key`,
    [branch, unit, ...args]);
  return rows.map(r => ({ key: r.key, data: JSON.parse(r.data) }));
}

export async function fillCosts(c: pg.ClientBase, branch: string, changes: Changes): Promise<Changes> {
  const UNITS = ['DB.stock', 'DB.fifo.lots', 'DB.fifo.allocs', 'DB.moves', 'DB.stockCuts', 'DB.transfers', 'DB.custClaims'];
  const sent = changes.upsert.filter(r => UNITS.includes(r.unit));
  if (!sent.length) return changes;
  const removed = new Set(changes.remove.map(r => `${r.unit}|${r.key}`));
  const parsed = new Map<string, Rec>(sent.map(r => [`${r.unit}|${r.key}`, JSON.parse(r.data) as Rec]));
  const mine = (unit: string) => sent.filter(r => r.unit === unit).map(r => ({ key: r.key, data: parsed.get(`${r.unit}|${r.key}`)! }));

  // The goods the save touched.
  const ids = new Set<string>();
  for (const u of ['DB.fifo.lots', 'DB.fifo.allocs', 'DB.moves']) for (const r of mine(u)) if (r.data.stockId) ids.add(String(r.data.stockId));
  for (const r of mine('DB.stock')) ids.add(r.key);
  for (const u of ['DB.stockCuts', 'DB.transfers', 'DB.custClaims'])
    for (const r of mine(u)) for (const l of (r.data.lines as Rec[] | undefined) || []) if (l && l.stockId) ids.add(String(l.stockId));
  if (!ids.size) return changes;
  const idList = [...ids];

  // Stored rows of those goods, then the save's own rows over them (in the order the unit keeps them).
  const merge = async (unit: string, where: string, args: unknown[]): Promise<Loaded[]> => {
    const out: Loaded[] = (await stored(c, branch, unit, where, args))
      .filter(r => !removed.has(`${unit}|${r.key}`))
      .map((r, pos) => ({ unit, key: r.key, data: r.data, changed: false, pos }));
    const at = new Map(out.map(r => [r.key, r]));
    for (const r of mine(unit)) {
      const old = at.get(r.key);
      if (old) { old.data = r.data; old.changed = true; } else { const x = { unit, key: r.key, data: r.data, changed: true, pos: out.length }; out.push(x); at.set(r.key, x); }
    }
    return out;
  };
  const before = new Map<string, number>();   // register cost before the save
  for (const r of await stored(c, branch, 'DB.stock', 'key = any($3)', [idList])) before.set(r.key, n(r.data.cost));
  const storedKeys = async (unit: string, keys: string[]) => new Set((await stored(c, branch, unit, 'key = any($3)', [keys])).map(r => r.key));
  const lots = await merge('DB.fifo.lots', "data->>'stockId' = any($3)", [idList]);
  const allocs = await merge('DB.fifo.allocs', "data->>'stockId' = any($3)", [idList]);
  const lotKeys = new Set((await stored(c, branch, 'DB.fifo.lots', "data->>'stockId' = any($3)", [idList])).map(r => r.key));
  const allocBefore = new Map((await stored(c, branch, 'DB.fifo.allocs', "data->>'stockId' = any($3)", [idList])).map(r => [r.key, r.data]));
  const lotById = new Map(lots.map(l => [String(l.data.id), l]));
  const cost0 = (id: unknown) => before.get(String(id)) ?? 0;

  // Documents a lot or a move can come from (their numbers).
  const refNos = new Set<string>();
  for (const r of [...mine('DB.fifo.lots'), ...mine('DB.moves'), ...mine('DB.fifo.allocs')]) if (r.data.refNo) refNos.add(String(r.data.refNo));
  const docs = async (unit: string) => {
    const list = await merge(unit, "data->>'no' = any($3)", [[...refNos]]);
    return new Map(list.map(d => [String(d.data.no), d]));
  };
  const transfers = await docs('DB.transfers'), cclaims = await docs('DB.custClaims');
  const claimNos = new Set((await stored(c, branch, 'DB.claims', "data->>'no' = any($3)", [[...refNos]])).map(r => String(r.data.no)));
  const movesStored = await storedKeys('DB.moves', mine('DB.moves').map(r => r.key));
  const newMoves = mine('DB.moves').filter(r => !movesStored.has(r.key));   // moves are only ever added
  // Goods-received moves an opening ledger is rebuilt from (09.js migrate).
  const grMoves = await stored(c, branch, 'DB.moves', "data->>'stockId' = any($3) and data->>'type' = 'in' and data->>'refNo' = any($4)", [idList, [...refNos]]);

  // What a document's allocations cost on average for one item: gross (15.js costs, 20.js, 21.js) or net of returns (16.js chainCost).
  const avgOf = (refNo: string, stockId: unknown, net: boolean): number | null => {
    let q = 0, v = 0;
    for (const a of allocs) if (a.data.refNo === refNo && a.data.stockId === stockId) {
      const qty = net ? n(a.data.qty) - n(a.data.back) : n(a.data.qty);
      q += qty; v += qty * n(a.data.cost);
    }
    return q > 0 ? v / q : null;
  };
  const lineCost = (doc: Loaded | undefined, stockId: unknown): number | null => {
    const l = ((doc?.data.lines as Rec[] | undefined) || []).find(x => x && x.stockId === stockId);
    return l ? n(l.cost) : null;
  };

  // 1. Allocations taken from a known lot, and new provisional ones (negative stock: the register cost).
  const allocCosts = () => {
    for (const a of allocs) {
      if (!a.changed) continue;
      const was = allocBefore.get(a.key), lot = a.data.lotId ? lotById.get(String(a.data.lotId)) : undefined;
      const same = was && was.lotId === a.data.lotId && !!was.pending === !!a.data.pending;
      if (same) { a.data.cost = was.cost; continue; }
      if (lot) a.data.cost = lot.data.cost;
      else if (a.data.pending) a.data.cost = cost0(a.data.stockId);
    }
  };
  // 2. What the documents' moves carry (logMove's cost argument).
  const moveArg = (m: Rec): number => {
    const ref = String(m.refNo || '');
    if (transfers.has(ref) && m.type === 'in') return lineCost(transfers.get(ref), m.stockId) ?? cost0(m.stockId);
    if (cclaims.has(ref) && m.type === 'in') return lineCost(cclaims.get(ref), m.stockId) ?? cost0(m.stockId);
    if (claimNos.has(ref) || ref.startsWith('DC-')) return cost0(m.stockId);
    return 0;
  };
  // 3. New lots: an opening balance or a count's surplus (the register cost), one rebuilt from an old goods
  //    receipt (that receipt's cost), or what came back over what was taken (09.js onMove: the move's cost,
  //    else the register cost) — those last ones once the documents' costs are known.
  const lotCosts = (comeBack: boolean) => {
    for (const l of lots) {
      if (!l.changed || lotKeys.has(l.key) || (l.data.src === 'in') !== comeBack) continue;
      const d = l.data, ref = String(d.refNo || '');
      let cost = 0;
      if (d.src === 'gr' && String(d.ref || '').startsWith(GR_REF)) {
        cost = n(grMoves.find(m => m.data.refNo === ref && m.data.stockId === d.stockId && String(m.data.ref || '').startsWith(GR_REF))?.data.cost);
      } else if (d.src === 'in') {
        const m = newMoves.find(x => x.data.refNo === ref && x.data.stockId === d.stockId && x.data.type === 'in');
        cost = m ? n(m.data.cost) : 0;
      }
      d.cost = cost || cost0(d.stockId);
    }
  };

  // Transfers and customer claims first take from their own lots: their line cost is what that took.
  lotCosts(false);
  allocCosts();
  for (const [, t] of transfers) if (t.changed && !transfers.get(String(t.data.no))?.data.cancelled)
    for (const l of (t.data.lines as Rec[]) || []) { const a = avgOf(String(t.data.no), l.stockId, false); l.cost = a ?? cost0(l.stockId); }
  for (const [, cc] of cclaims) if (cc.changed && cc.data.cut && !cc.data.cancelled)
    for (const l of ((cc.data.lines as Rec[]) || []).filter(x => x && x.cut)) { const a = avgOf(String(cc.data.no), l.stockId, false); l.cost = a ?? cost0(l.stockId); }
  for (const m of newMoves) m.data.cost = moveArg(m.data);
  lotCosts(true);
  allocCosts();   // allocations settled on the new lots

  // 4. Sales: a new one, or one whose allocations this save changed (cancelled), costed as the legacy screen does.
  const touchedRefs = new Set(allocs.filter(a => a.changed).map(a => String(a.data.refNo || '')));
  const cutsStored = await storedKeys('DB.stockCuts', mine('DB.stockCuts').map(r => r.key));
  for (const r of mine('DB.stockCuts')) {
    const cut = r.data, ref = String(cut.moveRef || '');
    if (cutsStored.has(r.key) && !touchedRefs.has(ref)) continue;
    const net = !!cut.revOf && !cutsStored.has(r.key);
    for (const l of (cut.lines as Rec[]) || []) { const a = avgOf(ref, l.stockId, net); l.cost = a ?? cost0(l.stockId); }
    cut.cost = ((cut.lines as Rec[]) || []).reduce((t, l) => t + n(l.qty) * n(l.cost), 0);
  }

  // 5. The register: the average of what is left (59-stock-fifo.js), when it moved by more than rounding.
  const extra: Row[] = [];
  const stockRows = new Map(mine('DB.stock').map(r => [r.key, r.data]));
  for (const id of idList) {
    let q = 0, v = 0;
    for (const l of lots) if (l.data.stockId === id && n(l.data.left) > EPS) { q += n(l.data.left); v += n(l.data.left) * n(l.data.cost); }
    const avg = q > EPS ? round2(v / q) : null, was = before.get(id);
    const row = stockRows.get(id);
    if (row) row.cost = avg !== null && (was === undefined || Math.abs(avg - was) > 0.004) ? avg : (was ?? row.cost);
    else if (avg !== null && was !== undefined && Math.abs(avg - was) > 0.004) {
      const s = (await stored(c, branch, 'DB.stock', 'key = $3', [id]))[0];
      if (s) { s.data.cost = avg; extra.push({ unit: 'DB.stock', key: id, data: JSON.stringify(s.data) }); }
    }
  }

  const write = (d: Loaded) => { if (parsed.has(`${d.unit}|${d.key}`)) parsed.set(`${d.unit}|${d.key}`, d.data); };
  [...lots, ...allocs, ...transfers.values(), ...cclaims.values()].forEach(write);
  return {
    ...changes,
    upsert: [...changes.upsert.map(r => parsed.has(`${r.unit}|${r.key}`) ? { ...r, data: JSON.stringify(parsed.get(`${r.unit}|${r.key}`)) } : r), ...extra],
  };
}
