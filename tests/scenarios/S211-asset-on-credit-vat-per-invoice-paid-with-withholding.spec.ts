import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.13, decision R17, the owner's answers 13.5–13.7 and 13.10 of 2026-10-26): assets bought on
// credit are owed to the vendor until paid. The vendor comes from the register (needed with VAT: a name typed that
// is not in it is refused). The purchase's VAT is worked out once on its total and rounded (R4): two lines of 100.05
// make 200.10 and VAT 14.01 (the legacy app rounded each line: 7.00 + 7.00 = 14.00). The input tax report has one row
// for the tax invoice with the vendor's tax ID (the legacy app had a row per line and no tax ID); the home page's
// input VAT and the trial balance's 1050 have it, 2010 has what is owed. It is listed in 08 เจ้าหนี้ and paid in
// "ชำระเงินเจ้าหนี้" like a goods receipt, here with 3% withheld on the installation: one payment voucher, the
// withholding in 4.4 · เราหักผู้ขาย and the ภ.ง.ด.53 of the month. Once paid it cannot be deleted or cancelled before
// the payment is cancelled.
const printed = async (page: Page, texts: string[]) => {
  await page.emulateMedia({ media: 'print' });
  for (const text of texts) await expect(page.locator('#printStage').getByText(text, { exact: true }).first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
};

test('S211 ระบบใหม่: ซื้อสินทรัพย์เครดิต VAT คิดครั้งเดียวต่อใบกำกับ รายงานภาษีซื้อมีเลขผู้เสียภาษี ขึ้นเจ้าหนี้ แล้วจ่ายพร้อมหัก ณ ที่จ่าย', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await app.signature();   /* the welcome message */
  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '3 · ซื้อสินทรัพย์' }).click();
  await page.getByRole('button', { name: '+ บันทึกการซื้อสินทรัพย์' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  const line = (i: number) => page.getByRole('row')
    .filter({ has: page.getByPlaceholder('เช่น เครื่องเชื่อม CO2') }).filter({ visible: true }).nth(i);
  await field('วันที่ได้มา *').fill('2026-10-05');
  await field('เลขที่ใบกำกับภาษี').fill('IV-6910-0412');
  await line(0).getByRole('combobox').selectOption('เครื่องมือช่าง');
  await line(0).getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill('แม่แรงตะเข็บ 2 ตัน');
  await line(0).getByRole('spinbutton').nth(0).fill('100.05');
  await line(1).getByRole('combobox').selectOption('เครื่องมือช่าง');
  await line(1).getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill('ชุดประแจทอร์ค');
  await line(1).getByRole('spinbutton').nth(0).fill('100.05');
  await line(1).getByRole('spinbutton').nth(0).press('Tab');
  // VAT once on 200.10: 14.007 → 14.01.
  await expect(page.locator('#yItems tfoot')).toContainText('รวม VAT 214.11');

  // A vendor typed that is not in the register.
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await field('ผู้ขาย').fill('ร้านเครื่องมือข้างอู่');
  await save.click();
  await app.settle();
  expect(await app.signature()).toMatchObject({ messages: ['เลือกผู้ขายจากทะเบียนผู้ขาย — สินทรัพย์ที่มี VAT หรือซื้อเครดิตต้องมีผู้ขายในทะเบียน (05 ผู้ขาย)'] });

  // A credit vendor of the register: the terms become its 30 days.
  await field('ผู้ขาย').fill('บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด');
  await field('ผู้ขาย').dispatchEvent('change');
  await expect(select('เงื่อนไขชำระ')).toHaveValue('credit');
  await expect(field('จำนวนวันเครดิต')).toHaveValue('30');
  await expect(field('ครบกำหนดชำระ')).toHaveValue('04/11/2569');
  await save.click();
  await app.settle();
  let db = (await app.state()).DB;
  const [a1, a2] = db.assets.slice(-2);
  expect(a1).toMatchObject({ no: 'MA-FA261000001', grp: a1.id, vendorId: db.vendors[0].id, term: 'credit', days: 30, due: '2026-11-04', cost: 100.05 });
  expect(a2).toMatchObject({ no: 'MA-FA261000002', grp: a1.id, term: 'credit' });
  expect(a1.payments).toBeUndefined();
  // Owed: tagged in the list, no voucher.
  const listRow = page.locator('#basTbl').getByRole('row').filter({ hasText: 'แม่แรงตะเข็บ 2 ตัน' });
  await expect(listRow).toContainText('ค้างจ่าย');
  await expect(listRow).toContainText('107.06');   /* 100.05 + its share of the VAT, 7.01 */
  await expect(page.locator('#basTbl').getByRole('row').filter({ hasText: 'ชุดประแจทอร์ค' })).toContainText('107.05');   /* the last line takes the rest: 7.00 */

  // The input tax report of October: one row for the invoice, with the vendor's tax ID.
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี', exact: true }).click();
  await expect(page.locator('#taxBuyTbl tbody')).toHaveText(/^1\s*05\/10\/2569\s*IV-6910-0412\s*บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด\s*0105539001234\s*200\.10\s*14\.01$/);
  await expect(page.locator('#taxBuyTag')).toHaveText('1 ฉบับ · ภาษีซื้อ 14.01');
  await expect(page.locator('#taxSumTbl').getByRole('row').filter({ hasText: /^ภาษีซื้อ/ })).toContainText('14.01');

  // The trial balance: 1050 input VAT, 2010 owed to the vendor.
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  // 2,240.00 of the POS computer bought in April + 14.01
  await expect(page.locator('#tbTbl').getByRole('row').filter({ hasText: '1050' })).toContainText('2,254.01');
  await expect(page.locator('#tbTbl').getByRole('row').filter({ hasText: '2010' })).toContainText('214.11');
  // The home page's tax card for October: the asset's VAT is input VAT.
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await expect(page.locator('#taxTbl').getByRole('row').filter({ hasText: 'ภาษีซื้อ (VAT จากใบกำกับภาษีผู้ขาย)' })).toContainText('14.01');
  await expect(page.locator('#buyTbl').getByRole('row').filter({ hasText: 'MA-FA261000001' })).toContainText('04/11/2569');

  // 08 เจ้าหนี้: owed, paid with the vendor's other bills.
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ เจ้าหนี้ (ค้างจ่าย)', exact: true }).click();
  const apRow = page.locator('#aApTbl').getByRole('row').filter({ hasText: 'MA-FA261000001' });
  await expect(apRow).toContainText('214.11');
  await expect(apRow).toContainText('รอชำระ');
  await page.getByRole('button', { name: '+ ชำระเงินเจ้าหนี้' }).click();
  await page.getByRole('button').filter({ hasText: 'บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด' }).filter({ visible: true }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-FA261000001' }).check();
  await page.getByRole('button', { name: 'หัก ณ ที่จ่าย', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'ฐานก่อน VAT ของ MA-FA261000001' })).toHaveValue('200.1');
  await page.getByRole('combobox', { name: 'อัตราหัก ณ ที่จ่ายของ MA-FA261000001' }).selectOption('3% (ค่าบริการ / ค่าจ้างทำของ)');
  await expect(page.getByText('หัก ณ ที่จ่าย รวม ฿6.00 — ยอดที่ต้องจ่ายผู้ขาย ฿208.11')).toBeVisible();
  await page.getByRole('button', { name: 'เต็มจำนวน' }).first().click();
  await page.getByRole('button', { name: 'บันทึกจ่ายชำระ' }).click();
  await page.getByRole('button', { name: 'ยืนยันบันทึกจ่ายชำระ ฿208.11' }).click();
  await expect(page.getByText('ใบสำคัญจ่าย MA-PV261000001')).toBeVisible();
  await app.settle();
  db = (await app.state()).DB;
  const head = db.assets.find((x: any) => x.no === 'MA-FA261000001');
  expect(head.paid).toBe(true);
  expect(head.payments).toEqual([expect.objectContaining({ amt: 208.11, pvNo: 'MA-PV261000001', wht: { rate: 3, baseAmt: 200.1, amt: 6, form: '53' } })]);
  expect(db.audit.at(-1)).toMatchObject({ kind: 'asset', no: 'MA-FA261000001', act: 'pay',
    note: 'จ่ายเจ้าหนี้ 208.11 บาท (เงินสด) · หัก ณ ที่จ่าย 6.00 บาท · ใบสำคัญจ่าย MA-PV261000001 · ชำระครบแล้ว' });
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).click();
  await printed(page, ['ใบสำคัญจ่าย', 'MA-PV261000001', 'บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด', 'ค่าสินทรัพย์ถาวร แม่แรงตะเข็บ 2 ตัน / ชุดประแจทอร์ค (ใบกำกับภาษี IV-6910-0412)',
    'MA-FA261000001, MA-FA261000002', '214.11', 'หัก ภาษี ณ ที่จ่าย 3%', '6.00', '208.11']);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The ภ.ง.ด.53 of October has the withholding.
  await page.getByRole('button', { name: '└ รายงานภาษี', exact: true }).click();
  await expect(page.locator('#whtOutTbl').getByRole('row').filter({ hasText: 'บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด' })).toContainText('ภ.ง.ด.53 ลำดับที่');
  await expect(page.locator('#whtOutTbl').getByRole('row').filter({ hasText: 'บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด' })).toContainText('6.00');
  // Paid in full: nothing owed in 2010.
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  await expect(page.locator('#tbTbl').getByRole('row').filter({ hasText: '2010' })).toHaveCount(0);

  // Paid: it can neither be deleted nor cancelled before the payment is.
  await page.getByRole('button', { name: '└ ทะเบียนสินทรัพย์', exact: true }).click();
  const reg = page.locator('#assetTbl').getByRole('row').filter({ hasText: 'ชุดประแจทอร์ค' }).filter({ visible: true }).first();
  await expect(reg.getByRole('button', { name: 'ลบ' })).toHaveCount(0);
  await app.signature();
  await reg.getByRole('button', { name: 'ยกเลิก' }).click();
  await app.settle();
  expect(await app.signature()).toMatchObject({ messages: ['ใบนี้บันทึกจ่ายเงินเจ้าหนี้แล้ว ยกเลิกไม่ได้ — ต้องแก้รายการจ่ายที่หน้า 08 · เจ้าหนี้ ก่อน'] });
});
