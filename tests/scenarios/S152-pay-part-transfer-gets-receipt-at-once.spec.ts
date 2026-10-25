import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S20 in the new system (tests/intentional-changes.json, task 3.5,
// decision R2): a part payment has its receipt too — MA-RE261000004 for the
// 3,000.00 transferred, 2,810.10 still owed — and the receipt window opens.
// Every other step, screen and data change is S20's.
const S20 = 'S20-partial-transfer-overdue-bill.spec.ts';

test('S152 ระบบใหม่: รับชำระบางส่วนด้วยเงินโอนจากหน้าแรก ได้ใบเสร็จรับเงินของเงินที่รับและเปิดใบเสร็จ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S20, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000005' }).filter({ visible: true });
  await row.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await golden.step('หน้ารับชำระ MA-SA261000005');

  await page.getByRole('button', { name: 'โอน แตะเพื่อเพิ่ม' }).click();
  await page.getByLabel('จำนวนเงิน').filter({ visible: true }).fill('3000');
  await page.getByLabel('ธนาคาร / บัญชีที่รับโอน').filter({ visible: true })
    .selectOption({ label: 'ธนาคารกสิกรไทย 123-4-56789-0 (หจก.เอกหม้อน้ำ)' });
  await page.getByText('รับน้อยกว่ายอดที่ต้องรับ 2,810.10 บาท').filter({ visible: true }).waitFor();
  await golden.step('กรอกเงินโอน 3,000 บาท');
  await golden.screen('pay-panel-transfer');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await app.settle();
  expect(await app.signature()).toEqual({ page: ['00 Mr.DriveGo 0'],
    popups: ['ใบตัดสต็อกขายสินค้า MA-SA261000005', 'ใบเสร็จรับเงิน MA-RE261000004'],
    messages: ['รับชำระ 3,000.00 บาท · ใบเสร็จ MA-RE261000004 · คงค้าง 2,810.10 บาท'] });
  golden.skip('หลังบันทึกรับชำระ');
  const legacy = JSON.parse(legacyStateChange(S20, 'pay-transfer-partial'));
  const pays = legacy['DB.receipts[MA-SA261000005].payments'];
  pays.added[0].reNo = 'MA-RE261000004';
  legacy['DB.audit'].added[0].note = 'รับชำระ 3,000.00 บาท (เงินโอน) · ใบเสร็จ MA-RE261000004 · คงค้าง 2,810.10 บาท';
  await golden.stateChange('pay-transfer-partial', before, { 'DB.receipts[MA-SA261000005].payments': pays, 'DB.audit': legacy['DB.audit'], 'DB.seq.MA-RE2610': [3, 4] });
  const rcpt = page.locator('#mSaleRcpt');
  await expect(rcpt.getByText('ชำระบางส่วน', { exact: true })).toBeVisible();
  await expect(rcpt.getByRole('row').filter({ hasText: 'คงค้างหลังใบนี้' })).toContainText('2,810.10');
  golden.done();
});
