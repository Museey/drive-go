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

// Chapter 10 of the manual: the tax report of a month that has ended (5 Nov 2026): VAT, withholding, closing the month.
// Numbers on a picture are the numbers of the steps of its section. The VAT form is shown, not saved: in the trial data
// October's VAT is covered by input tax brought forward (0.00 to pay), and the form takes only an amount above 0.
test('09 ภาษี', async ({ app, page }) => {
  await page.clock.setFixedTime(new Date('2026-11-05T09:00:00+07:00'));
  await app.loginAsOwner();
  await go(page, '└ รายงานภาษี');
  const month = page.getByLabel('งวดเดือน').filter({ visible: true });
  await month.fill('2026-10');
  await expect(page.getByText('สรุปภาษีที่ต้องนำส่ง — งวดเดือน ต.ค. 2569', { exact: true })).toBeVisible();
  await page.mouse.click(5, 300);
  await app.settle();
  await shot(page, '09-report', { mark: [[month, '2']], scroll: false });
  await page.locator('#taxSumTbl').evaluate(e => e.scrollIntoView({ block: 'center' }));
  await shot(page, '09-summary', { mark: [line(page)], scroll: false });

  await line(page).getByRole('button', { name: 'บันทึกนำส่ง ภ.พ.30' }).click();
  const amount = page.getByLabel('จำนวนเงินที่ชำระ (ตามแบบที่ยื่น)').filter({ visible: true });
  await amount.waitFor();
  const record = page.getByRole('button', { name: 'บันทึกการนำส่ง' });
  await page.waitForTimeout(400);
  await shot(page, '09-pp30', { mark: [[amount, '2'], [record, '3']], scroll: false });
  await page.getByRole('button', { name: 'ยกเลิก', exact: true }).filter({ visible: true }).click();
  await expect(amount).toBeHidden();

  // Withholding tax (PND 3 / 53): print, then record the remittance
  const p3 = page.getByRole('button', { name: 'พิมพ์ ภ.ง.ด.3 + ใบแนบ' });
  const p53 = page.getByRole('button', { name: 'พิมพ์ ภ.ง.ด.53 + ใบแนบ' });
  const r3 = page.getByRole('button', { name: 'บันทึกนำส่ง ภ.ง.ด.3' });
  await shot(page, '09-wht', { mark: [[p3, '1'], [p53, '1'], [r3, '2'], [page.getByRole('button', { name: 'บันทึกนำส่ง ภ.ง.ด.53' }), '2']] });

  await page.evaluate(() => window.scrollTo(0, 0));
  const close = page.getByRole('button', { name: 'ปิดงวดภาษี', exact: true });
  await shot(page, '09-close', { mark: [close] });
});
