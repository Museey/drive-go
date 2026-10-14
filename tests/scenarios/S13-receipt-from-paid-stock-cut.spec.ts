import { test, expect } from '../support/test';

test('S13 ออกใบเสร็จรับเงินจากใบตัดสต็อกที่รับเงินแล้วแต่ยังไม่ออกใบเสร็จ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.3 ใบเสร็จรับเงิน' }).click();
  await golden.step('หน้า 4.3 ใบเสร็จรับเงิน');

  await page.getByRole('button', { name: '+ สร้างใบเสร็จรับเงิน' }).click();
  // MA-SA261000002 สมชาย ใจดี 663.40 บาท: ชำระแล้ว "รับเงินแล้ว ยังไม่ออกใบเสร็จ 1 รายการ"
  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000002' }).filter({ visible: true });
  await expect(row).toContainText('รับเงินแล้ว ยังไม่ออกใบเสร็จ');
  await row.getByRole('checkbox').check();
  await golden.step('เลือกใบตัดสต็อก MA-SA261000002');
  await golden.screen('pick-stock-cut');

  const before = await app.state();
  await page.getByRole('button', { name: 'สร้างใบเสร็จรับเงิน', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await golden.step('หลังสร้างใบเสร็จรับเงิน');
  await golden.stateChange('create-receipt', before);
  await golden.screen('receipt');

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true, hasText: 'ปิด' }).click();
  await expect(page.getByText('MA-RE261000004', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('รายการใบเสร็จรับเงินมี MA-RE261000004');
});
