import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S22 in the new system (tests/intentional-changes.json, task 3.4,
// decision R7 "แก้ข้อ 4", X1): what the customer withheld shows wherever the
// money shows. In the settle window the withholding table's "คงค้าง" is the
// bill table's (3,676.40 after the 90.00 withheld, the legacy app showed
// 3,766.40 there); the audit line of the payment names the withholding; the
// payment history shows it under the money received; and the "ภาษีถูกหัก ณ
// ที่จ่าย" table of the tax report shows the base each customer withheld on
// (the legacy app showed 0.00). Every other step, message, screen and data
// change is S22's.
const S22 = 'S22-pay-with-withholding-tax.spec.ts';

test('S144 ระบบใหม่: รับชำระจากลูกค้านิติบุคคลที่หักภาษี ณ ที่จ่าย 3% ของค่าแรง ยอดหักขึ้นในตารางหัก ณ ที่จ่าย บันทึกการแก้ไข ประวัติการชำระ และรายงานภาษี', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S22, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000009' }).filter({ visible: true });
  await row.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000009' }).waitFor();
  await golden.step('ป๊อปอัพรับชำระเงินลูกหนี้ พร้อมยอดหัก ณ ที่จ่าย');

  await page.getByRole('button', { name: 'ได้รับแล้ว' }).click();
  await page.getByRole('button', { name: 'โอนเต็มจำนวน' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'บัญชีร้านที่รับโอน' })
    .selectOption({ label: 'ธนาคารไทยพาณิชย์ 456-7-89012-3 (หจก.เอกหม้อน้ำ)' });
  await page.getByRole('textbox', { name: 'เลขอ้างอิง / เลขที่สลิป' }).fill('SCB-771020');
  await page.getByText('รับชำระ ฿3,676.40 · ตัดครบ 1 ใบ').filter({ visible: true }).waitFor();
  await page.getByRole('button', { name: 'ได้รับแล้ว' }).scrollIntoViewIfNeeded();
  await golden.step('ได้รับ 50 ทวิ แล้ว และโอนเต็มจำนวน 3,676.40');
  // The withholding table's "คงค้าง" is what the bill table shows.
  const whtRow = page.getByRole('row').filter({ has: page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000009' }) });
  await expect(whtRow.getByRole('cell').nth(1)).toHaveText('3,676.40');
  await expect(page.getByRole('row').filter({ hasText: 'MA-SA261000009' }).filter({ has: page.getByRole('checkbox') })).toContainText('3,676.40');
  await golden.screen('wht-transfer', { mask: [whtRow.getByRole('cell').nth(1)] });

  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  const confirm = page.getByRole('button', { name: 'ยืนยันบันทึกรับชำระ ฿3,676.40' });
  await confirm.waitFor();
  await golden.step('ตรวจก่อนบันทึก');
  await golden.screen('confirm');

  const before = await app.state();
  await confirm.click();
  await expect(confirm).toBeHidden();
  await golden.step('หลังยืนยันบันทึกรับชำระ');
  const legacy = JSON.parse(legacyStateChange(S22, 'pay-with-wht'));
  legacy['DB.audit'].added[0].note = 'รับชำระ 3,676.40 บาท (เงินโอน) · ลูกค้าหัก ณ ที่จ่าย 90.00 บาท · ชำระครบแล้ว';
  await golden.stateChange('pay-with-wht', before, { 'DB.audit': legacy['DB.audit'] });
  golden.done();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The tax report of October: each withholding with the base it was withheld on (fixture: 60.00 on 2,000.00, 30.00 on 1,000.00).
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
  const table = page.getByRole('table').filter({ has: page.getByRole('cell', { name: 'ลูกค้าผู้หักภาษี', exact: true }) });
  const line = (no: string) => table.getByRole('row').filter({ hasText: no });
  await expect(line('MA-RE261000002')).toContainText('2,000.00');
  await expect(line('MA-RE261000002')).toContainText('60.00');
  await expect(line('MA-RE261000003')).toContainText('1,000.00');
  await expect(line('MA-RE261000003')).toContainText('30.00');
  await expect(line('MA-RE261000004')).toContainText('บริษัท ผักสดเดลิเวอรี่ จำกัด');
  await expect(line('MA-RE261000004')).toContainText('3,000.00');
  await expect(line('MA-RE261000004')).toContainText('3%');
  await expect(line('MA-RE261000004')).toContainText('90.00');
  await expect(table.getByRole('row', { name: /^รวมเครดิตภาษี/ })).toContainText('180.00');

  // The payment history of a bill paid in part after withholding (fixture MA-SA261000006: 1,500.00 received, 60.00 withheld).
  await page.getByRole('button', { name: '└ ลูกหนี้ (ค้างรับ)' }).click();
  await page.getByRole('row').filter({ hasText: 'MA-SA261000006' }).filter({ visible: true }).getByRole('button', { name: 'ประวัติชำระ' }).click();
  const history = page.locator('div.sheet').filter({ has: page.getByRole('heading', { name: 'ประวัติการชำระเงิน · MA-SA261000006' }) });
  await expect(history.getByRole('row').filter({ hasText: '08/10/2569' })).toContainText('หัก ณ ที่จ่าย 60.00 · รอหนังสือรับรอง');
});
