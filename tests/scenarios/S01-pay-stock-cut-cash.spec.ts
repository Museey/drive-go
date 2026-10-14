import { test } from '../support/test';

test('S01 รับชำระใบตัดสต็อกที่ค้างชำระด้วยเงินสดเต็มจำนวน', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await golden.step('รายการใบตัดสต็อกที่รอชำระ');
  await golden.screen('unpaid-list');

  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบตัดสต็อก MA-SA261000003');

  await page.getByRole('button', { name: 'รับชำระ', exact: true }).filter({ visible: true }).click();
  await golden.step('หน้ารับชำระ');
  await golden.screen('pay-panel');

  const before = await app.state();
  await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await golden.step('หลังบันทึกรับชำระ');
  await golden.stateChange('pay-cash', before);
  await golden.screen('after-pay');
});
