// The rules the server checks again when a save is made (task 3.9, part 3, server/lib/rules.ts): money, tax,
// people, settings and the rules of tasks 3.3–3.8. Every save of the screens passes (all scenarios run with these
// checks on, TARGET=new); these are saves made round the screens, which must be refused.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { refuseRules } from '../../server/lib/rules.ts';
import { fillCosts } from '../../server/lib/costing.ts';
import { readMain } from '../../server/lib/storage.ts';

let db, ownerPool, appPool, n = 0;
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));
const asApp = (shopId, fn) => withShop(appPool, shopId, '*', fn);

before(async () => {
  db = await startTempPostgres();
  await migrate(db.url);
  ownerPool = new pg.Pool({ connectionString: db.url });
  appPool = new pg.Pool({ connectionString: db.url.replace('//drivego@', '//drivego_app@') });
});
after(async () => {
  await ownerPool?.end();
  await appPool?.end();
  await db?.stop();
});

// A save of some records, as the browser sends it: [unit, key, value] (value undefined = removed).
const save = (...rows) => ({
  upsert: rows.filter(r => r[2] !== undefined).map(([unit, key, data]) => ({ unit, key, data: JSON.stringify(data) })),
  remove: rows.filter(r => r[2] === undefined).map(([unit, key]) => ({ unit, key, data: '' })), order: {},
});

async function shop() {
  const { shopId } = await createShop(ownerPool, { code: `R-${++n}`, pkg: 'biz', data: fixture('biz-trial') });
  const DB = JSON.parse((await asApp(shopId, c => readMain(c, '', 'garage.v22'))).json);
  const emp = code => DB.emp.find(e => e.code === code);
  const as = code => code === 'owner' ? { pkg: 'biz', role: 'owner', ref: '', branch: '' } : { pkg: 'biz', role: 'emp', ref: emp(code).id, branch: '' };
  const check = (who, changes) => asApp(shopId, c => refuseRules(c, as(who), '', 'garage.v22', changes));
  // Stored values set by hand (as earlier saves would have left them).
  const put = (unit, key, data) => asApp(shopId, c => c.query(
    `insert into records (shop_id, branch_id, unit, key, pos, data) values (app_shop(), '', $1, $2, 0, $3)
     on conflict (shop_id, branch_id, unit, key) do update set data = excluded.data`, [unit, key, JSON.stringify(data)]));
  const grant = async (code, ...rights) => {
    const e = emp(code);
    for (const r of rights) { const [g, f] = r.split('.'); e.perms[g] = { ...e.perms[g], [f]: true }; }
    await put('DB.emp', e.id, e);
  };
  return { DB, emp, check, put, grant };
}

describe('งวดภาษี (งาน 3.3)', () => {
  test('ปิดงวดได้เฉพาะเจ้าของหรือผู้มีสิทธิ์ปิดงวดภาษี เปิดงวดกลับได้เฉพาะเจ้าของ', async () => {
    const { check, put, grant } = await shop();
    const close = { '2026-09': { closed: true, date: '2026-10-13', hist: [{ act: 'close', date: '2026-10-13' }] } };
    assert.equal(await check('EMP008', save(['DB.taxPeriods', '', close])), 'DB.taxPeriods|2026-09');
    assert.equal(await check('owner', save(['DB.taxPeriods', '', close])), null);
    await grant('EMP004', 'doc.taxClose');
    assert.equal(await check('EMP004', save(['DB.taxPeriods', '', close])), null);
    await put('DB.taxPeriods', '', close);
    const open = { '2026-09': { ...close['2026-09'], closed: false, hist: [...close['2026-09'].hist, { act: 'open', reason: 'x' }] } };
    assert.equal(await check('EMP004', save(['DB.taxPeriods', '', open])), 'DB.taxPeriods|2026-09');
    assert.equal(await check('owner', save(['DB.taxPeriods', '', open])), null);
  });

  test('เดือนที่ปิดงวดแล้ว: เอกสารที่มี VAT แก้ส่วนที่มีผลต่อภาษี ยกเลิก หรือสร้างใหม่ไม่ได้ แม้เป็นเจ้าของ รับเงินได้ตามปกติ', async () => {
    const { DB, check, put } = await shop();
    await put('DB.taxPeriods', '', { '2026-10': { closed: true, hist: [] } });
    const cut = DB.stockCuts.find(x => x.no === 'MA-SA261000003');
    assert.equal(await check('owner', save(['DB.stockCuts', cut.id, { ...cut, cancelled: true }])), `DB.stockCuts|${cut.id}: tax period closed`);
    assert.equal(await check('owner', save(['DB.stockCuts', cut.id, { ...cut, disc: 100 }])), `DB.stockCuts|${cut.id}: tax period closed`);
    assert.equal(await check('owner', save(['DB.stockCuts', cut.id, { ...cut, adj: [{ id: 'a1', type: 'down', amt: 10 }] }])), `DB.stockCuts|${cut.id}: tax period closed`);
    assert.equal(await check('owner', save(['DB.stockCuts', cut.id, undefined])), `DB.stockCuts|${cut.id}: tax period closed`);
    assert.equal(await check('owner', save(['DB.stockCuts', 'r1', { ...cut, id: 'r1', no: 'MA-SA261000003-R1', revOf: cut.id }])), 'DB.stockCuts|r1: tax period closed');
    assert.equal(await check('owner', save(['DB.stockCuts', cut.id, { ...cut, paid: 100, note: 'จ่ายบางส่วน' }])), null, 'money only');
    const gr = { id: 'g1', no: 'MA-RC261000099', date: '2026-10-05', vendorId: DB.vendors[0].id, inv: 'IV-1', vat: 7, items: [] };
    assert.equal(await check('owner', save(['DB.purchases', 'g1', gr])), 'DB.purchases|g1: tax period closed');
    assert.equal(await check('owner', save(['DB.purchases', 'g1', { ...gr, vat: 0 }])), null, 'no VAT');
    assert.equal(await check('owner', save(['DB.purchases', 'g1', { ...gr, date: '2026-11-01' }])), null, 'another month');
  });
});

describe('ใบลดหนี้ (งาน 3.3)', () => {
  const note = (cut, status) => ({ id: 'cn1', no: 'MA-CN261000001', date: '2026-10-13', saleId: cut.id, saleNo: cut.no, gross: 107, apv: { status } });
  test('ออกใบลดหนี้ได้เฉพาะเจ้าของหรือผู้มีสิทธิ์ พนักงานออกแล้วต้องรออนุมัติ อนุมัติได้เฉพาะผู้มีสิทธิ์อนุมัติใบกำกับภาษี', async () => {
    const { DB, check, grant, put } = await shop();
    const cut = DB.stockCuts.find(x => x.no === 'MA-SA261000003');
    assert.equal(await check('EMP008', save(['DB.creditNotes', 'cn1', note(cut, 'pending')])), 'DB.creditNotes|cn1');
    await grant('EMP008', 'doc.creditNote');
    assert.equal(await check('EMP008', save(['DB.creditNotes', 'cn1', note(cut, 'pending')])), null);
    assert.equal(await check('EMP008', save(['DB.creditNotes', 'cn1', note(cut, 'approved')])), 'DB.creditNotes|cn1');
    assert.equal(await check('owner', save(['DB.creditNotes', 'cn1', note(cut, 'approved')])), null);
    await put('DB.creditNotes', 'cn1', note(cut, 'pending'));
    assert.equal(await check('EMP008', save(['DB.creditNotes', 'cn1', note(cut, 'approved')])), 'DB.creditNotes|cn1');
    await grant('EMP004', 'apv.tax');
    assert.equal(await check('EMP004', save(['DB.creditNotes', 'cn1', note(cut, 'approved')])), null);
  });

  test('รายการปรับลดของใบลดหนี้ต้องมาจากใบลดหนี้ที่มีผลแล้ว', async () => {
    const { DB, check, put } = await shop();
    const cut = DB.stockCuts.find(x => x.no === 'MA-SA261000003');
    const adj = { ...cut, adj: [{ id: 'a1', type: 'down', amt: 107, cn: 'MA-CN261000001' }] };
    assert.equal(await check('owner', save(['DB.stockCuts', cut.id, adj])), `DB.stockCuts|${cut.id}: credit note not in effect`);
    await put('DB.creditNotes', 'cn1', note(cut, 'pending'));
    assert.equal(await check('owner', save(['DB.stockCuts', cut.id, adj])), `DB.stockCuts|${cut.id}: credit note not in effect`);
    assert.equal(await check('owner', save(['DB.creditNotes', 'cn1', note(cut, 'approved')], ['DB.stockCuts', cut.id, adj])), null);
    // Also in a closed month: that is what credit notes are for.
    await put('DB.taxPeriods', '', { '2026-10': { closed: true, hist: [] } });
    assert.equal(await check('owner', save(['DB.creditNotes', 'cn1', note(cut, 'approved')], ['DB.stockCuts', cut.id, adj])), null);
  });
});

describe('ไม่คิด VAT (งาน 3.3)', () => {
  test('เอกสารขายที่ไม่คิด VAT ของร้านที่จด VAT ต้องมีสิทธิ์ หรือรับมาจากเอกสารต้นทาง', async () => {
    const { DB, check, put } = await shop();
    const q = { ...DB.quotes[0], id: 'q1', no: 'MA-QT261000099', vat: 0, noVatReason: 'ลูกค้าต่างประเทศ' };
    assert.equal(await check('EMP008', save(['DB.quotes', 'q1', q])), 'DB.quotes|q1: VAT left off');
    assert.equal(await check('owner', save(['DB.quotes', 'q1', { ...q, noVatReason: '' }])), null, 'the reason is asked by the screens');
    assert.equal(await check('owner', save(['DB.quotes', 'q1', q])), null);
    // A stock cut of that quotation takes its reason over, whoever makes it.
    await put('DB.quotes', 'q1', q);
    const cut = { ...DB.stockCuts[0], id: 'c1', no: 'MA-SA261000099', quoteId: 'q1', vat: 0, noVatReason: q.noVatReason };
    assert.equal(await check('EMP008', save(['DB.stockCuts', 'c1', cut])), null);
    assert.equal(await check('EMP008', save(['DB.stockCuts', 'c1', { ...cut, quoteId: '' }])), 'DB.stockCuts|c1: VAT left off');
    // An existing document left as it was.
    const old = DB.stockCuts[0];
    await put('DB.stockCuts', old.id, { ...old, vat: 0, noVatReason: 'เดิม' });
    assert.equal(await check('EMP008', save(['DB.stockCuts', old.id, { ...old, vat: 0, noVatReason: 'เดิม', paid: 1 }])), null);
  });
});

describe('ขายเกินของที่มี (งาน 3.6)', () => {
  test('การขายที่ทำให้สต๊อกติดลบต้องเป็นเจ้าของหรือผู้มีสิทธิ์อนุมัติเอกสาร', async () => {
    const { DB, check } = await shop();
    const s = DB.stock.find(x => x.qty > 0);
    const cut = { ...DB.stockCuts[0], id: 'c1', no: 'MA-SA261000099', lines: [{ stockId: s.id, qty: s.qty + 1 }] };
    const sale = save(['DB.stockCuts', 'c1', cut], ['DB.stock', s.id, { ...s, qty: -1 }]);
    assert.equal(await check('EMP008', sale), `DB.stock|${s.id}: not enough stock`);
    assert.equal(await check('EMP004', sale), null);
    assert.equal(await check('owner', sale), null);
    assert.equal(await check('EMP008', save(['DB.stockCuts', 'c1', cut], ['DB.stock', s.id, { ...s, qty: 0 }])), null);
  });

  test('ขายที่สาขาอื่นของร้าน: server เก็บยอดสาขาหลักไว้ในแถว ยอดสาขาอื่นอยู่ใน bq จึงตรวจทุกสาขา (งาน 3.10 ข้อ 10.7)', async () => {
    const { DB, check, put } = await shop();
    const s = DB.stock.find(x => x.qty > 0);
    const b2 = { qty: 1, min: 0, max: 0, zone: '', shelf: '', loc: '', lastMove: '' };
    await put('DB.stock', s.id, { ...s, bq: { b2 } });
    const cut = { ...DB.stockCuts[0], id: 'c1', no: 'B2-SA261000001', br: 'b2', lines: [{ stockId: s.id, qty: 2 }] };
    const short = save(['DB.stockCuts', 'c1', cut], ['DB.stock', s.id, { ...s, bq: { b2: { ...b2, qty: -1 } } }]);
    assert.equal(await check('EMP008', short), `DB.stock|${s.id}: not enough stock`);
    assert.equal(await check('EMP008', save(['DB.stockCuts', 'c1', cut], ['DB.stock', s.id, { ...s, bq: { b2: { ...b2, qty: 0 } } }])), null);
  });
});

describe('ของขาดเป็นต้นทุนขาย (ผู้ทำบัญชี 4.3)', () => {
  test('ปรับของขาดจากการตรวจนับเป็นต้นทุนขายได้เฉพาะเจ้าของหรือผู้มีสิทธิ์อนุมัติใบตรวจนับ และเพิ่มได้อย่างเดียว ลบหรือแก้รายการเดิมไม่ได้', async () => {
    const { check, put, grant } = await shop();
    const count = { id: 'sc1', no: 'MA-SC261000099', applied: true, items: [{ stockId: 's1', sysQty: 5, countedQty: 3 }] };
    await put('DB.stockCounts', 'sc1', count);
    const one = { stockId: 's1', code: 'BR-001', qty: 1, reason: 'ใช้ซ่อมไปแล้วแต่ไม่ได้ลงในบิล', date: '2026-10-13', by: '', byName: 'เจ้าของ' };
    const moved = save(['DB.stockCounts', 'sc1', { ...count, toCogs: [one] }]);
    assert.equal(await check('EMP008', moved), 'DB.stockCounts|sc1: toCogs');
    assert.equal(await check('owner', moved), null);
    await grant('EMP008', 'apv.count');
    assert.equal(await check('EMP008', moved), null);
    await put('DB.stockCounts', 'sc1', { ...count, toCogs: [one] });
    assert.equal(await check('owner', save(['DB.stockCounts', 'sc1', { ...count, toCogs: [] }])), 'DB.stockCounts|sc1: toCogs');
    assert.equal(await check('owner', save(['DB.stockCounts', 'sc1', { ...count, toCogs: [{ ...one, qty: 2 }] }])), 'DB.stockCounts|sc1: toCogs');
    assert.equal(await check('EMP008', save(['DB.stockCounts', 'sc1', { ...count, toCogs: [one, { ...one, qty: 1 }] }])), null);
  });
});

describe('ทุนของเกินจากการตรวจนับ (ผู้ทำบัญชี 4.2)', () => {
  test('อนุมัติใบตรวจนับที่มีของเกินได้เฉพาะผู้ที่เห็นทุน และต้องยืนยันทุนทุกรายการพร้อมหลักฐาน', async () => {
    const { check, put, grant } = await shop();
    const count = { id: 'sc1', no: 'MA-CT261000099', applied: false, items: [{ stockId: 's1', sysQty: 5, countedQty: 3 }, { stockId: 's2', sysQty: 1, countedQty: 2 }] };
    await put('DB.stockCounts', 'sc1', count);
    const items = [count.items[0], { ...count.items[1], surplusCost: 150 }];
    const surplus = { note: 'ใบกำกับภาษีที่ซื้อครั้งล่าสุด', date: '2026-10-13', by: '', byName: 'เจ้าของ' };
    const approved = save(['DB.stockCounts', 'sc1', { ...count, applied: true, items, surplus }]);
    assert.equal(await check('owner', approved), null);
    assert.equal(await check('owner', save(['DB.stockCounts', 'sc1', { ...count, applied: true }])), 'DB.stockCounts|sc1: surplus cost');
    assert.equal(await check('owner', save(['DB.stockCounts', 'sc1', { ...count, applied: true, items }])), 'DB.stockCounts|sc1: surplus cost');
    assert.equal(await check('owner', save(['DB.stockCounts', 'sc1', { ...count, applied: true, items, surplus: { ...surplus, note: ' ' } }])), 'DB.stockCounts|sc1: surplus cost');
    await grant('EMP008', 'apv.count');
    assert.equal(await check('EMP008', approved), 'DB.stockCounts|sc1: surplus cost');
    // Only a shortage: the approval needs no cost.
    const short = { ...count, id: 'sc2', no: 'MA-CT261000097', items: [count.items[0]] };
    await put('DB.stockCounts', 'sc2', short);
    assert.equal(await check('EMP008', save(['DB.stockCounts', 'sc2', { ...short, applied: true }])), null);
    await grant('EMP008', 'stock.cost');
    assert.equal(await check('EMP008', approved), null);
    // Saved already approved (sample data, a backup, an import): someone who sees costs.
    const fresh = { ...count, id: 'sc3', no: 'MA-CT261000096', applied: true };
    assert.equal(await check('owner', save(['DB.stockCounts', 'sc3', fresh])), null);
  });
  test('ผู้ที่ไม่เห็นทุนอนุมัติใบตรวจนับที่มีของเกินไม่ได้ แม้บันทึกและอนุมัติในคราวเดียว', async () => {
    const { check, grant } = await shop();
    await grant('EMP008', 'apv.count');
    const fresh = { id: 'sc3', no: 'MA-CT261000098', applied: true, items: [{ stockId: 's2', sysQty: 1, countedQty: 2 }] };
    assert.equal(await check('EMP008', save(['DB.stockCounts', 'sc3', fresh])), 'DB.stockCounts|sc3: surplus cost');
    assert.equal(await check('EMP008', save(['DB.stockCounts', 'sc3', { ...fresh, items: [{ stockId: 's2', sysQty: 2, countedQty: 1 }] }])), null);
  });
});

describe('ทุนของที่สาขาแฟรนไชส์รับจาก HQ (ผู้ทำบัญชี 4.2)', () => {
  const req = { id: 'r9', no: 'REQ-6910-0099', branchId: 'B001', status: 'shipped', costed: true,
    items: [{ code: 'EV-140', name: 'สายไฟ', unit: 'เมตร', qty: 10, apQty: 10, cost: 1250 }] };
  async function chain() {
    const { shopId } = await createShop(ownerPool, { code: `R-${++n}`, pkg: 'franchise', data: fixture('franchise-trial') });
    await asApp(shopId, c => c.query(`insert into records (shop_id, branch_id, unit, key, pos, data) values (app_shop(), '', 'FR.reqs', 'r9', 0, $1)`, [JSON.stringify(req)]));
    const actor = role => ({ pkg: 'franchise', role, ref: '', branch: role === 'HQ' ? '' : 'B001' });
    const check = (role, changes) => asApp(shopId, c => refuseRules(c, actor(role), '', 'franchise.v22', changes));
    return { shopId, check };
  }
  test('ทุนในใบเบิกเขียนได้เฉพาะ HQ สาขารับของหรือสร้างใบเบิกใหม่โดยไม่แตะทุนได้', async () => {
    const { check } = await chain();
    assert.equal(await check('HB', save(['FR.reqs', 'r9', { ...req, status: 'received' }])), null);
    assert.equal(await check('HB', save(['FR.reqs', 'r9', { ...req, items: [{ ...req.items[0], cost: 1 }] }])), 'FR.reqs|r9: cost');
    assert.equal(await check('HB', save(['FR.reqs', 'r9', { ...req, costed: false }])), 'FR.reqs|r9: cost');
    const fresh = { id: 'r10', no: 'REQ-6910-0100', branchId: 'B001', status: 'pending', items: [{ code: 'EN-501', qty: 5, apQty: 5 }] };
    assert.equal(await check('HB', save(['FR.reqs', 'r10', fresh])), null);
    assert.equal(await check('HB', save(['FR.reqs', 'r10', { ...fresh, items: [{ ...fresh.items[0], cost: 90 }] }])), 'FR.reqs|r10: cost');
    assert.equal(await check('HQ', save(['FR.reqs', 'r9', { ...req, items: [{ ...req.items[0], cost: 1300 }] }])), null);
  });
  test('server เติมทุนตามใบเบิกที่ HQ จัดส่งให้สาขาที่ไม่เห็นทุน: รายการเคลื่อนไหว ล็อต และทุนในทะเบียน', async () => {
    const { shopId } = await chain();
    const stock = { id: 's9', code: 'EV-140', name: 'สายไฟ', unit: 'เมตร', qty: 10, cost: null };
    const move = { id: 'm9', stockId: 's9', type: 'in', qty: 10, date: '2026-10-13', ref: 'รับสินค้าเติมสต๊อกจาก HQ (ใบเบิกแฟรนไชส์)', refNo: req.no, vendorId: '', cost: null };
    const lot = { id: 'l9', seq: 1, stockId: 's9', date: '2026-10-13', ref: move.ref, refNo: req.no, vendorId: '', src: 'in', cost: null, qty: 10, left: 10 };
    const out = await asApp(shopId, c => fillCosts(c, 'B001', save(['DB.stock', 's9', stock], ['DB.moves', 'm9', move], ['DB.fifo.lots', 'l9', lot])));
    const got = Object.fromEntries(out.upsert.map(r => [r.unit, JSON.parse(r.data)]));
    assert.equal(got['DB.moves'].cost, 1250);
    assert.equal(got['DB.fifo.lots'].cost, 1250);
    assert.equal(got['DB.stock'].cost, 1250);
  });
});

describe('เงินเดือน (งาน 3.7–3.9)', () => {
  const period = (id, month, more = {}) => ({ id, month, label: 'งวด', date: '2026-10-31', lines: [], totals: {}, ...more });
  test('บันทึกเงินเดือนต้องมีสิทธิ์บันทึกค่าใช้จ่ายและสิทธิ์ดูเงินเดือน เดือนหนึ่งมีงวดที่ใช้อยู่งวดเดียว', async () => {
    const { check, put } = await shop();
    assert.equal(await check('EMP008', save(['DB.payroll', 'p1', period('p1', '2026-10')])), 'DB.payroll|p1');
    assert.equal(await check('EMP005', save(['DB.payroll', 'p1', period('p1', '2026-10')])), 'DB.payroll|p1', 'no expense right');
    assert.equal(await check('EMP002', save(['DB.payroll', 'p1', period('p1', '2026-10')])), null);
    await put('DB.payroll', 'p1', period('p1', '2026-10'));
    assert.equal(await check('owner', save(['DB.payroll', 'p2', period('p2', '2026-10')])), 'DB.payroll|2026-10: recorded twice');
    assert.equal(await check('owner', save(['DB.payroll', 'p1', period('p1', '2026-10', { cancelled: true })], ['DB.payroll', 'p2', period('p2', '2026-10')])), null);
  });
});

describe('ค่าใช้จ่าย สินทรัพย์ เงินลงทุน (งาน 3.9)', () => {
  test('บันทึก แก้ ลบ ต้องมีสิทธิ์บันทึกค่าใช้จ่าย การจ่ายเงินไม่ต้อง ค่าใช้จ่ายของงวดเงินเดือนต้องมีสิทธิ์เงินเดือน', async () => {
    const { DB, check } = await shop();
    const x = DB.expenses[0], a = DB.assets[0], cap = DB.capital[0];
    assert.equal(await check('EMP008', save(['DB.expenses', x.id, { ...x, base: 1 }])), `DB.expenses|${x.id}`);
    assert.equal(await check('EMP008', save(['DB.expenses', 'x1', { ...x, id: 'x1', no: 'MA-EX261099999' }])), 'DB.expenses|x1');
    assert.equal(await check('EMP008', save(['DB.expenses', x.id, undefined])), `DB.expenses|${x.id}`);
    assert.equal(await check('EMP008', save(['DB.expenses', x.id, { ...x, paid: true, payDate: '2026-10-13', pvNo: 'MA-PV261000001' }])), null, 'paying');
    assert.equal(await check('EMP002', save(['DB.expenses', x.id, { ...x, base: 1 }])), null);
    const wage = { ...x, id: 'w1', no: 'MA-EX261099998', payroll: 'p1', payPart: 'pay' };
    assert.equal(await check('EMP002', save(['DB.expenses', 'w1', wage])), null);
    assert.equal(await check('EMP008', save(['DB.expenses', 'w1', wage])), 'DB.expenses|w1');
    assert.equal(await check('EMP008', save(['DB.assets', a.id, { ...a, cost: 1 }])), `DB.assets|${a.id}`);
    assert.equal(await check('EMP008', save(['DB.capital', cap.id, undefined])), `DB.capital|${cap.id}`);
    assert.equal(await check('EMP002', save(['DB.capital', cap.id, undefined])), null);
  });
});

describe('สินทรัพย์ (งาน 3.13)', () => {
  // A purchase on credit (62-assets.js): its first line holds the payments.
  const credit = (DB, extra = {}) => ({ ...DB.assets[0], id: 'fa1', no: 'MA-FA261000001', grp: 'fa1', date: '2026-10-05', vendorId: DB.vendors[0].id,
    term: 'credit', days: 30, due: '2026-11-04', payments: [], paid: false, ...extra });
  const pay = { id: 'p1', amt: 100, date: '2026-10-13', method: 'cash', by: 'x', pvNo: 'MA-PV261000001' };
  test('จ่ายค่าสินทรัพย์ค้างจ่ายต้องมีสิทธิ์จ่ายเงินเจ้าหนี้ บันทึกหรือแก้สินทรัพย์ต้องมีสิทธิ์บันทึกค่าใช้จ่าย สินทรัพย์ และเงินลงทุน', async () => {
    const { DB, check, put, grant } = await shop();
    const a = credit(DB);
    await put('DB.assets', 'fa1', a);
    const paid = { ...a, payments: [pay], payDate: '2026-10-13' };
    assert.equal(await check('EMP005', save(['DB.assets', 'fa1', paid])), 'DB.assets|fa1', 'no payGr');
    await grant('EMP005', 'doc.payGr');
    assert.equal(await check('EMP005', save(['DB.assets', 'fa1', paid])), null, 'paying');
    assert.equal(await check('EMP005', save(['DB.assets', 'fa1', { ...paid, life: 10 }])), 'DB.assets|fa1', 'not the asset itself');
    assert.equal(await check('EMP005', save(['DB.assets', 'fa2', { ...a, id: 'fa2' }])), 'DB.assets|fa2', 'not a new one');
    assert.equal(await check('EMP002', save(['DB.assets', 'fa1', { ...paid, life: 10 }])), null);
    // 4.4 records the certificate on a payment: open, as for an expense
    await put('DB.assets', 'fa1', paid);
    assert.equal(await check('EMP008', save(['DB.assets', 'fa1', { ...paid, payments: [{ ...pay, whtCertNo: 'MA-WH261000001' }] }])), null, 'certificate number');
    assert.equal(await check('EMP008', save(['DB.assets', 'fa1', { ...paid, payments: [{ ...pay, cancelled: true }] }])), 'DB.assets|fa1', 'voiding a payment');
    // marking it paid (nothing owed) without a payment is paying too
    await put('DB.assets', 'fa1', a);
    assert.equal(await check('EMP008', save(['DB.assets', 'fa1', { ...a, paid: true }])), 'DB.assets|fa1', 'paid flag');
    assert.equal(await check('EMP008', save(['DB.assets', 'fa1', { ...a, payDate: '2026-10-13' }])), 'DB.assets|fa1', 'pay date');
  });

  test('เดือนที่ปิดงวดแล้ว: สินทรัพย์ที่มี VAT จ่ายเงินและแก้อายุ ซาก สถานะได้ ช่องภาษี การยกเลิก และการลบไม่ได้', async () => {
    const { DB, check, put } = await shop();
    const a = credit(DB);
    await put('DB.assets', 'fa1', a);
    await put('DB.taxPeriods', '', { '2026-10': { closed: true, hist: [] } });
    assert.equal(await check('owner', save(['DB.assets', 'fa1', { ...a, payments: [pay] }])), null, 'paying');
    assert.equal(await check('owner', save(['DB.assets', 'fa1', { ...a, life: 10, salvage: 100, status: 'sold', out: '2026-10-20' }])), null, 'life, salvage, status');
    for (const [k, v] of [['cost', 1], ['vendorId', DB.vendors[1].id], ['inv', 'X'], ['date', '2026-10-06'], ['cancelled', true]])
      assert.equal(await check('owner', save(['DB.assets', 'fa1', { ...a, [k]: v }])), 'DB.assets|fa1: tax period closed', k);
    assert.equal(await check('owner', save(['DB.assets', 'fa1', undefined])), 'DB.assets|fa1: tax period closed');
    assert.equal(await check('owner', save(['DB.assets', 'fa9', { ...a, id: 'fa9' }])), 'DB.assets|fa9: tax period closed');
    assert.equal(await check('owner', save(['DB.assets', 'fa1', { ...a, vat: 0, cost: 1 }])), 'DB.assets|fa1: tax period closed', 'had VAT');
  });
});

describe('ยกเลิกเอกสารการเงิน (งาน 3.9)', () => {
  test('ยกเลิกการขาย การรับเงิน ใบรับสินค้า ต้องมีสิทธิ์ยกเลิกของเอกสารนั้น', async () => {
    const { DB, check } = await shop();
    const cut = DB.stockCuts.find(x => x.no === 'MA-SA261000003');
    assert.equal(await check('EMP008', save(['DB.stockCuts', cut.id, { ...cut, cancelled: true }])), `DB.stockCuts|${cut.id}: cancel`);
    assert.equal(await check('EMP001', save(['DB.stockCuts', cut.id, { ...cut, cancelled: true }])), null);
    const r = DB.receipts.find(x => (x.payments || []).length);
    const voided = { ...r, payments: r.payments.map((p, i) => i ? p : { ...p, cancelled: true }) };
    assert.equal(await check('EMP003', save(['DB.receipts', r.id, voided])), `DB.receipts|${r.id}: cancel`);
    assert.equal(await check('EMP008', save(['DB.receipts', r.id, voided])), null, 'รับชำระได้ ยกเลิกการรับเงินได้');
    assert.equal(await check('EMP003', save(['DB.receipts', r.id, { ...r, cancelled: true }])), `DB.receipts|${r.id}: cancel`);
    assert.equal(await check('EMP004', save(['DB.receipts', r.id, { ...r, cancelled: true }])), null);
    const gr = DB.purchases[0];
    assert.equal(await check('EMP002', save(['DB.purchases', gr.id, { ...gr, cancelled: true }])), `DB.purchases|${gr.id}: cancel`);
    assert.equal(await check('EMP004', save(['DB.purchases', gr.id, { ...gr, cancelled: true }])), null);
  });
});

describe('ข้อมูลพนักงานและงานบุคคล (งาน 3.9)', () => {
  test('แก้ข้อมูลพนักงานต้องมีสิทธิ์ดูและแก้ไขข้อมูลพนักงาน ใบลาและใบเตือนต้องมีสิทธิ์งานบุคคล', async () => {
    const { DB, emp, check } = await shop();
    const self = emp('EMP008'), other = emp('EMP001');
    assert.equal(await check('EMP008', save(['DB.emp', self.id, { ...self, salary: 99999 }])), `DB.emp|${self.id}`);
    assert.equal(await check('EMP008', save(['DB.emp', other.id, { ...other, position: 'ผู้จัดการ' }])), `DB.emp|${other.id}`);
    assert.equal(await check('EMP008', save(['DB.emp', 'e1', { ...other, id: 'e1', code: 'EMP099' }])), 'DB.emp|e1');
    assert.equal(await check('EMP004', save(['DB.emp', other.id, { ...other, salary: 30000 }])), null);
    assert.equal(await check('EMP008', save(['DB.emp', other.id, { ...other, cert50: { 2026: 'MA-WH261000001' } }])), `DB.emp|${other.id}`);
    assert.equal(await check('EMP002', save(['DB.emp', other.id, { ...other, cert50: { 2026: 'MA-WH261000001' } }])), null, 'พิมพ์ 50 ทวิ');
    const h = DB.hr[0];
    assert.equal(await check('EMP008', save(['DB.hr', h.id, { ...h, note: 'x' }])), `DB.hr|${h.id}`);
    assert.equal(await check('EMP004', save(['DB.hr', h.id, { ...h, note: 'x' }])), null);
  });
});

describe('ตั้งค่าองค์กรและผังบัญชี (งาน 3.9)', () => {
  test('ตั้งค่าองค์กร สาขา ผังบัญชี ต้องมีสิทธิ์ของแต่ละเรื่อง', async () => {
    const { DB, check } = await shop();
    assert.equal(await check('EMP008', save(['DB.shop', '', { ...DB.shop, vatReg: false }])), 'DB.shop: vatReg');
    assert.equal(await check('EMP008', save(['DB.shop', '', { ...DB.shop, ssoOwn: { from: '2026-10', max: 15000 } }])), 'DB.shop: ssoOwn');
    assert.equal(await check('EMP008', save(['DB.shop', '', { ...DB.shop, logo: 'data:image/png;base64,' }])), null, 'logo');
    assert.equal(await check('EMP004', save(['DB.shop', '', { ...DB.shop, vatReg: false }])), null);
    const b = DB.branches[0];
    assert.equal(await check('EMP008', save(['DB.branches', 'b2', { ...b, id: 'b2', code: 'BN' }])), 'DB.branches|b2');
    assert.equal(await check('EMP004', save(['DB.branches', 'b2', { ...b, id: 'b2', code: 'BN' }])), null);
    const acc = DB.coa[0];
    assert.equal(await check('EMP008', save(['DB.coa', acc.code, { ...acc, name: 'x' }])), `DB.coa|${acc.code}`);
    assert.equal(await check('EMP008', save(['DB.map', '', { ...DB.map, sale: '9999' }])), 'DB.map');
    assert.equal(await check('EMP004', save(['DB.coa', acc.code, { ...acc, name: 'x' }])), null);
  });
});
