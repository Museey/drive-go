import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant review 5.4, the owner's decision of 2026-10-28 to follow accountant B,
// docs/ACCOUNTANT-ANSWERS.md): a payslip also shows the employee's totals of the year so far — income, income tax
// withheld and social security — from the recorded periods of the year up to the payslip's month.
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const asked = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

test('S251 ระบบใหม่: สลิปเงินเดือนแสดงยอดสะสมตั้งแต่ ม.ค. ถึงงวดของสลิป ทั้งรายได้ ภาษีหัก ณ ที่จ่าย และเงินสมทบประกันสังคม', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  const row = (code: string) => page.locator('#payTbl').getByRole('row').filter({ hasText: code });
  // records the month with EMP001's tax withheld
  const record = async (month: string, label: string, tax: string) => {
    await page.getByLabel('งวดเดือน').filter({ visible: true }).fill(month);
    await row('EMP001').getByLabel('ภาษีหัก ณ ที่จ่าย EMP001').fill(tax);
    await row('EMP001').getByLabel('ภาษีหัก ณ ที่จ่าย EMP001').press('Tab');
    await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
    await asked(page, `บันทึกเงินเดือน งวด ${label}`).getByRole('button', { name: 'บันทึก', exact: true }).click();
    await expect(page.getByText(new RegExp(`^บันทึกเงินเดือน งวด ${label} แล้ว`)).filter({ visible: true })).toBeVisible();
  };
  await record('2026-09', 'ก.ย. 2569', '1250');
  await record('2026-10', 'ต.ค. 2569', '1000');

  // EMP001's payslips: the year so far is September and October in October's, September alone in September's.
  const slip = async (month: string, title: string, rows: [string, string][]) => {
    await page.getByLabel('งวดเดือน').filter({ visible: true }).fill(month);
    await row('EMP001').getByRole('button', { name: 'สลิปเงินเดือน' }).click();
    await page.emulateMedia({ media: 'print' });
    const stage = page.locator('#printStage');
    await expect(stage.getByRole('cell', { name: title, exact: true })).toBeVisible();
    for (const [label, amount] of rows)
      await expect(stage.getByRole('row').filter({ hasText: label }).getByRole('cell')).toHaveText([label, amount]);
    await page.emulateMedia({ media: 'screen' });
  };
  await slip('2026-10', 'ยอดสะสม ม.ค. – ต.ค. 2569', [
    ['รายได้สะสม', '50,000.00'], ['ภาษีเงินได้หัก ณ ที่จ่ายสะสม', '2,250.00'], ['เงินสมทบประกันสังคมสะสม', '1,750.00']]);
  await slip('2026-09', 'ยอดสะสม ม.ค. – ก.ย. 2569', [
    ['รายได้สะสม', '25,000.00'], ['ภาษีเงินได้หัก ณ ที่จ่ายสะสม', '1,250.00'], ['เงินสมทบประกันสังคมสะสม', '875.00']]);
  await app.settle();
  expect((await app.state()).DB.payroll.map((p: any) => [p.month, p.lines.find((l: any) => l.code === 'EMP001').tax])).toEqual([['2026-09', 1250], ['2026-10', 1000]]);
});
