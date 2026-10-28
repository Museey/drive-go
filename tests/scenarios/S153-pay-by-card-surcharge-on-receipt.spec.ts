import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S26 in the new system (tests/intentional-changes.json, task 3.5,
// decisions R2, R8-ก / F3 = ก and the owner's answers of 2026-10-25): the card
// payment has its receipt at once (MA-RE261000004), and the receipt shows the
// 3% surcharge as a line of its own — 7,276.00 for the sale + 218.28 card fee
// = 7,494.28 swiped, the total in words too — while the sale, its VAT and the
// money counted for the sale stay 7,276.00 (the surcharge is not the sale's: since
// the owner's decision of 2026-10-28, accountant review 3.2, it is other income with
// VAT in it, S255, and the payment window says so where S26's said it was not income).
// Every other step, screen and data change is S26's.
const S26 = 'S26-pay-by-credit-card-surcharge.spec.ts';

test('S153 ระบบใหม่: รับชำระด้วยบัตรเครดิตชาร์จเพิ่ม 3% ได้ใบเสร็จทันที ใบเสร็จแสดงค่าธรรมเนียมบัตรแยกบรรทัด ยอดรวมเท่าที่รูด', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S26, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000013' }).filter({ visible: true });
  await row.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await golden.step('หน้ารับชำระ MA-SA261000013');

  await page.getByRole('button', { name: 'บัตร แตะเพื่อเพิ่ม' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ยอดที่เหลือ' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'ธนาคาร / ผู้ให้บริการบัตร' }).filter({ visible: true })
    .selectOption({ label: 'เคทีซี (KTC)' });
  await page.getByRole('textbox', { name: 'รหัสบัตร 4 ตัวท้าย' }).filter({ visible: true }).fill('4321');
  await page.getByRole('textbox', { name: 'ชาร์จเพิ่ม (%)' }).filter({ visible: true }).fill('3');
  await page.getByRole('textbox', { name: 'เลขที่อนุมัติ / สลิป' }).filter({ visible: true }).fill('APV-889120');
  const fee = page.getByText('ค่าธรรมเนียม 218.28 บาท · ยอดที่ต้องรูดรวม 7,494.28 บาท').filter({ visible: true });
  await fee.waitFor();
  await fee.scrollIntoViewIfNeeded();
  await golden.step('บัตรเครดิต KTC 7,276.00 ชาร์จเพิ่ม 3%');
  const note = page.getByText('รูดบัตร 7,276.00 + ค่าธรรมเนียม 218.28 = 7,494.28 บาท (ค่าธรรมเนียมเป็นรายได้อื่น รวม VAT แล้ว)', { exact: true }).filter({ visible: true });
  await expect(note).toBeVisible();
  await golden.screen('card-surcharge', { mask: [note] });

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await app.settle();
  expect(await app.signature()).toEqual({ page: ['00 Mr.DriveGo 0'],
    popups: ['ใบตัดสต็อกขายสินค้า MA-SA261000013', 'ใบเสร็จรับเงิน MA-RE261000004'],
    messages: ['รับชำระ 7,276.00 บาท · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว'] });
  golden.skip('หลังบันทึกรับชำระ');
  const legacy = JSON.parse(legacyStateChange(S26, 'pay-card-surcharge'));
  const pays = legacy['DB.receipts[MA-SA261000013].payments'];
  pays.added[0].reNo = 'MA-RE261000004';
  legacy['DB.audit'].added[0].note = 'รับชำระ 7,276.00 บาท (บัตรเครดิต/เดบิต) · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว';
  await golden.stateChange('pay-card-surcharge', before, { 'DB.receipts[MA-SA261000013].payments': pays, 'DB.audit': legacy['DB.audit'], 'DB.seq.MA-RE2610': [3, 4] });

  // The receipt: the card line is what was swiped; the sale's amount and the fee each on a line; the total is what was paid.
  const rcpt = page.locator('#mSaleRcpt');
  await expect(rcpt.getByRole('row', { name: /^บัตรเครดิต/ })).toContainText('เคทีซี (KTC) · เลขท้าย 4321 · เลขอนุมัติ APV-889120');
  await expect(rcpt.getByRole('row', { name: /^บัตรเครดิต/ })).toContainText('7,494.28');
  await expect(rcpt.getByRole('row').filter({ hasText: 'ยอดตามใบตัดสต็อก' })).toContainText('7,276.00');
  await expect(rcpt.getByRole('row').filter({ hasText: 'ค่าธรรมเนียมบัตรเครดิต 3%' })).toContainText('218.28');
  await expect(rcpt.getByRole('row').filter({ hasText: 'ยอดรับครั้งนี้' })).toContainText('7,494.28');
  await rcpt.getByRole('button', { name: 'พิมพ์ใบเสร็จ (A4)' }).click();
  await page.emulateMedia({ media: 'print' });
  const printed = (t: string) => page.locator('#printStage').getByText(t, { exact: true });
  for (const t of ['ยอดตามใบตัดสต็อก', 'ค่าธรรมเนียมบัตรเครดิต 3%', '218.28', '(เจ็ดพันสี่ร้อยเก้าสิบสี่บาทยี่สิบแปดสตางค์)'])
    await expect(printed(t)).toHaveCount(2);
  await page.emulateMedia({ media: 'screen' });
  golden.done();
});
