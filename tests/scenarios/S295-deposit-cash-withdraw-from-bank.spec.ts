import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (the owner's decision of 2026-11-12, "เอาตามที่เสนอทุกข้อ", docs/NOTES.md "ข้อเสนอ: งบการเงินจาก
// บัญชีแยกประเภท"): 08 → เงินลงทุน / เงินสด records cash taken to the bank ("ฝากเงินสดเข้าธนาคาร", 30,000.00) and
// money taken out of the bank as cash ("ถอนเงินจากธนาคารเป็นเงินสด", 5,000.00). The general ledger moves them between
// 1010 and 1020 on the day: the trial balance's cash 960,625.60 → 935,625.60 and the bank from 24,981.60 on the credit
// side to 18.40 on the debit side. The business's money as a whole is the same: the capital page's card, the balance
// sheet and the end of the cash flow stay 935,644.00. In the register they are neither money in nor out (no colour).
async function go(page: Page, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await sub.click();
}
const form = (page: Page) => page.locator('#mCap');
async function record(page: Page, kind: string, amount: string, note: string) {
  await page.getByRole('button', { name: '+ บันทึกรายการ' }).click();
  await form(page).getByLabel('ประเภทรายการ *').selectOption({ label: kind });
  await form(page).getByLabel('จำนวนเงิน (บาท) *').fill(amount);
  await form(page).getByLabel('รายละเอียด').fill(note);
  await form(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText('บันทึกรายการแล้ว')).toBeVisible();
}

test('S295 ระบบใหม่: ฝากเงินสดเข้าธนาคารและถอนเงินจากธนาคารเป็นเงินสด บัญชีแยกประเภทย้ายระหว่าง 1010 กับ 1020 เงินของกิจการรวมเท่าเดิม', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await go(page, '└ เงินลงทุน / เงินสด');
  await expect(page.locator('#cCash')).toHaveText('935,644');

  await record(page, 'ฝากเงินสดเข้าธนาคาร', '30000', 'นำเงินสดฝากธนาคารกสิกรไทย');
  await record(page, 'ถอนเงินจากธนาคารเป็นเงินสด', '5000', 'ถอนเงินทอนหน้าร้าน');
  const reg = (note: string) => page.locator('#capTbl').getByRole('row').filter({ hasText: note });
  await expect(reg('นำเงินสดฝากธนาคารกสิกรไทย')).toContainText('30,000.00');
  await expect(reg('นำเงินสดฝากธนาคารกสิกรไทย').locator('.chip')).toHaveText('ฝากเงินสดเข้าธนาคาร');
  await expect(reg('นำเงินสดฝากธนาคารกสิกรไทย').locator('.chip')).toHaveAttribute('class', 'chip');
  await expect(reg('ถอนเงินทอนหน้าร้าน').locator('.chip')).toHaveText('ถอนเงินจากธนาคารเป็นเงินสด');
  await expect(reg('ถอนเงินทอนหน้าร้าน').locator('.chip')).toHaveAttribute('class', 'chip');
  // The business's money as a whole did not change.
  await expect(page.locator('#cCash')).toHaveText('935,644');
  const db = (await app.state()).DB;
  expect(db.capital.find((x: any) => x.note === 'นำเงินสดฝากธนาคารกสิกรไทย')).toMatchObject({ type: 'deposit', amt: 30000, date: '2026-10-13' });
  expect(db.capital.find((x: any) => x.note === 'ถอนเงินทอนหน้าร้าน')).toMatchObject({ type: 'withdraw', amt: 5000 });
  expect(db.audit.filter((x: any) => x.kind === 'capital').map((x: any) => x.note).slice(-2))
    .toEqual(['ฝากเงินสดเข้าธนาคาร · 30,000.00 บาท', 'ถอนเงินจากธนาคารเป็นเงินสด · 5,000.00 บาท']);

  // The general ledger: the bank debited and cash credited for the deposit, the other way for the withdrawal.
  await go(page, '└ บัญชีแยกประเภท');
  const ledger = page.locator('#a-ledger');
  for (const [code, deposit, withdraw] of [['1020', ['30,000.00', ''], ['', '5,000.00']], ['1010', ['', '30,000.00'], ['5,000.00', '']]] as const) {
    await ledger.getByLabel('บัญชี', { exact: true }).selectOption(code);
    const cells = (desc: string) => ledger.getByRole('row').filter({ hasText: desc }).getByRole('cell');
    await expect(cells('ฝากเงินสดเข้าธนาคาร · นำเงินสดฝากธนาคารกสิกรไทย')).toHaveText(['13/10/2569', '', 'ฝากเงินสดเข้าธนาคาร · นำเงินสดฝากธนาคารกสิกรไทย', ...deposit, /\d/]);
    await expect(cells('ถอนเงินจากธนาคารเป็นเงินสด · ถอนเงินทอนหน้าร้าน')).toHaveText(['13/10/2569', '', 'ถอนเงินจากธนาคารเป็นเงินสด · ถอนเงินทอนหน้าร้าน', ...withdraw, /\d/]);
  }

  // The trial balance: 1010 and 1020 moved, together the same.
  await go(page, '└ ผังบัญชี');
  const tb = (code: string) => page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: code, exact: true }) }).getByRole('cell');
  await expect(tb('1010')).toHaveText(['1010', 'เงินสด', /สินทรัพย์/, '935,625.60', '']);
  await expect(tb('1020')).toHaveText(['1020', 'เงินฝากธนาคาร', /สินทรัพย์/, '18.40', '']);

  // The statements: cash and bank as before, and the cash flow ends where it did.
  await go(page, '└ งบการเงิน');
  await expect(page.locator('#bsTbl').getByRole('row').filter({ hasText: 'เงินสดและเงินฝากธนาคาร' })).toContainText('935,644.00');
  await expect(page.locator('#cfTbl').getByRole('row').filter({ hasText: 'เงินสดคงเหลือปลายงวด' })).toContainText('935,644.00');
  await expect(page.locator('#cfTbl').getByRole('row').filter({ hasText: 'รายรับ / รายจ่ายอื่น ๆ (สุทธิ)' })).toContainText('7,000.00');
});
