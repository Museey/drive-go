import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { confirmWithWord } from '../support/whole-data';

// New behaviour (team's check of 2026-11-18, the owner's decision of 2026-11-19 "ทำ 1-4 ได้เลย", item 3; frontend/CHANGES.md
// 170–172): a figure is the same on every page. On the 36-month test data, October 2569 (the test's clock):
// · 00 หน้าแรก "ยอดลูกหนี้คงค้าง" is the ledger's receivables, as 08 งบการเงิน and สุขภาพการเงิน show them: 4,367,646.30.
//   The original showed 4,394,859 (the unpaid bills less the withholding customers will deduct, plus 38,124 of jobs not
//   yet billed) and the health page 4,397,905 (receipts from before the sale flow paid in part counted whole).
// · 00 หน้าแรก "สรุปภาษีประจำงวด" counts the month's expenses with VAT (2,114.77 input VAT) and the card fees of receipts
//   from before the sale flow (117.84 output VAT), as 08 รายงานภาษี now does and the ledger always did: output VAT
//   94,371.79, input VAT 48,643.77, ภ.พ.30 45,728.02 (the original home: 94,253.95 / 46,529.00 / 47,724.95; the tax
//   report's summary: 94,253.95 / 48,643.77 / 45,610.18).
async function go(page: Page, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await sub.click();
}
const rows = (t: Locator) => t.evaluate(e => [...e.querySelectorAll('tr')]
  .map(r => [...(r as HTMLTableRowElement).cells].map(c => (c as HTMLElement).innerText.replace(/\s+/g, ' ').trim()).join(' | ')));

test('S470 ระบบใหม่: ข้อมูลทดสอบ 36 เดือน ยอดลูกหนี้ในหน้าแรก สุขภาพการเงิน และงบการเงินตรงกัน สรุปภาษีในหน้าแรกและรายงานภาษีนับภาษีซื้อของค่าใช้จ่ายและค่าธรรมเนียมบัตรของใบเสร็จแบบเดิม', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await confirmWithWord(page, 'ล้างข้อมูล');
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'โหลดข้อมูลทดสอบ 36 เดือน' }).click();
  await confirmWithWord(page, 'โหลดข้อมูล');
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible({ timeout: 60_000 });
  await app.settle();

  // Home, October 2569.
  await expect(page.locator('#hAr')).toHaveText('4,367,646');
  expect(await rows(page.locator('#taxTbl'))).toEqual([
    'ยอดขาย / รายได้ก่อน VAT | 1,348,168.30',
    'ภาษีขาย (VAT จากใบกำกับภาษีที่ออก) | 94,371.79',
    'ยอดซื้อก่อน VAT | 694,911.00',
    'ภาษีซื้อ (VAT จากใบกำกับภาษีผู้ขาย) | 48,643.77',
    'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30) | 45,728.02',
    'ภาษีหัก ณ ที่จ่ายที่ถูกลูกค้าหักไว้ (เครดิตภาษี) | 3,390.90',
    'เงินสมทบประกันสังคมที่ต้องนำส่ง (ลูกจ้าง + นายจ้าง) | 17,600.00',
  ]);

  // 08 รายงานภาษี, October 2569: the same three figures.
  await go(page, '└ รายงานภาษี');
  await page.getByLabel('งวดเดือน').filter({ visible: true }).fill('2026-10');
  const sum = page.locator('#taxSumTbl');
  await expect(sum.getByRole('row').filter({ hasText: /^ภาษีขาย/ }).first()).toContainText('94,371.79');
  await expect(sum.getByRole('row').filter({ hasText: /^ภาษีซื้อ/ })).toContainText('48,643.77');
  await expect(sum.getByRole('row').filter({ hasText: /^ภาษีมูลค่าเพิ่มที่ต้องนำส่ง/ })).toContainText('45,728.02');
  await expect(sum.getByRole('row').filter({ hasText: /^รวมค่าธรรมเนียมบัตรที่เรียกเก็บจากลูกค้า/ })).toContainText('ภาษีขาย 117.84');

  // 08 สุขภาพการเงิน and งบการเงิน (2569): the same receivables.
  await go(page, '└ สุขภาพการเงิน');
  await expect(page.locator('#fAr2')).toHaveText('4,367,646');
  await go(page, '└ งบการเงิน');
  await expect(page.locator('#bsTbl').getByRole('row').filter({ hasText: /^ลูกหนี้การค้า/ })).toContainText('4,367,646.30');
});
