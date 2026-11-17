import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 8 of the manual: a month's salaries with social security, recorded now and paid later. Numbers on a picture
// are the numbers of its steps.
test('10 เงินเดือน', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).filter({ visible: true }).click();
  const sub = page.getByText('4 · จ่ายเงินเดือน', { exact: true }).filter({ visible: true });
  await sub.click();
  await app.settle();
  const run = page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' });
  await shot(page, '10-payroll', { mark: [[sub, '1'], [run, '2']], scroll: false });
  await run.click();
  await page.waitForTimeout(600);
  const status = page.getByLabel('สถานะ').filter({ visible: true });
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await shot(page, '10-payroll-ask', { mark: [[status, '3'], [save, '3']], scroll: false });
  await save.click();
  await app.settle();
  await page.waitForTimeout(500);
  const pay = page.getByRole('button', { name: 'จ่ายเงินเดือน', exact: true });
  await pay.waitFor();
  await shot(page, '10-payroll-later', { mark: [[pay, '4'], [page.getByRole('button', { name: 'นำส่งประกันสังคม', exact: true }), '4'], [page.getByRole('button', { name: 'พิมพ์สลิปเงินเดือนทุกคน' }), '5']] });
});
