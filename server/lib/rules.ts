// What a save may change, checked again on the server (task 3.9, part 3; the owner's answer of 2026-10-26: money,
// tax, people and settings, and the rules of tasks 3.3–3.8; the other menus' and buttons' rights stay in the
// screens until phase 4). Every save the screens make passes (all scenarios run with these checks on); a save made
// round them is refused (403, nothing written). The checks read the save as it will be written (after the hidden
// values are put back and the costs filled in, storage.ts / costing.ts) against what is stored.
//
//   tax periods           closing a month (DB.taxPeriods): the owner or "ปิดงวดภาษี" (doc.taxClose); opening it again: the owner
//   a closed month        documents with VAT dated in it (sales, goods receipts, expenses, assets): nothing that changes their
//                         tax (date, party, invoice number, lines, discount, VAT, amounts), no cancelling, revising, adjusting
//                         or removing them, and no new one — for everyone (56-tax-period.js); money in and out still goes;
//                         a full tax invoice issued late (T2-ก) and a credit note's adjustment go too
//   credit notes          DB.creditNotes: the owner or "ออกใบลดหนี้" (doc.creditNote); one that takes effect (approved) and
//                         approving or rejecting: the owner or "อนุมัติใบกำกับภาษี" (apv.tax) (57-credit-note.js)
//   VAT left off          a sales document of a VAT-registered shop without VAT (a quotation, a receipt, a stock cut):
//                         the owner or "เลือกไม่คิด VAT" (doc.noVat), with a reason; or the reason of the document it came from
//   selling short         a sale, a revision or a customer claim that takes stock below zero: the owner or an approval right (59-stock-fifo.js)
//   payroll               DB.payroll: the owner, or "บันทึกค่าใช้จ่าย" with the pay right (60-payroll.js); one period per month
//                         that is not cancelled
// "The owner" is whoever the screens take as one: the shop's owner, Franchise HQ, a branch head, a staff account
// that is not signed in as an employee.
import type pg from 'pg';
import type { Actor } from './permissions.ts';
import type { Changes } from './units.ts';

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const num = (v: unknown) => { const x = parseFloat(String(v)); return Number.isNaN(x) ? 0 : x; };
const hasVat = (x?: Rec) => !!x && num(x.vat) > 0;

// A row the save touches: what is stored (old) and what it will be (now; undefined = removed).
interface Touch { key: string; old?: Rec; now?: Rec }

export interface Who { owner: boolean; can(right: string): boolean }

export async function whoOf(c: pg.ClientBase, a: Actor): Promise<Who> {
  const self = a.role === 'emp' ? a.ref : a.emp ?? '';
  if (!self) return { owner: true, can: () => true };
  const { rows } = await c.query<{ data: string }>(
    "select data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = 'DB.emp' and key = $2", [a.branch, self]);
  const perms = rows.length ? (JSON.parse(rows[0].data).perms ?? {}) : {};
  return {
    owner: false,
    can: (right: string) => { const [g, f] = right.split('.'); return isObj(perms[g]) && (perms[g] as Rec)[f] === true; },
  };
}

class Save {
  private cache = new Map<string, Map<string, Rec>>();
  private c: pg.ClientBase;
  private branch: string;
  private changes: Changes;
  constructor(c: pg.ClientBase, branch: string, changes: Changes) { this.c = c; this.branch = branch; this.changes = changes; }
  units() { return new Set([...this.changes.upsert, ...this.changes.remove].map(r => r.unit)); }
  async stored(unit: string, keys: string[]): Promise<Map<string, Rec>> {
    const have = this.cache.get(unit) ?? new Map<string, Rec>();
    const want = keys.filter(k => !have.has(k));
    if (want.length) {
      const { rows } = await this.c.query<{ key: string; data: string }>(
        'select key, data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = any($3)',
        [this.branch, unit, want]);
      for (const r of rows) have.set(r.key, JSON.parse(r.data));
      this.cache.set(unit, have);
    }
    return new Map(keys.filter(k => have.has(k)).map(k => [k, have.get(k)!]));
  }
  // The rows of a unit the save touches.
  async touched(unit: string): Promise<Touch[]> {
    const up = this.changes.upsert.filter(r => r.unit === unit), rm = this.changes.remove.filter(r => r.unit === unit);
    const old = await this.stored(unit, [...up, ...rm].map(r => r.key));
    return [
      ...up.map(r => ({ key: r.key, old: old.get(r.key), now: JSON.parse(r.data) as Rec })),
      ...rm.map(r => ({ key: r.key, old: old.get(r.key) })),
    ];
  }
  // A whole-value unit (DB.shop, DB.taxPeriods): stored and as the save leaves it.
  async whole(unit: string): Promise<{ old?: Rec; now?: Rec; touched: boolean }> {
    const old = (await this.stored(unit, [''])).get('');
    const up = this.changes.upsert.find(r => r.unit === unit && r.key === '');
    const gone = this.changes.remove.some(r => r.unit === unit && r.key === '');
    return { old, now: up ? JSON.parse(up.data) : gone ? undefined : old, touched: !!up || gone };
  }
  // Records of a unit by a field's value (stored, then the save's own over them).
  async where(unit: string, field: string, values: string[]): Promise<Rec[]> {
    if (!values.length) return [];
    const { rows } = await this.c.query<{ key: string; data: string }>(
      'select key, data::text as data from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and data->>$3 = any($4)',
      [this.branch, unit, field, values]);
    const out = new Map(rows.map(r => [r.key, JSON.parse(r.data) as Rec]));
    for (const r of this.changes.upsert) if (r.unit === unit) { const v = JSON.parse(r.data); if (values.includes(String(v[field]))) out.set(r.key, v); }
    for (const r of this.changes.remove) if (r.unit === unit) out.delete(r.key);
    return [...out.values()];
  }
}

// The tax period rules (task 3.3, F2, T2–T5).
const TAX_FIELDS: Record<string, string[]> = {
  'DB.receipts': ['date', 'disc', 'vat', 'items', 'cancelled'],
  'DB.stockCuts': ['date', 'disc', 'vat', 'items', 'lines', 'cancelled', 'superseded'],
  'DB.purchases': ['date', 'vendorId', 'inv', 'disc', 'vat', 'items', 'cancelled'],
  'DB.expenses': ['date', 'payee', 'tax', 'inv', 'base', 'vat'],
  'DB.assets': ['date', 'vat', 'inv', 'vendor', 'cost'],
};
// A sale's adjustments other than those of credit notes, and its tax invoices that were cancelled.
const ownAdj = (x?: Rec) => ((x?.adj as Rec[] | undefined) || []).filter(a => a && !a.cn);
const cancelledTax = (x?: Rec) => ((x?.taxDocs as Rec[] | undefined) || []).filter(d => d && d.cancelled).map(d => d.no);

async function taxPeriodRules(s: Save, who: Who): Promise<string | null> {
  const tp = await s.whole('DB.taxPeriods');
  if (tp.touched) {
    const months = new Set([...Object.keys(tp.old || {}), ...Object.keys(tp.now || {})]);
    for (const mo of months) {
      const was = isObj(tp.old?.[mo]) ? tp.old![mo] as Rec : undefined, now = isObj(tp.now?.[mo]) ? tp.now![mo] as Rec : undefined;
      if (same(was, now)) continue;
      const closing = !!now?.closed && !was?.closed;
      if (!who.owner && !(closing && who.can('doc.taxClose') && same((was?.hist as unknown[] | undefined) || [], ((now?.hist as unknown[]) || []).slice(0, -1))))
        return `DB.taxPeriods|${mo}`;
    }
  }
  const closedMonths = new Set(Object.entries(tp.old || {}).filter(([, p]) => isObj(p) && p.closed).map(([mo]) => mo));
  if (!closedMonths.size) return null;
  const closed = (d: unknown) => closedMonths.has(String(d || '').slice(0, 7));
  for (const [unit, fields] of Object.entries(TAX_FIELDS)) {
    if (!s.units().has(unit)) continue;
    for (const t of await s.touched(unit)) {
      const lockedOld = hasVat(t.old) && closed(t.old!.date), lockedNow = hasVat(t.now) && closed(t.now!.date);
      if (!lockedOld && !lockedNow) continue;
      if (!t.now) return `${unit}|${t.key}: tax period closed`;
      const changed = !t.old || fields.some(f => !same(t.old![f], t.now![f])) || !same(ownAdj(t.old), ownAdj(t.now))
        || cancelledTax(t.now).some(no => !cancelledTax(t.old).includes(no));
      if (changed) return `${unit}|${t.key}: tax period closed`;
    }
  }
  // A revision of a sale of a closed month.
  for (const t of s.units().has('DB.stockCuts') ? await s.touched('DB.stockCuts') : []) {
    if (t.old || !t.now?.revOf) continue;
    const of = (await s.stored('DB.stockCuts', [String(t.now.revOf)])).get(String(t.now.revOf));
    if (hasVat(of) && closed(of!.date)) return `DB.stockCuts|${t.key}: tax period closed`;
  }
  return null;
}

// Credit notes (task 3.3, T6–T10). A sale's adjustment made by a credit note (cn) needs that note in effect.
const status = (x?: Rec) => (isObj(x?.apv) ? (x!.apv as Rec).status : undefined);
async function creditNoteRules(s: Save, who: Who): Promise<string | null> {
  for (const unit of ['DB.stockCuts', 'DB.receipts'].filter(u => s.units().has(u))) for (const t of await s.touched(unit)) {
    const had = new Set(((t.old?.adj as Rec[] | undefined) || []).map(a => a && a.id));
    const cns = ((t.now?.adj as Rec[] | undefined) || []).filter(a => a && a.cn && !had.has(a.id)).map(a => String(a.cn));
    if (!cns.length) continue;
    const notes = await s.where('DB.creditNotes', 'no', cns);
    if (cns.some(no => !notes.some(x => x.no === no && status(x) === 'approved'))) return `${unit}|${t.key}: credit note not in effect`;
  }
  if (who.owner || !s.units().has('DB.creditNotes')) return null;
  for (const t of await s.touched('DB.creditNotes')) {
    if (!who.can('doc.creditNote') && !who.can('apv.tax')) return `DB.creditNotes|${t.key}`;
    if (!t.now) return `DB.creditNotes|${t.key}`;
    if (status(t.now) !== status(t.old) && status(t.now) !== 'pending' && !who.can('apv.tax')) return `DB.creditNotes|${t.key}`;
    if (!t.old && !who.can('doc.creditNote')) return `DB.creditNotes|${t.key}`;
  }
  return null;
}

// VAT left off a sales document (task 3.3, R4-ข, T12).
async function noVatRules(s: Save, who: Who): Promise<string | null> {
  const units = ['DB.quotes', 'DB.receipts', 'DB.stockCuts'].filter(u => s.units().has(u));
  if (!units.length) return null;
  const shop = (await s.whole('DB.shop')).now;
  if (shop && shop.vatReg === false) return null;
  for (const unit of units) for (const t of await s.touched(unit)) {
    const now = t.now;
    if (!now || num(now.vat) > 0) continue;
    if (t.old && num(t.old.vat) <= 0 && t.old.noVatReason === now.noVatReason) continue;   // as it was
    // Taken over from the document it came from: its quotation, the sale it revises or copies, the receipt's own sale.
    const from: Rec[] = [];
    if (now.quoteId) from.push(...await s.where('DB.quotes', 'id', [String(now.quoteId)]));
    if (now.revOf) from.push(...await s.where('DB.stockCuts', 'id', [String(now.revOf)]));
    if (now.ref) for (const u of ['DB.stockCuts', 'DB.quotes']) from.push(...await s.where(u, 'no', [String(now.ref)]));
    if (unit === 'DB.receipts') from.push(...await s.where('DB.stockCuts', 'ledId', [String(now.id ?? t.key)]));
    if (from.some(x => num(x.vat) <= 0 && (x.noVatReason === now.noVatReason || !now.noVatReason))) continue;
    if (!who.owner && !who.can('doc.noVat')) return `${unit}|${t.key}: VAT left off`;
    if (!String(now.noVatReason || '').trim() && !t.old) return `${unit}|${t.key}: VAT left off without a reason`;
  }
  return null;
}

// Selling more than there is (task 3.6, R9-ข): a save that makes a sale, a revision or a customer claim's
// replacement and takes an item below zero.
async function shortRules(s: Save, who: Who): Promise<string | null> {
  const approver = who.owner || ['quote', 'receipt', 'tax', 'gr', 'claim', 'issue', 'count', 'billing', 'invoice'].some(k => who.can(`apv.${k}`));
  if (approver || !s.units().has('DB.stock')) return null;
  const sale = (await Promise.all(['DB.stockCuts', 'DB.custClaims'].filter(u => s.units().has(u)).map(u => s.touched(u)))).flat()
    .some(t => t.now && (!t.old || (t.now.cut && !t.old.cut) || !same(t.old.lines, t.now.lines)));
  if (!sale) return null;
  for (const t of await s.touched('DB.stock')) {
    if (!t.now || !t.old) continue;
    const was = num(t.old.qty), now = num(t.now.qty);
    if (now < 0 && now < was) return `DB.stock|${t.key}: not enough stock`;
  }
  return null;
}

// Payroll (tasks 3.7, 3.8, 3.9).
async function payrollRules(s: Save, who: Who): Promise<string | null> {
  if (!s.units().has('DB.payroll')) return null;
  const rows = await s.touched('DB.payroll');
  if (!who.owner && !(who.can('doc.acctEdit') && (who.can('doc.fin') || who.can('doc.emp')))) return `DB.payroll|${rows[0].key}`;
  const months = [...new Set(rows.filter(t => t.now && !t.now.cancelled).map(t => String(t.now!.month)))];
  for (const mo of months) {
    const live = (await s.where('DB.payroll', 'month', [mo])).filter(p => !p.cancelled);
    if (live.length > 1) return `DB.payroll|${mo}: recorded twice`;
  }
  return null;
}

export async function refuseRules(c: pg.ClientBase, a: Actor, branch: string, key: string, changes: Changes): Promise<string | null> {
  if (!/^garage\.v22/.test(key)) return null;
  const s = new Save(c, branch, changes), who = await whoOf(c, a);
  for (const rule of [taxPeriodRules, creditNoteRules, noVatRules, shortRules, payrollRules]) {
    const r = await rule(s, who);
    if (r) return r;
  }
  return null;
}
