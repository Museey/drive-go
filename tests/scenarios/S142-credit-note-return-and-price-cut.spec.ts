import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.3, decisions F2, T6–T9): sales credit notes. The owner
// issues one for goods a customer brings back from a paid sale (stock comes
// back at the lot's cost, the money is paid back in cash) and one for a price
// cut on an unpaid sale (what is owed goes down). Each takes effect at once,
// prints as "ใบลดหนี้", lowers the sales tax of the month it is made in, leaves
// the sale's own tax invoice as it was, and a sale with a credit note can no
// longer be cancelled. The legacy app has no sales credit notes.
// The credit note window: headed "ออกใบลดหนี้ · …" while it is made, "ใบลดหนี้ <no>" once saved.
const form = (page: Page) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: /ใบลดหนี้/ }) });

async function newCreditNote(page: Page, saleNo: string) {
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await page.getByRole('button', { name: '+ ออกใบลดหนี้' }).click();
  await form(page).getByLabel('ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า').fill(saleNo);
  await form(page).getByRole('row').filter({ hasText: saleNo }).getByRole('button', { name: 'เลือก' }).click();
  await expect(form(page).getByRole('heading', { name: 'ออกใบลดหนี้ · ใบตัดสต็อก ' + saleNo })).toBeVisible();
}
async function openSale(page: Page, no: string) {
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('combobox', { name: 'ช่วงวันที่' }).filter({ visible: true }).selectOption('เลือกทั้งหมด');
  await page.getByText(no, { exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'ใบตัดสต็อกขายสินค้า ' + no })).toBeVisible();
}

test('S142 ระบบใหม่: ใบลดหนี้ ลูกค้าคืนสินค้าจากบิลที่ชำระแล้ว (คืนสต๊อก คืนเงินสด) และลดราคาบิลที่ค้างชำระ (ลดยอดค้าง) รายงานภาษีขายลดในเดือนที่ออก', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const start = (await app.state()).DB;
  const stockQty = (db: any, code: string) => db.stock.find((s: any) => s.code === code).qty;

  // A paid sale with a full tax invoice: one brake pad set comes back unused. Credit notes start on 4.6.
  await newCreditNote(page, 'MA-SA261000010');
  await expect(form(page).getByLabel('กรณี')).toHaveValue('ret');
  await form(page).getByRole('spinbutton', { name: 'จำนวนที่คืน BR-001' }).fill('1');
  await expect(form(page).getByLabel('สินค้าที่คืน BR-001')).toHaveValue('back');
  await form(page).getByLabel('เหตุผล (ต้องกรอก)').fill('ลูกค้านำผ้าเบรกที่ยังไม่ได้ใช้มาคืน');
  await expect(form(page).getByRole('row', { name: /^มูลค่าที่ลด \(ก่อน VAT\)/ })).toContainText('1,380.00');
  await expect(form(page).getByRole('row', { name: /^ภาษีมูลค่าเพิ่ม 7%/ })).toContainText('96.60');
  await expect(form(page).getByRole('row', { name: /^รวมใบลดหนี้/ })).toContainText('1,476.60');
  await expect(form(page).getByRole('row', { name: /^ลดยอดค้างชำระ/ })).toContainText('0.00');
  await expect(form(page).getByRole('row', { name: /^คืนเงินให้ลูกค้า/ })).toContainText('1,476.60');
  await expect(form(page).getByLabel('คืนเงินโดย')).toHaveValue('cash');
  await form(page).getByRole('button', { name: 'บันทึกใบลดหนี้' }).click();
  await expect(form(page).getByRole('heading', { name: 'ใบลดหนี้ MA-CN261000001' })).toBeVisible();
  await expect(form(page).getByText('อนุมัติแล้ว', { exact: true })).toBeVisible();
  await app.settle();
  let db = (await app.state()).DB, before;
  expect(db.creditNotes).toEqual([expect.objectContaining({ no: 'MA-CN261000001', date: '2026-10-13', saleNo: 'MA-SA261000010', kind: 'ret',
    reason: 'ลูกค้านำผ้าเบรกที่ยังไม่ได้ใช้มาคืน', rate: 7, base: 1380, vat: 96.6, gross: 1476.6, method: 'cash',
    lines: [expect.objectContaining({ code: 'BR-001', qty: 1, price: 1380, stock: 'back' })],
    ref: { no: 'MA-TX261000003', date: '2026-10-13', base: 2380 },
    apv: expect.objectContaining({ status: 'approved', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' }),
    money: { reduce: 0, refund: 1476.6, method: 'cash' } })]);
  expect(stockQty(db, 'BR-001')).toBe(stockQty(start, 'BR-001') + 1);
  expect(db.moves.at(-1)).toMatchObject({ type: 'in', qty: 1, ref: 'รับคืนตามใบลดหนี้ MA-CN261000001 · ใบตัดสต็อก MA-SA261000010', refNo: 'MA-SA261000010' });
  const sale = db.receipts.find((r: any) => r.no === 'MA-SA261000010');
  expect(sale.adj).toEqual([expect.objectContaining({ type: 'down', amt: 1476.6, cn: 'MA-CN261000001' })]);
  expect(sale.taxDocs).toEqual(start.receipts.find((r: any) => r.no === 'MA-SA261000010').taxDocs);   // the tax invoice stays as issued
  expect(sale.payments).toEqual(start.receipts.find((r: any) => r.no === 'MA-SA261000010').payments);
  expect(db.audit.at(-1)).toMatchObject({ kind: 'stockcut', act: 'creditnote',
    note: 'ใบลดหนี้ MA-CN261000001 · ลูกค้าคืนสินค้า · 1,476.60 บาท · คืนเงินลูกค้า 1,476.60 บาท (เงินสด) — ลูกค้านำผ้าเบรกที่ยังไม่ได้ใช้มาคืน' });

  // The printed credit note says what the Revenue Code asks of one.
  await form(page).getByRole('button', { name: 'พิมพ์ใบลดหนี้ (ต้นฉบับ + สำเนา)' }).click();
  await page.emulateMedia({ media: 'print' });
  for (const text of ['ใบลดหนี้', 'มูลค่าสินค้าหรือบริการตามใบกำกับภาษีเดิม', 'มูลค่าที่ถูกต้อง', 'ผลต่าง', 'ลูกค้าคืนสินค้า — ลูกค้านำผ้าเบรกที่ยังไม่ได้ใช้มาคืน'])
    await expect(page.getByText(text, { exact: true }).filter({ visible: true })).toHaveCount(2);
  await page.emulateMedia({ media: 'screen' });
  await form(page).getByRole('button', { name: 'ปิด' }).click();

  // The sale lists its credit note.
  await openSale(page, 'MA-SA261000010');
  await expect(page.getByRole('button', { name: 'ใบลดหนี้ MA-CN261000001' })).toBeVisible();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // An unpaid sale: a price cut of 500.00 before VAT lowers what is owed.
  await newCreditNote(page, 'MA-SA261000003');
  await form(page).getByLabel('กรณี').selectOption('ลดราคาหลังขาย');
  await form(page).getByLabel('มูลค่าที่ลด (ก่อน VAT)').fill('500');
  await form(page).getByLabel('เหตุผล (ต้องกรอก)').fill('งานติดตั้งล่าช้ากว่าที่ตกลง ลดราคาให้ลูกค้า');
  await expect(form(page).getByRole('row', { name: /^ลดยอดค้างชำระ/ })).toContainText('535.00');
  await expect(form(page).getByRole('row', { name: /^คืนเงินให้ลูกค้า/ })).toContainText('0.00');
  await expect(form(page).getByLabel('คืนเงินโดย')).toBeHidden();
  await form(page).getByRole('button', { name: 'บันทึกใบลดหนี้' }).click();
  await expect(form(page).getByRole('heading', { name: 'ใบลดหนี้ MA-CN261000002' })).toBeVisible();
  await app.settle();
  db = (await app.state()).DB;
  expect(db.creditNotes[1]).toMatchObject({ no: 'MA-CN261000002', kind: 'disc', base: 500, vat: 35, gross: 535, lines: [], method: '',
    ref: { no: 'MA-SA261000003', date: '2026-10-10', base: 9265 }, money: { reduce: 535, refund: 0, method: '' } });
  const owed = db.stockCuts.find((c: any) => c.no === 'MA-SA261000003');
  expect(owed.st).toMatchObject({ k: 'wait', rem: 9378.55 });
  await form(page).getByRole('button', { name: 'ปิด' }).click();

  // A sale with a credit note can no longer be cancelled (that would take back what the credit note did).
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  before = (await app.state()).DB;
  await page.getByRole('button', { name: 'ยกเลิกเอกสาร', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('ใบตัดสต็อก MA-SA261000003 มีใบลดหนี้ MA-CN261000002 แล้ว — ยกเลิกหรือทำฉบับแก้ไขไม่ได้ ใช้ใบลดหนี้แทน', { exact: true })).toBeVisible();
  await app.settle();
  expect((await app.state()).DB).toEqual(before);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The sales tax report of October: both credit notes take their VAT off this month; the sales stay as filed.
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
  const report = page.locator('div').filter({ has: page.getByRole('heading', { name: 'รายงานภาษีขาย' }) }).filter({ has: page.getByRole('table') }).last();
  await report.getByRole('button', { name: '›', exact: true }).click();
  await expect(report.getByRole('row').filter({ hasText: 'MA-CN261000001' })).toContainText('-1,380.00');
  await expect(report.getByRole('row').filter({ hasText: 'MA-CN261000001' })).toContainText('-96.60');
  await expect(report.getByRole('row').filter({ hasText: 'MA-CN261000002' })).toContainText('-35.00');
  await expect(page.getByRole('row', { name: /^ภาษีขาย / })).toContainText('3,500.35');   // 3,631.95 before − 96.60 − 35.00
});
