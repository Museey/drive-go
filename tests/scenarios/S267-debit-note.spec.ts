import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (owner's decision 2026-11-06, NOTES.md "งานบัญชีที่ค้าง" 3, in place of T11-ก): debit notes
// ("ใบเพิ่มหนี้"), made like credit notes. The owner issues one on an unpaid sale whose price was worked out too low:
// it takes effect at once, raises what the customer owes, prints with the original tax invoice, the right value and
// the difference, and adds its VAT to the sales tax of its month. Cancelling it takes everything back.
const form = (page: Page) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: /ใบเพิ่มหนี้/ }) });
const salesVat = (page: Page) => page.getByRole('row', { name: /^ภาษีขาย / });
async function taxReport(page: Page) {
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
}

test('S267 ระบบใหม่: ใบเพิ่มหนี้ เพิ่มยอดค้างชำระ พิมพ์อ้างอิงใบกำกับเดิม ภาษีขายเพิ่มในเดือนที่ออก และยกเลิกได้', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const cut = (db: any) => db.stockCuts.find((c: any) => c.no === 'MA-SA261000003');

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await page.getByRole('button', { name: '+ ออกใบเพิ่มหนี้' }).click();
  await form(page).getByLabel('ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า').fill('MA-SA261000003');
  await form(page).getByRole('row').filter({ hasText: 'MA-SA261000003' }).getByRole('button', { name: 'เลือก' }).click();
  await expect(form(page).getByRole('heading', { name: 'ออกใบเพิ่มหนี้ · ใบตัดสต็อก MA-SA261000003' })).toBeVisible();
  await form(page).getByLabel('กรณี').selectOption('คำนวณราคาผิดพลาดต่ำกว่าที่เป็นจริง');
  await form(page).getByLabel('มูลค่าที่เพิ่ม (ก่อน VAT)').fill('1000');
  await form(page).getByLabel('เหตุผล (ต้องกรอก)').fill('คิดค่าแรงขาดไป 1 ชั่วโมง');
  await expect(form(page).getByRole('row', { name: /^ภาษีมูลค่าเพิ่ม 7%/ })).toContainText('70.00');
  await expect(form(page).getByRole('row', { name: /^รวมใบเพิ่มหนี้/ })).toContainText('1,070.00');
  await expect(form(page).getByRole('row', { name: /^ยอดค้างชำระเพิ่มขึ้น/ })).toContainText('1,070.00');
  await form(page).getByRole('button', { name: 'บันทึกใบเพิ่มหนี้' }).click();
  await expect(form(page).getByRole('heading', { name: 'ใบเพิ่มหนี้ MA-DN261000001' })).toBeVisible();
  await expect(form(page).getByText('อนุมัติแล้ว', { exact: true })).toBeVisible();
  await app.settle();
  let db = (await app.state()).DB;
  expect(db.creditNotes).toEqual([expect.objectContaining({ type: 'debit', no: 'MA-DN261000001', date: '2026-10-13', saleNo: 'MA-SA261000003', kind: 'calc',
    reason: 'คิดค่าแรงขาดไป 1 ชั่วโมง', rate: 7, base: 1000, vat: 70, gross: 1070, lines: [], ref: { no: 'MA-SA261000003', date: '2026-10-10', base: 9265 },
    apv: expect.objectContaining({ status: 'approved' }), money: { increase: 1070 } })]);
  expect(cut(db).st).toMatchObject({ rem: 10983.55 });
  expect(db.receipts.find((r: any) => r.no === 'MA-SA261000003').adj).toEqual([expect.objectContaining({ type: 'up', amt: 1070, cn: 'MA-DN261000001' })]);
  expect(db.audit.at(-1)).toMatchObject({ kind: 'stockcut', act: 'debitnote',
    note: 'ใบเพิ่มหนี้ MA-DN261000001 · คำนวณราคาผิดพลาดต่ำกว่าที่เป็นจริง · 1,070.00 บาท — คิดค่าแรงขาดไป 1 ชั่วโมง' });

  // Printed: what the Revenue Code asks of a debit note.
  await form(page).getByRole('button', { name: 'พิมพ์ใบเพิ่มหนี้ (ต้นฉบับ + สำเนา)' }).click();
  const sheet = page.locator('#printStage');
  for (const t of ['ใบเพิ่มหนี้', 'DEBIT NOTE', 'MA-DN261000001', 'มูลค่าสินค้าหรือบริการตามใบกำกับภาษีเดิม', '9,265.00', 'มูลค่าที่ถูกต้อง', '10,265.00', 'ผลต่าง',
    'เหตุผลที่เพิ่มหนี้', 'คำนวณราคาผิดพลาดต่ำกว่าที่เป็นจริง — คิดค่าแรงขาดไป 1 ชั่วโมง', 'ผู้ออกใบเพิ่มหนี้'])
    await expect(sheet).toContainText(t);
  await form(page).getByRole('button', { name: 'ปิด' }).click();

  // The sales tax report of October adds it.
  await taxReport(page);
  await expect(salesVat(page)).toContainText('3,701.95');   // 3,631.95 + 70.00

  // Cancelled by the owner with a reason: what is owed and the sales tax are back.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ใบเพิ่มหนี้ MA-DN261000001' }).click();
  await form(page).getByRole('button', { name: 'ยกเลิกใบเพิ่มหนี้' }).click();
  await expect(page.getByText(/ยอดค้างชำระของลูกค้าลดลงตามใบเพิ่มหนี้นี้/)).toBeVisible();
  await page.getByText('ระบุเหตุผลที่ยกเลิก (จำเป็น)').locator('..').getByRole('textbox').fill('ลูกค้าไม่ยอมรับ');
  await page.getByRole('button', { name: 'ยืนยันยกเลิกใบเพิ่มหนี้', exact: true }).click();
  await expect(page.getByText('ยกเลิกใบเพิ่มหนี้ MA-DN261000001 แล้ว', { exact: true })).toBeVisible();
  await app.settle();
  db = (await app.state()).DB;
  expect(cut(db).st).toMatchObject({ rem: 9913.55 });
  expect(db.creditNotes[0].voided).toMatchObject({ reason: 'ลูกค้าไม่ยอมรับ' });
  expect(db.audit.at(-1)).toMatchObject({ act: 'dnvoid', note: 'ยกเลิกใบเพิ่มหนี้ MA-DN261000001 · 1,070.00 บาท — ลูกค้าไม่ยอมรับ' });
  await form(page).getByRole('button', { name: 'ปิด' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await taxReport(page);
  await expect(salesVat(page)).toContainText('3,631.95');

  // The register on 4.6 lists it, cancelled, and exports to Excel.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  const reg = page.locator('#cnRegPanel');
  await expect(reg.getByText('ทะเบียนใบลดหนี้ / ใบเพิ่มหนี้', { exact: true })).toBeVisible();
  const line = reg.getByRole('row').filter({ hasText: 'MA-DN261000001' });
  for (const t of ['13/10/2569', 'ใบเพิ่มหนี้', 'MA-SA261000003', 'คำนวณราคาผิดพลาดต่ำกว่าที่เป็นจริง', '1,000.00', '70.00', '1,070.00', 'ยกเลิกแล้ว'])
    await expect(line).toContainText(t);
  await expect(line.getByRole('button', { name: 'พิมพ์' })).toHaveCount(0);
  const download = page.waitForEvent('download');
  await reg.getByRole('button', { name: 'ส่งออก Excel' }).click();
  const file = readFileSync(await (await download).path(), 'utf8');   // the workbook's parts are stored, not compressed
  for (const t of ['ทะเบียนใบลดหนี้ / ใบเพิ่มหนี้', 'MA-DN261000001', 'ใบเพิ่มหนี้', 'ยกเลิกแล้ว']) expect(file).toContain(t);
});
