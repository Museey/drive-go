import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant review 3.2, the owner's decision of 2026-10-28 to follow accountant B and the owner's answers
// of the same day, docs/ACCOUNTANT-ANSWERS.md): the card fee the shop charges its customer (S153: 3% on 7,276.00 =
// 218.28) is income of the shop, VAT included at the sale's rate: 218.28 × 7/107 = 14.28 output VAT and 204.00 other
// income (4030), all of it money received, on the day it was paid. The sale itself does not change. Which document is
// the fee's tax invoice waits for the accountant: the tax report adds it to the month's figures and says so on a line.
const num = (s: string | null) => Number(String(s).replace(/[^\d.-]/g, ''));
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const cellOf = async (page: Page, table: string, label: string | RegExp) => {
  const row = page.locator(table).getByRole('row').filter({ has: page.getByRole('cell', { name: label, exact: true }) });
  return (await row.count()) ? num(await row.getByRole('cell').last().textContent()) : null;
};
async function figures(page: Page) {
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  const home = {
    base: await cellOf(page, '#taxTbl', 'ยอดขาย / รายได้ก่อน VAT'),
    vat: await cellOf(page, '#taxTbl', 'ภาษีขาย (VAT จากใบกำกับภาษีที่ออก)'),
    pay: await cellOf(page, '#taxTbl', 'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30)'),
  };
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await expect(page.locator('#taxSumTbl').getByRole('row').first()).toBeVisible();
  const tax = {
    base: await cellOf(page, '#taxSumTbl', 'ยอดขายที่ต้องเสียภาษี (ก่อน VAT)'),
    vat: await cellOf(page, '#taxSumTbl', 'ภาษีขาย'),
    buy: await cellOf(page, '#taxSumTbl', 'ภาษีซื้อ'),
    pay: await cellOf(page, '#taxSumTbl', 'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30) ภายในวันที่ 15 ของเดือนถัดไป'),
  };
  await go(page, /^08 บัญชี/, '└ งบการเงิน');
  await expect(page.locator('#plTbl').getByRole('row').first()).toBeVisible();
  const fs = {
    fee: await cellOf(page, '#plTbl', '4030 บวก รายได้อื่น (ค่าธรรมเนียมบัตรที่เรียกเก็บจากลูกค้า)'),
    np: await cellOf(page, '#plTbl', 'กำไร (ขาดทุน) สุทธิก่อนภาษี'),
    revenue: await cellOf(page, '#plTbl', /รายได้จากการขายและบริการ$/),
    cash: await cellOf(page, '#bsTbl', 'เงินสดและเงินฝากธนาคาร (ประมาณการ)'),
    ar: await cellOf(page, '#bsTbl', 'ลูกหนี้การค้า'),
    equity: await cellOf(page, '#bsTbl', 'ส่วนของเจ้าของ (ทุน + กำไรสะสม)'),
    cashIn: await cellOf(page, '#cfTbl', 'เงินสดรับจากลูกค้า'),
  };
  await go(page, /^08 บัญชี/, '└ ผังบัญชี');
  const credit = async (code: string) => {
    const row = page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: code, exact: true }) });
    return (await row.count()) ? num(await row.getByRole('cell').last().textContent()) : 0;
  };
  const tb = { other: await credit('4030'), vatOut: await credit('2030') };
  await go(page, /^08 บัญชี/, '└ สุขภาพการเงิน');
  const oct = (await page.locator('#pnlMonthTbl').getByRole('row').filter({ hasText: 'ต.ค. 69' }).getByRole('cell').allTextContents()).map(num);
  return { home, tax, fs, tb, oct };
}

test('S255 ระบบใหม่: ค่าธรรมเนียมบัตรที่เรียกเก็บจากลูกค้าเป็นรายได้อื่นที่มี VAT รวมอยู่ รายงานภาษีนับภาษีขาย งบกำไรขาดทุนมีบรรทัดรายได้อื่น งบทดลองลง 4030 และ 2030', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const before = await figures(page);
  expect(before.fs.fee).toBeNull();
  await expect(page.locator('#taxSumTbl').getByText(/^รวมค่าธรรมเนียมบัตร/)).toHaveCount(0);

  // S153's card payment: 7,276.00 for the sale + 3% = 218.28 card fee.
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000013' }).filter({ visible: true });
  await row.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await page.getByRole('button', { name: 'บัตร แตะเพื่อเพิ่ม' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ยอดที่เหลือ' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'ธนาคาร / ผู้ให้บริการบัตร' }).filter({ visible: true }).selectOption({ label: 'เคทีซี (KTC)' });
  await page.getByRole('textbox', { name: 'รหัสบัตร 4 ตัวท้าย' }).filter({ visible: true }).fill('4321');
  await page.getByRole('textbox', { name: 'ชาร์จเพิ่ม (%)' }).filter({ visible: true }).fill('3');
  await expect(page.getByText('ค่าธรรมเนียม 218.28 บาท · ยอดที่ต้องรูดรวม 7,494.28 บาท').filter({ visible: true })).toBeVisible();
  // the payment window says what the fee is
  await expect(page.getByText('รูดบัตร 7,276.00 + ค่าธรรมเนียม 218.28 = 7,494.28 บาท (ค่าธรรมเนียมเป็นรายได้อื่น รวม VAT แล้ว)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await app.settle();
  await page.locator('#mSaleRcpt').getByRole('button', { name: 'ปิด', exact: true }).last().click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The daily report: the fee, its VAT.
  await go(page, /^08 บัญชี/, '└ รายงานประจำวัน');
  await expect(page.getByText('ค่าธรรมเนียมบัตรที่ลูกค้าจ่ายเพิ่มวันนี้ 218.28 บาท — รายได้อื่น รวมภาษีขาย 14.28 บาท (ไม่รวมในยอดบัตรข้างบน)', { exact: true })).toBeVisible();

  const after = await figures(page);
  // The tax report of October: 204.00 more taxable sales, 14.28 more output VAT and VAT to pay, and a line saying why.
  expect(after.tax.base).toBeCloseTo(before.tax.base! + 204, 2);
  expect(after.tax.vat).toBeCloseTo(before.tax.vat! + 14.28, 2);
  expect(after.tax.buy).toBe(before.tax.buy);
  expect(after.tax.pay).toBeCloseTo(before.tax.pay! + 14.28, 2);
  // the home page's "สรุปภาษีประจำงวด" the same way
  expect(after.home.base).toBeCloseTo(before.home.base! + 204, 2);
  expect(after.home.vat).toBeCloseTo(before.home.vat! + 14.28, 2);
  expect(after.home.pay).toBeCloseTo(before.home.pay! + 14.28, 2);
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await expect(page.locator('#taxSumTbl').getByText('รวมค่าธรรมเนียมบัตรที่เรียกเก็บจากลูกค้า 218.28 บาท: ก่อน VAT 204.00 ภาษีขาย 14.28 (เอกสารที่เป็นใบกำกับภาษีรอผู้ทำบัญชี)', { exact: true })).toBeVisible();

  // The statements: other income 204.00 on its own row, the sales as they were, the net profit 204.00 more;
  // the money: the sale's 7,276.00 from the receivable to cash, and the fee's 218.28 more cash, equity and money
  // received from customers in the cash flow.
  expect(after.fs.fee).toBe(204);
  expect(after.fs.revenue).toBe(before.fs.revenue);
  expect(after.fs.np).toBeCloseTo(before.fs.np! + 204, 2);
  expect(after.fs.ar).toBeCloseTo(before.fs.ar! - 7276, 2);
  expect(after.fs.cash).toBeCloseTo(before.fs.cash! + 7276 + 218.28, 2);
  expect(after.fs.equity).toBeCloseTo(before.fs.equity! + 218.28, 2);
  expect(after.fs.cashIn).toBeCloseTo(before.fs.cashIn! + 7276 + 218.28, 2);

  // The trial balance: 4030 other income credited 204.00, 2030 output VAT 14.28.
  expect(after.tb.other).toBeCloseTo(before.tb.other + 204, 2);
  expect(after.tb.vatOut).toBeCloseTo(before.tb.vatOut + 14.28, 2);

  // October in the monthly table: sales and cost as they were, the net profit 204.00 more.
  expect(after.oct.slice(1, 5)).toEqual(before.oct.slice(1, 5));
  expect(after.oct[5]).toBeCloseTo(before.oct[5] + 204, 2);
});
