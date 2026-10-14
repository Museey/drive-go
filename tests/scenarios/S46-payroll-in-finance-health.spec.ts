import { test, expect } from '../support/test';

test('S46 หลังบันทึกจ่ายเงินเดือนงวด ต.ค. 2569 หน้าสุขภาพการเงินแสดงรายจ่ายเงินเดือนเพิ่มอีกหมวด', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ สุขภาพการเงิน', exact: true }).click();
  await expect(page.getByText('รวม 2,753,588 บาท', { exact: true })).toBeVisible();
  await expect(page.getByText('เงินเดือนและสวัสดิการพนักงาน', { exact: true })).toBeVisible();
  await expect(page.getByText('เงินเดือนและค่าแรงงาน', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await golden.step('หน้าสุขภาพการเงินก่อนบันทึกเงินเดือน');
  await golden.screen('health-before-payroll');

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '4 · จ่ายเงินเดือน' }).click();
  await golden.step('หน้าจ่ายเงินเดือน');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  await page.getByText('MA-EX261000004', { exact: true }).filter({ visible: true }).waitFor();
  await golden.step('หลังบันทึกจ่ายเงินเดือน');
  await golden.stateChange('payroll-run', before);

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ สุขภาพการเงิน', exact: true }).click();
  // Legacy behaviour reported to the owner: the salary estimate from the employee list (2,534,500)
  // stays, and the recorded October payroll (245,400 + 8,050) is added as a second category.
  await expect(page.getByText('รวม 3,007,038 บาท', { exact: true })).toBeVisible();
  await expect(page.getByText('เงินเดือนและสวัสดิการพนักงาน', { exact: true })).toBeVisible();
  await expect(page.getByText('เงินเดือนและค่าแรงงาน', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText('253,450 บาท', { exact: true })).toBeVisible();
  await golden.step('หน้าสุขภาพการเงินหลังบันทึกเงินเดือน');
  await golden.screen('health-after-payroll');
});
