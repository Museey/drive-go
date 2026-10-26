import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';

// New behaviour (task 3.13, decision R17, the owner's answers 13.1, 13.7 and 13.9 of 2026-10-26): the statements, the
// trial balance and the health page — on screen, printed and exported — carry the depreciation worked out by the day
// and the assets' input VAT. For 2569: depreciation 164,913.43 (legacy 165,198.35), property and equipment net
// 416,785.90, the cash paid for the POS computer bought 12/04/2569 34,240.00 (32,000 + VAT 2,240.00 rounded once),
// 1050 input VAT 2,240.00 (the legacy trial balance had no input VAT of assets), January's depreciation 13,351.11.
const printed = async (page: Page, texts: string[]) => {
  await page.emulateMedia({ media: 'print' });
  for (const text of texts) await expect(page.locator('#printStage').getByText(text).first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
};

test('S214 ระบบใหม่: งบการเงิน งบทดลอง และสุขภาพการเงิน แสดง พิมพ์ และส่งออกด้วยค่าเสื่อมราคาตามจำนวนวันและภาษีซื้อของสินทรัพย์', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();

  // The financial statements.
  await page.getByRole('button', { name: '└ งบการเงิน', exact: true }).click();
  const fs = (tbl: string, label: string) => page.locator(tbl).getByRole('row').filter({ hasText: label });
  await expect(fs('#plTbl', 'ค่าเสื่อมราคา')).toContainText('164,913.43');
  await expect(fs('#bsTbl', 'ที่ดิน อาคาร และอุปกรณ์ — สุทธิ')).toContainText('416,785.90');
  await expect(fs('#cfTbl', 'เงินสดจ่ายซื้อสินทรัพย์ถาวร')).toContainText('34,240.00');
  await page.getByRole('button', { name: 'พิมพ์งบการเงิน' }).click();
  await printed(page, ['164,913.43', '416,785.90', '34,240.00']);

  // The trial balance: printed and exported for the accounting office.
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  const tb = (code: string) => page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: code, exact: true }) });
  await expect(tb('1050')).toContainText('2,240.00');
  await expect(tb('6130')).toContainText('164,913.43');
  await expect(tb('1271')).toContainText('7,714.83');
  await page.getByRole('button', { name: 'พิมพ์งบทดลอง' }).click();
  await printed(page, ['ภาษีซื้อ', '2,240.00', '164,913.43', '7,714.83']);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ส่งออก CSV ให้สำนักงานบัญชี' }).click();
  const csv = readFileSync(await (await download).path(), 'utf8');
  expect(csv).toContain('"1050","ภาษีซื้อ","1 · สินทรัพย์","2240.00","0.00"');
  expect(csv).toContain('"6130","ค่าเสื่อมราคา","6 · ค่าใช้จ่ายในการขายและบริหาร","164913.43","0.00"');
  expect(csv).toContain('"1271","ค่าเสื่อมราคาสะสม - คอมพิวเตอร์","1 · สินทรัพย์","0.00","7714.83"');

  // The health page: the monthly profit and loss by the day, printed.
  await page.getByRole('button', { name: '└ สุขภาพการเงิน', exact: true }).click();
  await expect(page.locator('#pnlMonthTbl').getByRole('row').filter({ hasText: 'ม.ค. 69' })).toContainText('13,351.11');
  await page.getByRole('button', { name: 'พิมพ์รายงาน', exact: true }).filter({ visible: true }).click();
  await printed(page, ['รายงานสุขภาพการเงินของกิจการ', '13,351.11']);
});
