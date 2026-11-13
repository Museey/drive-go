import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (the owner's decisions of 2026-11-12, docs/NOTES.md "งบการเงินจากบัญชีแยกประเภท"; branch reports of 37.js,
// user 2026-10-06): with two branches, 08 → งบการเงิน for some of them has the profit and loss of those branches' general
// ledger, while the balance sheet and the cash flow stay the whole business's. A second branch BN · สาขาบางนา pays
// 2,000.00 + VAT 140.00 (the form's VAT 7%) for a repair in cash. All branches: other expenses 30,500.00, net loss −125,586.02. BN only: no sales, its
// 2,000.00, no depreciation (the assets are the main branch's); the capital menu's other income and expenses are the
// whole business's and stay in (as before the ledger). The main branch only: the trial data's figures. The balance sheet
// and the cash flow are the same whichever branches are picked: cash 933,504.00 (2,140.00 less).
const rows = (t: Locator) => t.evaluate(e => [...e.querySelectorAll('tr')]
  .map(r => [...(r as HTMLTableRowElement).cells].map(c => (c as HTMLElement).innerText.replace(/\s+/g, ' ').trim()).join(' | ')));
const value = async (page: Page, table: string, label: string) =>
  (await rows(page.locator(table))).find(r => r.startsWith(label + ' | '))?.split(' | ')[1];
const workingBranch = (page: Page) => page.getByRole('combobox', { name: 'สาขาที่กำลังทำงาน' });

test('S296 ระบบใหม่: งบการเงินเมื่อเลือกบางสาขา งบกำไรขาดทุนจากบัญชีแยกประเภทของสาขาที่เลือก งบแสดงฐานะการเงินและงบกระแสเงินสดเป็นของทั้งกิจการ', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();

  // A second branch, and a repair paid there in cash.
  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(workingBranch(page)).toBeEnabled();
  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '6 · อื่น ๆ' }).click();
  await page.getByRole('button', { name: '+ บันทึกรายจ่าย' }).click();
  // A new document starts in the starting warehouse (the main branch for the owner): its window picks the branch.
  await page.getByLabel('คลัง / สาขาของเอกสารนี้').filter({ visible: true }).selectOption({ label: 'BN · สาขาบางนา' });
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await select('หมวดค่าใช้จ่าย *').selectOption('ค่าซ่อมแซมและบำรุงรักษา');
  await field('รายละเอียดค่าใช้จ่าย *').fill('ซ่อมประตูม้วนสาขาบางนา');
  await field('มูลค่าก่อนภาษี (บาท) *').fill('2000');
  await select('วิธีชำระ').selectOption('เงินสด');
  await select('สถานะ').selectOption('จ่ายแล้ว');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('row').filter({ hasText: 'ซ่อมประตูม้วนสาขาบางนา' })).toContainText(/BN-EX2610\d{5}/);

  // 08 งบการเงิน, every branch.
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ งบการเงิน', exact: true }).click();
  await expect.poll(() => value(page, '#plTbl', '6000 ค่าใช้จ่ายในการขายและบริหาร')).toBe('30,500.00');
  expect(await value(page, '#plTbl', 'กำไร (ขาดทุน) สุทธิก่อนภาษี')).toBe('-125,586.02');
  const bs = await rows(page.locator('#bsTbl')), cf = await rows(page.locator('#cfTbl'));
  expect(bs).toContain('เงินสดและเงินฝากธนาคาร | 933,504.00');
  expect(bs).toContain('รวมสินทรัพย์ | 2,423,100.26');
  expect(cf).toContain('เงินสดคงเหลือปลายงวด | 933,504.00');

  // BN only: its own profit and loss; the balance sheet and the cash flow as they were.
  const picker = page.locator('details.pkg-ms').filter({ visible: true }).first();
  await picker.locator('summary').click();
  await picker.getByRole('checkbox', { name: /สาขาบางนา/ }).check();
  await expect(picker.locator('summary')).toHaveText('สาขาบางนา');
  await expect.poll(() => rows(page.locator('#plTbl'))).toEqual([
    '4010 / 4020 รายได้จากการขายและบริการ | 0.00',
    '5010 หัก ต้นทุนอะไหล่และวัสดุที่ขาย | 0.00',
    'กำไรขั้นต้น | 0.00',
    '6000 ค่าใช้จ่ายในการขายและบริหาร | 2,000.00',
    '6010 เงินเดือนและเงินสมทบนายจ้าง | 0.00',
    '6130 ค่าเสื่อมราคา | 0.00',
    'รวมค่าใช้จ่ายดำเนินงาน | 2,000.00',
    '4030 บวก รายได้อื่น (รายรับอื่น ๆ) | 25,000.00',
    '6190 หัก ค่าใช้จ่ายเบ็ดเตล็ด (รายจ่ายอื่น ๆ) | 18,000.00',
    'กำไร (ขาดทุน) สุทธิก่อนภาษี | 5,000.00',
    'อัตรากำไรขั้นต้น 0.0% · อัตรากำไรสุทธิ 0.0%',
  ]);
  await expect(page.locator('#plTbl').locator('xpath=ancestor::div[contains(@class,"panel")]').locator('.pkg-rbr-chip')).toHaveText('สาขา: BN · สาขาบางนา');
  expect(await rows(page.locator('#bsTbl'))).toEqual(bs);
  expect(await rows(page.locator('#cfTbl'))).toEqual(cf);
  await expect(page.locator('#bsTbl').locator('xpath=ancestor::div[contains(@class,"panel")]').locator('.pkg-rbr-chip')).toHaveText('ทั้งกิจการ');

  // The main branch only: the trial data's profit and loss (the picker may still be open).
  if (!(await picker.evaluate(d => (d as HTMLDetailsElement).open))) await picker.locator('summary').click();
  await picker.getByRole('checkbox', { name: /สาขาบางนา/ }).uncheck();
  await picker.getByRole('checkbox', { name: /สาขาหลัก/ }).check();
  await expect.poll(() => value(page, '#plTbl', '6000 ค่าใช้จ่ายในการขายและบริหาร')).toBe('28,500.00');
  expect(await value(page, '#plTbl', 'กำไร (ขาดทุน) สุทธิก่อนภาษี')).toBe('-123,586.02');
  expect(await rows(page.locator('#bsTbl'))).toEqual(bs);
});
