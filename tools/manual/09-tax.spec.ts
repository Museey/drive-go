import { test, expect } from '../../tests/support/test';
import type { Page } from '@playwright/test';
import { shot } from './shots';

async function go(page: Page, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await sub.click();
  await page.waitForTimeout(500);
}
const line = (page: Page) => page.locator('#taxSumTbl').getByRole('row').filter({ hasText: /ภ\.พ\.30 (เดือน|แล้ว)/ }).last();

// Chapter 9: the tax report of a month that has ended (5 Nov 2026): VAT, withholding, filing, closing the month.
test('09 ภาษี', async ({ app, page }) => {
  await page.clock.setFixedTime(new Date('2026-11-05T09:00:00+07:00'));
  await app.loginAsOwner();
  await go(page, '└ รายงานภาษี');
  const month = page.getByLabel('งวดเดือน').filter({ visible: true });
  await month.fill('2026-10');
  await expect(page.getByText('สรุปภาษีที่ต้องนำส่ง — งวดเดือน ต.ค. 2569', { exact: true })).toBeVisible();
  await app.settle();
  await shot(page, '09-report', { mark: [month] });
  await page.locator('#taxSumTbl').scrollIntoViewIfNeeded();
  await shot(page, '09-summary', { mark: [page.locator('#taxSumTbl')], scroll: false });
  await line(page).getByRole('button', { name: 'บันทึกนำส่ง ภ.พ.30' }).click();
  const amount = page.getByLabel('จำนวนเงินที่ชำระ (ตามแบบที่ยื่น)').filter({ visible: true });
  await amount.waitFor();
  await amount.fill('3631.95');
  await page.getByLabel('วิธีจ่าย').filter({ visible: true }).selectOption('เงินโอน');
  const record = page.getByRole('button', { name: 'บันทึกการนำส่ง' });
  await shot(page, '09-pp30', { mark: [[amount, '1'], [record, '2']], scroll: false });
  await record.click();
  await app.settle();
  await page.locator('#taxSumTbl').scrollIntoViewIfNeeded();
  await shot(page, '09-pp30-done', { mark: [line(page)], keepToast: true });
  const close = page.getByRole('button', { name: 'ปิดงวดภาษี', exact: true });
  await shot(page, '09-close', { mark: [close] });
});
