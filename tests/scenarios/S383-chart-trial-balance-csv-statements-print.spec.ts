import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// 08 · ผังบัญชี and งบการเงิน on the original: no scenario exported the chart of accounts or the trial balance to CSV,
// printed the trial balance, or opened and printed the financial statements.
async function csvOf(page: Page, button: string) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  const file = await download;
  return { name: file.suggestedFilename(), text: readFileSync(await file.path(), 'utf8') };
}

test('S383 ผังบัญชีและงบการเงิน: ส่งออกผังบัญชีและงบทดลองเป็น CSV พิมพ์งบทดลอง แล้วเปิดและพิมพ์งบการเงิน', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  await golden.step('หน้าผังบัญชี');

  const coa = await csvOf(page, 'ส่งออก CSV');
  expect(coa.name).toBe('chart-of-accounts-2026-10-13.csv');
  expect(coa.text.startsWith('﻿"รหัสบัญชี","ชื่อบัญชี","หมวดบัญชี"\n')).toBe(true);
  expect(coa.text).toContain('"1010","เงินสด","1 · สินทรัพย์"');
  await expect(page.getByText('ส่งออกไฟล์ chart-of-accounts-2026-10-13.csv แล้ว')).toBeVisible();
  await golden.step('ส่งออกผังบัญชีเป็น CSV');

  const tb = await csvOf(page, 'ส่งออก CSV ให้สำนักงานบัญชี');
  expect(tb.name).toBe('trial-balance-2569.csv');
  expect(tb.text.startsWith('﻿"รหัสบัญชี","ชื่อบัญชี","หมวดบัญชี","เดบิต","เครดิต"\n')).toBe(true);
  expect(tb.text.split('\n').length).toBeGreaterThan(10);
  await golden.step('ส่งออกงบทดลองเป็น CSV ให้สำนักงานบัญชี');

  const sheet = page.locator('#printStage');
  await page.getByRole('button', { name: 'พิมพ์งบทดลอง' }).click();
  await expect(sheet).toContainText('งบทดลอง (Trial Balance)');
  await expect(sheet).toContainText('สำหรับปีบัญชีสิ้นสุดวันที่ 31 ธันวาคม 2569');
  await expect(sheet).toContainText('รวมทั้งสิ้น');
  await golden.step('พิมพ์งบทดลอง');
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('trial-balance-printed');
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: '└ งบการเงิน', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^งบกำไรขาดทุน \(สำหรับปีบัญชี/ })).toBeVisible();
  await golden.step('หน้างบการเงิน');
  await page.getByRole('button', { name: 'พิมพ์งบการเงิน' }).click();
  await expect(sheet).toContainText('งบกำไรขาดทุน');
  await expect(sheet).toContainText('งบแสดงฐานะการเงิน');
  await expect(sheet).toContainText('งบกระแสเงินสด (อย่างย่อ)');
  await golden.step('พิมพ์งบการเงิน');
});
