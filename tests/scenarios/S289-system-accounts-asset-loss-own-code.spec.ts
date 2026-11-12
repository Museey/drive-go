import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant round 3, J20 J36 J29; the owner's decisions of 2026-11-11, docs/ACCOUNTANT-ANSWERS.md):
// an asset sold or written off gains to 4040 กำไรจากการจำหน่ายสินทรัพย์ or loses to 6140 ขาดทุนจากการจำหน่ายสินทรัพย์
// (they were 4030 / 6190), and input VAT left over at a month's end is carried in 1055 ลูกหนี้กรมสรรพากร. They are not
// added to the shop's chart: the general ledger page tells which of them the chart does not have. A code the shop
// already uses for an account of its own gives way to the next free one: with the shop's own 6140, the loss of the air
// conditioning machine written off on 30/06/2569 (its value left, 40,109.27, as in S212) is on 6141 in the trial
// balance and the general ledger.
const go = async (page: Page, sub: string) => {
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: sub, exact: true }).click();
};

test('S289 ระบบใหม่: บัญชีที่ระบบลงรายการเอง 1055 4040 6140 บอกในหน้าบัญชีแยกประเภท รหัสที่ร้านใช้แล้วเลื่อนไปรหัสถัดไป ขาดทุนจากการจำหน่ายสินทรัพย์ลงบัญชีนั้นในงบทดลองและบัญชีแยกประเภท', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await go(page, '└ บัญชีแยกประเภท');
  const note = page.getByText(/^บัญชีที่ระบบลงรายการเอง/);
  await expect(note).toHaveText('บัญชีที่ระบบลงรายการเอง (ไม่อยู่ในผังบัญชีของร้าน): 1055 ลูกหนี้กรมสรรพากร · 4040 กำไรจากการจำหน่ายสินทรัพย์ · 6140 ขาดทุนจากการจำหน่ายสินทรัพย์');
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();

  // The shop's own 6140 (as in S169).
  const answer = (question: string) => page.getByText(question, { exact: true }).locator('..').getByRole('textbox');
  await page.getByRole('button', { name: '+ เพิ่มบัญชี' }).click();
  await answer('รหัสบัญชีใหม่ (เช่น 6140)').fill('6140');
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  await answer('ชื่อบัญชี').fill('ค่าบริการซอฟต์แวร์');
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('57 บัญชี', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '└ บัญชีแยกประเภท', exact: true }).click();
  await expect(note).toHaveText('บัญชีที่ระบบลงรายการเอง (ไม่อยู่ในผังบัญชีของร้าน): 1055 ลูกหนี้กรมสรรพากร · 4040 กำไรจากการจำหน่ายสินทรัพย์ · 6141 ขาดทุนจากการจำหน่ายสินทรัพย์');

  // The air conditioning machine written off on 30/06/2569 (as in S212).
  await page.getByRole('button', { name: '└ ทะเบียนสินทรัพย์', exact: true }).click();
  const row = (name: string) => page.locator('#assetTbl').getByRole('row').filter({ hasText: name }).filter({ visible: true }).first();
  await row('เครื่องเติมน้ำยาแอร์อัตโนมัติ').getByRole('button', { name: 'แก้ไข' }).click();
  await page.getByRole('combobox', { name: /^สถานะ/ }).filter({ visible: true }).selectOption('จำหน่าย / ตัดออกแล้ว');
  await page.getByLabel('วันที่จำหน่าย (ถ้ามี)', { exact: true }).filter({ visible: true }).fill('2026-06-30');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(row('เครื่องเติมน้ำยาแอร์อัตโนมัติ')).toContainText('จำหน่ายแล้ว');

  // The trial balance: the loss on 6141 under its name, nothing on the shop's 6140, nothing more on 6190.
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  const tb = (code: string) => page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: code, exact: true }) });
  await expect(tb('6141').getByRole('cell')).toHaveText(['6141', 'ขาดทุนจากการจำหน่ายสินทรัพย์', '6 · ค่าใช้จ่ายในการขายและบริหาร', '40,109.27', '']);
  await expect(tb('6140')).toHaveCount(0);
  // 6190 has the trial data's other expense of 18/05/2569 only (J28, S293), not the loss.
  await expect(tb('6190').getByRole('cell').nth(3)).toHaveText('18,000.00');

  // The general ledger: the write-off on its day, the asset's number.
  await page.getByRole('button', { name: '└ บัญชีแยกประเภท', exact: true }).click();
  const ledger = page.locator('#a-ledger');
  await ledger.getByLabel('บัญชี', { exact: true }).selectOption('6141');
  await expect(ledger.getByRole('heading', { name: '6141 ขาดทุนจากการจำหน่ายสินทรัพย์' })).toBeVisible();
  await expect(ledger.locator('tbody tr').nth(1).getByRole('cell'))
    .toHaveText(['30/06/2569', 'MA-FA241200001', 'จำหน่ายสินทรัพย์ เครื่องเติมน้ำยาแอร์อัตโนมัติ', '40,109.27', '', '40,109.27']);
});
