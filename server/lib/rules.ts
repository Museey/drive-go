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
//                         the owner or "เลือกไม่คิด VAT" (doc.noVat), or taken over from the document it came from (the
//                         reason is the screens' to ask: the sample data and older data have documents without one)
//   selling short         a sale, a revision or a customer claim that takes stock below zero: the owner or an approval right (59-stock-fifo.js)
//   shortage to cost      a stock count's shortage moved to the cost of goods sold (toCogs, accountant review 4.3): the owner
//                         or "อนุมัติใบตรวจนับ" (apv.count), and only added to
//   a count's surplus     approving a stored count that has goods over (applied): by someone who sees costs, with the unit cost
//                         of each confirmed and the evidence noted (accountant review 4.2, 59-stock-fifo.js); a count saved
//                         already applied (sample data, a backup, an import, or saved and approved at once): someone who sees costs
//   a request's costs     Franchise (franchise.v22): the unit cost on a branch request's lines and its flag (costed), written
//                         when HQ ships (accountant review 4.2, 59-stock-fifo.js): HQ only; a branch's own saves keep them
//   payroll               DB.payroll: the owner, or "บันทึกค่าใช้จ่าย" with the pay right (60-payroll.js); one period per month
//                         that is not cancelled
//   expenses, assets,     "บันทึกค่าใช้จ่าย สินทรัพย์ และเงินลงทุน" (doc.acctEdit), except marking an expense paid and paying
//   capital               for an asset ("จ่ายเงินเจ้าหนี้", doc.payGr, task 3.13); payroll expenses: the payroll's right
//   cancelling            a sale, a receipt or a receiving, a billing note, a goods receipt or a vendor payment, a legacy
//                         invoice: the right each screen checks where it is cancelled
//   people                employees' records: "ดูและแก้ไขข้อมูลพนักงานและสิทธิใช้งาน" (doc.emp); leave and warnings: doc.hrEdit
//   settings              the organisation's settings and branches: doc.orgEdit; the chart of accounts and its mapping: doc.coa
// Costs are not here: whoever may not see them cannot change them either (visibility.ts puts the stored ones back).
// Receiving and paying money keep the screens' own checks (not in the owner's list).
// "The owner" is whoever the screens take as one: the shop's owner, Franchise HQ, a branch head, a staff account
// that is not signed in as an employee.
import type pg from 'pg';
import type { Actor } from './permissions.ts';
import { COST_JOBS } from './visibility.ts';
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
  // How many records of a unit are stored.
  async count(unit: string): Promise<number> {
    const { rows } = await this.c.query<{ n: number }>(
      'select count(*)::int as n from records where shop_id = app_shop() and branch_id = $1 and unit = $2', [this.branch, unit]);
    return rows[0].n;
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
  'DB.assets': ['date', 'vat', 'inv', 'vendor', 'vendorId', 'cost', 'cancelled'],
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
  }
  return null;
}

// Selling more than there is (task 3.6, R9-ข): a save that makes a sale, a revision or a customer claim's
// replacement and takes an item below zero.
// A count's shortage moved to the cost of goods sold (accountant review 4.3, 59-stock-fifo.js): entries are only added.
async function toCogsRules(s: Save, who: Who): Promise<string | null> {
  if (!s.units().has('DB.stockCounts')) return null;
  for (const t of await s.touched('DB.stockCounts')) {
    const was = (t.old?.toCogs as unknown[] | undefined) || [], now = (t.now?.toCogs as unknown[] | undefined) || [];
    if (same(was, now)) continue;
    if (!who.owner && !who.can('apv.count')) return `DB.stockCounts|${t.key}: toCogs`;
    if (now.length < was.length || !same(now.slice(0, was.length), was)) return `DB.stockCounts|${t.key}: toCogs`;
  }
  return null;
}

// A count's surplus approved (accountant review 4.2): the approver sees costs and confirmed each unit cost with evidence.
async function surplusRules(s: Save, who: Who): Promise<string | null> {
  if (!s.units().has('DB.stockCounts')) return null;
  const seesCost = who.owner || COST_JOBS.some(k => who.can(k));
  for (const t of await s.touched('DB.stockCounts')) {
    if (!t.now?.applied || t.now.cancelled || t.old?.applied) continue;
    const over = ((t.now.items as Rec[] | undefined) || []).filter(it => isObj(it) && num(it.countedQty) > num(it.sysQty));
    if (!over.length) continue;
    if (!seesCost) return `DB.stockCounts|${t.key}: surplus cost`;
    if (t.old && (over.some(it => !(num(it.surplusCost) > 0)) || !String((t.now.surplus as Rec | undefined)?.note ?? '').trim()))
      return `DB.stockCounts|${t.key}: surplus cost`;
  }
  return null;
}

async function shortRules(s: Save, who: Who): Promise<string | null> {
  const approver = who.owner || ['quote', 'receipt', 'tax', 'gr', 'claim', 'issue', 'count', 'billing', 'invoice'].some(k => who.can(`apv.${k}`));
  if (approver || !s.units().has('DB.stock')) return null;
  const sale = (await Promise.all(['DB.stockCuts', 'DB.custClaims'].filter(u => s.units().has(u)).map(u => s.touched(u)))).flat()
    .some(t => t.now && (!t.old || (t.now.cut && !t.old.cut) || !same(t.old.lines, t.now.lines)));
  if (!sale) return null;
  for (const t of await s.touched('DB.stock')) {
    if (!t.now || !t.old) continue;
    for (const [br, now] of branchQty(t.now)) {
      const was = branchQty(t.old).get(br) ?? 0;
      if (now < 0 && now < was) return `DB.stock|${t.key}: not enough stock`;
    }
  }
  return null;
}
// An item's quantity in each branch of the data set: the main branch's inline, the others' in bq (19.js). The server
// keeps stock rows with the main branch's values inline whatever branch each person works in (task 3.10, 10.7).
const branchQty = (s: Rec) => new Map<string, number>([['main', num(s.qty)],
  ...Object.entries(isObj(s.bq) ? s.bq : {}).filter(([br]) => br !== 'main').map(([br, v]): [string, number] => [br, num(isObj(v) ? v.qty : 0)])]);

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

// Fields of a record that changed (all of them for a record added or removed).
const changedFields = (t: Touch) => !t.old || !t.now ? ['(record)']
  : [...new Set([...Object.keys(t.old), ...Object.keys(t.now)])].filter(f => !same(t.old![f], t.now![f]));

// Expenses, assets and capital: "บันทึกค่าใช้จ่าย สินทรัพย์ และเงินลงทุน" (doc.acctEdit, 03.js saveExp / delExp / saveAsset /
// delAsset / saveCap / delCap, 62-assets.js cancelAsset). Marking an expense paid has no right of its own on the screens
// (payExp, the withholding certificate's number and remittance), so those fields stay open; paying for an asset is
// "จ่ายเงินเจ้าหนี้" (ASSET_PAYMENT). Payroll expenses change only with their period (60-payroll.js): the payroll's right.
const EXP_PAYMENT = ['paid', 'payDate', 'method', 'pvNo', 'whtCertNo', 'whtForm', 'whtRemit', 'updatedBy', 'updatedByName', 'updatedAt'];
// Paying for an asset bought on credit (task 3.13, answer 13.10): "จ่ายเงินเจ้าหนี้" (doc.payGr), in the settle window
// or its payment history (62-assets.js). What 4.4 records for a withholding certificate on a payment (its number, the
// form, the remittance) stays open, as for an expense; the asset's own payment fields (paid: nothing owed) do not.
const STAMP = ['updatedBy', 'updatedByName', 'updatedAt'];
const ASSET_PAYMENT = ['payments', 'paid', 'payDate', 'payMethod', 'payBank', 'payRef', 'payCard4', 'chkDate', 'payBy', 'payNote', ...STAMP];
const CERT = ['whtCertNo', 'whtForm', 'whtRemit'];
const payments = (x?: Rec) => ((x?.payments as Rec[] | undefined) || [])
  .map(p => isObj(p) ? Object.fromEntries(Object.entries(p).filter(([k]) => !CERT.includes(k))) : p);
async function moneyRules(s: Save, who: Who): Promise<string | null> {
  if (who.owner) return null;
  const payroll = who.can('doc.acctEdit') && (who.can('doc.fin') || who.can('doc.emp'));
  if (s.units().has('DB.expenses')) for (const t of await s.touched('DB.expenses')) {
    if (t.old?.payroll || t.now?.payroll) { if (!payroll) return `DB.expenses|${t.key}`; continue; }
    if (!who.can('doc.acctEdit') && changedFields(t).some(f => !EXP_PAYMENT.includes(f))) return `DB.expenses|${t.key}`;
  }
  if (s.units().has('DB.capital') && !who.can('doc.acctEdit'))
    for (const t of await s.touched('DB.capital')) if (changedFields(t).length) return `DB.capital|${t.key}`;
  if (s.units().has('DB.assets') && !who.can('doc.acctEdit'))
    for (const t of await s.touched('DB.assets')) {
      const f = changedFields(t);
      if (!f.length) continue;
      if (f.some(x => !ASSET_PAYMENT.includes(x))) return `DB.assets|${t.key}`;
      if (!who.can('doc.payGr') && (f.some(x => x !== 'payments' && !STAMP.includes(x)) || !same(payments(t.old), payments(t.now))))
        return `DB.assets|${t.key}`;
    }
  return null;
}

// Cancelling financial documents (the rights the screens check where each is cancelled, 03.js / 13.js / 15.js / 16.js):
// receipts, billing notes, goods receipts "ยกเลิกเอกสาร" with "ลบเอกสาร" (doc.cancelDoc, doc.delDoc); a sale (stock cut)
// and what goes with it, the sale's own cancel right (m.rcptCut_cancel); legacy invoices, cancelled or deleted;
// a receiving cancelled (its receipt MA-RE), a vendor payment voided.
async function cancelRules(s: Save, who: Who): Promise<string | null> {
  if (who.owner) return null;
  const docRight = who.can('doc.cancelDoc') && who.can('doc.delDoc'), cutRight = who.can('m.rcptCut_cancel');
  const cancelled = (t: Touch) => !!t.now?.cancelled && !t.old?.cancelled && !!t.old;
  const payCancelled = (t: Touch) => {
    const was = new Map(((t.old?.payments as Rec[] | undefined) || []).map((p, i) => [String(p?.id ?? i), p]));
    return ((t.now?.payments as Rec[] | undefined) || []).some((p, i) => p?.cancelled && was.has(String(p?.id ?? i)) && !was.get(String(p?.id ?? i))?.cancelled);
  };
  const rule: [string, (t: Touch) => boolean][] = [
    ['DB.stockCuts', t => !cancelled(t) || cutRight || docRight],
    ['DB.receipts', t => (!cancelled(t) || docRight || (!!t.old?.pkgSale && cutRight))
      && (!payCancelled(t) || docRight || cutRight || ['doc.payRec', 'm.rcptDoc_cancel', 'm.rcptBilling_cancel'].some(k => who.can(k)))],
    ['DB.billings', t => !cancelled(t) || docRight],
    ['DB.purchases', t => (!cancelled(t) || docRight) && (!payCancelled(t) || who.can('doc.payGr'))],
    ['DB.invoices', t => (!cancelled(t) || docRight) && (!!t.now || !t.old || who.can('doc.delDoc'))],
  ];
  for (const [unit, ok] of rule) if (s.units().has(unit)) for (const t of await s.touched(unit)) if (!ok(t)) return `${unit}|${t.key}: cancel`;
  return null;
}

// People: employees' records "ดูและแก้ไขข้อมูลพนักงานและสิทธิใช้งาน" (doc.emp, saveEmp / delEmp; sign-in fields are
// permissions.ts's; the 50 ทวิ number, the payroll's right); leave and warnings "งานบุคคล การลา และใบเตือน" (doc.hrEdit).
const EMP_ACCOUNT = ['dgbPass', 'dgbActive', 'pin', 'perms'];
async function peopleRules(s: Save, who: Who): Promise<string | null> {
  if (who.owner) return null;
  if (s.units().has('DB.emp')) for (const t of await s.touched('DB.emp')) {
    const f = changedFields(t).filter(x => !EMP_ACCOUNT.includes(x) && x !== 'updatedBy' && x !== 'updatedByName' && x !== 'updatedAt');
    if (f.includes('cert50') && !(who.can('doc.acctEdit') && (who.can('doc.fin') || who.can('doc.emp')))) return `DB.emp|${t.key}`;
    if (f.some(x => x !== 'cert50') && !who.can('doc.emp')) return `DB.emp|${t.key}`;
  }
  for (const unit of ['DB.hr', 'DB.warns']) if (s.units().has(unit) && !who.can('doc.hrEdit'))
    for (const t of await s.touched(unit)) if (changedFields(t).length) return `${unit}|${t.key}`;
  return null;
}

// Settings: the organisation's settings "ตั้งค่าองค์กร · ภาษี · อายุการใช้งาน" (doc.orgEdit, saveSetting and the
// social security figures, branches 19.js) and the chart of accounts and its mapping "จัดการผังบัญชีและการผูกบัญชี"
// (doc.coa). Fields the screens write without a right are left out: the logo, the licence dates and, in a franchise,
// what the chain copies into each branch when it opens (name, branch, phone, address). A chart or a branch list made
// for the first time (the app fills in its defaults when there is none) goes through.
const ORG_FIELDS = ['type', 'vatReg', 'person', 'company', 'tax', 'email', 'web', 'stale', 'warrM', 'warr', 'ssoRate', 'ssoMin',
  'ssoMax', 'ssoCap', 'ssoOwn', 'banks', 'bank', 'logoHead', 'logoOp', 'name', 'branch', 'addr', 'tel'];
const CHAIN_FIELDS = ['name', 'branch', 'addr', 'tel'];
async function settingsRules(s: Save, who: Who, pkg: string): Promise<string | null> {
  if (who.owner) return null;
  if (!who.can('doc.orgEdit')) {
    const shop = await s.whole('DB.shop');
    if (shop.touched && shop.old && shop.now) {
      const f = ORG_FIELDS.filter(x => !same(shop.old![x], shop.now![x]) && !(pkg === 'franchise' && CHAIN_FIELDS.includes(x)));
      if (f.length) return `DB.shop: ${f.join(', ')}`;
    }
    if (s.units().has('DB.branches') && await s.count('DB.branches') > 0)
      for (const t of await s.touched('DB.branches')) if (changedFields(t).length) return `DB.branches|${t.key}`;
  }
  if (!who.can('doc.coa') && (s.units().has('DB.coa') || s.units().has('DB.map'))) {
    if (await s.count('DB.coa') > 0) {
      for (const t of s.units().has('DB.coa') ? await s.touched('DB.coa') : []) if (changedFields(t).length) return `DB.coa|${t.key}`;
      const map = await s.whole('DB.map');
      if (map.touched && !same(map.old, map.now)) return 'DB.map';
    }
  }
  return null;
}

// The costs HQ ships a branch request at (accountant review 4.2): only HQ writes them.
async function reqCostRules(s: Save, a: Actor): Promise<string | null> {
  if (a.role === 'HQ' || a.role === 'owner' || !s.units().has('FR.reqs')) return null;
  const costs = (r?: Rec) => ((r?.items as Rec[] | undefined) || []).map(i => (isObj(i) ? i.cost ?? null : null));
  for (const t of await s.touched('FR.reqs')) {
    if (!t.now) continue;
    const was = costs(t.old), now = costs(t.now);
    if (now.some((v, i) => !same(v, was[i] ?? null)) || !same(t.now.costed, t.old?.costed)) return `FR.reqs|${t.key}: cost`;
  }
  return null;
}

export async function refuseRules(c: pg.ClientBase, a: Actor, branch: string, key: string, changes: Changes): Promise<string | null> {
  if (key === 'franchise.v22') return reqCostRules(new Save(c, branch, changes), a);
  if (!/^garage\.v22/.test(key)) return null;
  const s = new Save(c, branch, changes), who = await whoOf(c, a);
  for (const rule of [taxPeriodRules, creditNoteRules, noVatRules, shortRules, toCogsRules, surplusRules, payrollRules, moneyRules, cancelRules, peopleRules,
    (x: Save, w: Who) => settingsRules(x, w, a.pkg)]) {
    const r = await rule(s, who);
    if (r) return r;
  }
  return null;
}
