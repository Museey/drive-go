import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 10: paying salaries with social security.
test('10 เงินเดือน', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).filter({ visible: true }).click();
  await page.getByText('4 · จ่ายเงินเดือน', { exact: true }).filter({ visible: true }).click();
  await app.settle();
  const run = page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' });
  await shot(page, '10-payroll', { mark: [[page.getByText('4 · จ่ายเงินเดือน', { exact: true }).filter({ visible: true }), '1'], [run, '2']] });
  await run.click();
  await page.waitForTimeout(600);
  await shot(page, '10-payroll-ask', { keepToast: true });
});
