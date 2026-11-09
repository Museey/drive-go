import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// 08 · รายงานประจำวัน: no scenario moved it to another day ("วันก่อนหน้า", "วันนี้", the date box), opened a stock cut
// or a receipt from it, or printed it.
const daily = (page: Page) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: 'รายงานประจำวัน', exact: true }) });

test('S387 รายงานประจำวัน: ย้อนดูวันก่อน เปิดใบตัดสต็อกและใบเสร็จจากรายงาน เลือกวันที่เอง กลับวันนี้ แล้วพิมพ์', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ รายงานประจำวัน', exact: true }).click();
  await expect(daily(page).getByLabel('วันที่')).toHaveValue('2026-10-13');
  await golden.step('รายงานประจำวัน 13/10/2569');

  // A receipt of today opened from the money received.
  await daily(page).getByText('MA-RE261000003', { exact: true }).first().click();
  await golden.step('กดเลขที่ใบเสร็จ MA-RE261000003 เปิดใบเสร็จ');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  for (let i = 0; i < 3; i++) await daily(page).getByRole('button', { name: 'วันก่อนหน้า' }).click();
  await expect(daily(page).getByLabel('วันที่')).toHaveValue('2026-10-10');
  await expect(daily(page).getByText('MA-SA261000003', { exact: true })).toBeVisible();
  await golden.step('ย้อนไป 10/10/2569');
  await golden.screen('daily-10-oct');

  // The stock cut of that day opened from the sales.
  await daily(page).getByText('MA-SA261000003', { exact: true }).click();
  await golden.step('กดเลขที่ MA-SA261000003 เปิดใบตัดสต็อก');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  await daily(page).getByLabel('วันที่').fill('2026-10-05');
  await expect(daily(page).getByLabel('วันที่')).toHaveValue('2026-10-05');
  await golden.step('เลือกวันที่ 05/10/2569');
  await daily(page).getByRole('button', { name: 'วันนี้' }).click();
  await expect(daily(page).getByLabel('วันที่')).toHaveValue('2026-10-13');
  await golden.step('กดวันนี้ กลับ 13/10/2569');

  const before = await app.state();
  await daily(page).getByRole('button', { name: 'พิมพ์รายงาน' }).click();
  const sheet = page.locator('#printStage');
  await expect(sheet).toContainText('รายงานประจำวัน');
  await expect(sheet).toContainText('MA-RE261000003');
  await golden.step('พิมพ์รายงานประจำวัน');
  await golden.stateChange('print-daily', before);
});
