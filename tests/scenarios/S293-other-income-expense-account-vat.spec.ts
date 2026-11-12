import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant round 3, J28; the owner's decisions of 2026-11-11 and 2026-11-12, docs/ACCOUNTANT-ANSWERS.md):
// other income and other expenses of 08 → เงินลงทุน / เงินสด are in the profit and loss, on an account the shop picks
// (4030 / 6190 first), and may carry VAT. Other income of 10,700.00 with VAT (scrap metal sold to บริษัท ขนส่งไทยรุ่งเรือง
// จำกัด): a tax invoice / receipt MA-TX… for 10,000.00 + 700.00, in the sales tax report, and the entry cannot be changed.
// Other expenses of 5,350.00 with VAT on 6050 (the vendor's tax invoice number is needed): 5,000.00 + 350.00 in the
// purchase tax report. The statements have a row per account before the net profit (the trial data's 25,000.00 of
// 12/02/2569 and 18,000.00 of 18/05/2569 too), and so do the trial balance and the general ledger.
const money = (t: string | null) => Number(String(t).replace(/[^\d.-]/g, ''));
async function go(page: Page, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await sub.click();
}
async function recordPrints(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__printed = [];
    window.print = () => { window.dispatchEvent(new Event('beforeprint')); w.__printed.push(document.title); window.dispatchEvent(new Event('afterprint')); };
  });
}
const form = (page: Page) => page.locator('#mCap');

test('S293 ระบบใหม่: รายรับอื่นและรายจ่ายอื่นในเมนูเงินลงทุน เลือกบัญชี มี VAT ใบกำกับภาษี รายงานภาษีซื้อขาย งบการเงิน งบทดลอง และบัญชีแยกประเภท', async ({ app, page }) => {
  test.slow();
  await recordPrints(page);
  await app.loginAsOwner();
  await go(page, '└ เงินลงทุน / เงินสด');

  // Other income with VAT: the buyer from the customer register, a tax invoice on saving.
  await page.getByRole('button', { name: '+ บันทึกรายการ' }).click();
  await form(page).getByLabel('ประเภทรายการ *').selectOption('other_in');
  await expect(form(page).getByLabel('บัญชี', { exact: true })).toHaveValue('4030');
  await form(page).getByLabel('จำนวนเงิน (บาท) *').fill('10700');
  await form(page).getByLabel('รายละเอียด').fill('ขายเศษเหล็กและแบตเตอรี่เก่า');
  await form(page).getByLabel('มี VAT (รวมอยู่ในจำนวนเงิน)').check();
  await form(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText('เลือกผู้ซื้อจากทะเบียนลูกค้า — รายรับที่มี VAT ต้องออกใบกำกับภาษีที่มีชื่อ ที่อยู่ และเลขประจำตัวผู้เสียภาษีของผู้ซื้อ')).toBeVisible();
  await form(page).getByLabel('ผู้ซื้อ (ลูกค้าในทะเบียน)').fill('บริษัท ขนส่งไทยรุ่งเรือง จำกัด');
  await form(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__printed.length)).toBe(1);
  let db = (await app.state()).DB;
  const inc = db.capital.find((x: any) => x.note === 'ขายเศษเหล็กและแบตเตอรี่เก่า');
  expect(inc).toMatchObject({ type: 'other_in', amt: 10700, acc: '4030', rate: 7, base: 10000, vat: 700, buyer: 'บริษัท ขนส่งไทยรุ่งเรือง จำกัด', buyerTax: '0105561234567' });
  const taxNo: string = inc.taxNo;
  expect(taxNo).toMatch(/^MA-TX2610\d{5}$/);
  for (const t of ['ใบกำกับภาษี / ใบเสร็จรับเงิน', taxNo, 'บริษัท ขนส่งไทยรุ่งเรือง จำกัด', '0105561234567', 'ขายเศษเหล็กและแบตเตอรี่เก่า', '10,000.00', '700.00', '10,700.00'])
    await expect(page.locator('#printStage')).toContainText(t);
  const row = page.locator('#capTbl').getByRole('row').filter({ hasText: 'ขายเศษเหล็กและแบตเตอรี่เก่า' });
  await expect(row).toContainText(`4030 รายได้อื่น · VAT 7% 700.00 บาท · ใบกำกับภาษี ${taxNo} · บริษัท ขนส่งไทยรุ่งเรือง จำกัด`);
  // Issued: it cannot be changed.
  await row.getByRole('button', { name: 'แก้ไข' }).click();
  await expect(form(page).getByText(`ออกใบกำกับภาษี ${taxNo} แล้ว — แก้ไขหรือลบรายการไม่ได้`)).toBeVisible();
  await form(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText(`รายการนี้ออกใบกำกับภาษี ${taxNo} แล้ว — แก้ไขหรือลบไม่ได้`)).toBeVisible();
  await form(page).getByRole('contentinfo').getByRole('button', { name: 'ปิด', exact: true }).click();

  // Other expenses with VAT on 6050: the vendor's tax invoice number is needed.
  await page.getByRole('button', { name: '+ บันทึกรายการ' }).click();
  await form(page).getByLabel('ประเภทรายการ *').selectOption('other_out');
  await expect(form(page).getByLabel('บัญชี', { exact: true })).toHaveValue('6190');
  await form(page).getByLabel('บัญชี', { exact: true }).selectOption('6050');
  await form(page).getByLabel('จำนวนเงิน (บาท) *').fill('5350');
  await form(page).getByLabel('รายละเอียด').fill('ซ่อมหลังคาโรงซ่อม');
  await form(page).getByLabel('มี VAT (รวมอยู่ในจำนวนเงิน)').check();
  await form(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText('ใส่เลขที่ใบกำกับภาษีของผู้ขายก่อน')).toBeVisible();
  await form(page).getByLabel('เลขที่ใบกำกับภาษีของผู้ขาย *').fill('IV-6911-889');
  await form(page).getByLabel('ผู้ขาย', { exact: true }).fill('ร้านวัสดุก่อสร้างรุ่งเรือง');
  await form(page).getByLabel('เลขประจำตัวผู้เสียภาษีของผู้ขาย').fill('0105555012345');
  await form(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.locator('#capTbl').getByRole('row').filter({ hasText: 'ซ่อมหลังคาโรงซ่อม' }))
    .toContainText('6050 ค่าซ่อมแซมและบำรุงรักษา · VAT 7% 350.00 บาท · ใบกำกับภาษีผู้ขาย IV-6911-889 · ร้านวัสดุก่อสร้างรุ่งเรือง');
  db = (await app.state()).DB;
  expect(db.capital.find((x: any) => x.note === 'ซ่อมหลังคาโรงซ่อม')).toMatchObject({ type: 'other_out', amt: 5350, acc: '6050', base: 5000, vat: 350, inv: 'IV-6911-889' });

  // The tax reports of October.
  await go(page, '└ รายงานภาษี');
  // The month's sales tax: 3,631.95 of the sales and 700.00 (the sales tax list shows ten invoices a page).
  await expect(page.locator('#taxSumTbl').getByRole('row', { name: /^ภาษีขาย / })).toContainText('4,331.95');
  await expect(page.locator('#taxSumTbl').getByRole('row', { name: /^ภาษีซื้อ / })).toContainText('350.00');
  await expect(page.getByRole('row').filter({ hasText: 'IV-6911-889' }).filter({ visible: true }).first()).toContainText('350.00');

  // The statements: a row per account before the net profit.
  await go(page, '└ งบการเงิน');
  const pl = page.locator('#plTbl');
  const val = async (label: string) => money(await pl.getByRole('row').filter({ hasText: label }).getByRole('cell').last().textContent());
  expect(await val('4030 บวก รายได้อื่น (รายรับอื่น ๆ)')).toBe(35000);
  expect(await val('6050 หัก ค่าซ่อมแซมและบำรุงรักษา (รายจ่ายอื่น ๆ)')).toBe(5000);
  expect(await val('6190 หัก ค่าใช้จ่ายเบ็ดเตล็ด (รายจ่ายอื่น ๆ)')).toBe(18000);

  // The general ledger: the tax invoice on 4030 and 2030, the vendor's invoice on 6050 and 1050.
  await go(page, '└ บัญชีแยกประเภท');
  const ledger = page.locator('#a-ledger');
  for (const [code, no, dr, cr] of [['4030', taxNo, '', '10,000.00'], ['2030', taxNo, '', '700.00'], ['6050', 'IV-6911-889', '5,000.00', ''], ['1050', 'IV-6911-889', '350.00', '']]) {
    await ledger.getByLabel('บัญชี', { exact: true }).selectOption(code);
    const cells = ledger.getByRole('row').filter({ hasText: no }).getByRole('cell');
    await expect(cells.nth(3)).toHaveText(dr);
    await expect(cells.nth(4)).toHaveText(cr);
  }
  expect(await page.evaluate(() => (window as any).PKG_LEDGER.check().length)).toBe(0);
});
