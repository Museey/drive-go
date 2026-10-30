import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant review 5.3, B's answer of round 2, the owner's decision of 2026-10-29): the payment
// voucher of the salaries is laid out as the accountant asked, with a column of account codes:
// - both expenses of the period: the salaries (6010) and the employer's social security contribution (6011);
// - taken off: the employer's and the employees' contributions owed (2060) and the income tax withheld (2050);
// - paid the same net as before (206,150.00 here, as in S174).
// The codes are the trial balance's: after the salaries are paid 6010 and 6011 carry the two expenses, 2060 both
// contributions and 2050 the tax; remitting the contribution clears 2060 on its own voucher, which names no accounts.
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const asked = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const toast = (page: Page, text: string) => expect(page.getByText(text, { exact: true }).filter({ visible: true })).toBeVisible();
const num = (s: string | null) => Number(String(s || '').replace(/[^0-9.-]/g, '')) || 0;
async function trial(page: Page) {
  await go(page, /^08 บัญชี/, '└ ผังบัญชี');
  const side = async (code: string) => {
    const row = page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: code, exact: true }) });
    if (!(await row.count())) return { dr: 0, cr: 0 };
    const cells = await row.getByRole('cell').allTextContents();
    return { dr: num(cells[3]), cr: num(cells[4]) };
  };
  return { salary: await side('6010'), ssoEr: await side('6011'), ssoOwed: await side('2060'), taxOwed: await side('2050') };
}

test('S256 ระบบใหม่: ใบสำคัญจ่ายเงินเดือนแสดงค่าใช้จ่าย 2 บรรทัด (เงินเดือน 6010 สมทบนายจ้าง 6011) หักสมทบทั้งสองส่วน (2060) และภาษี (2050) พร้อมรหัสบัญชีที่ตรงกับงบทดลอง', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const before = await trial(page);

  // October with the tax withheld of S174: EMP001 1,250 and EMP002 300.
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  const table = page.locator('#payTbl');
  for (const [code, tax] of [['EMP001', '1250'], ['EMP002', '300']]) {
    const box = table.getByRole('row').filter({ hasText: code }).getByLabel(`ภาษีหัก ณ ที่จ่าย ${code}`);
    await box.fill(tax);
    await box.press('Tab');
  }
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  await asked(page, 'บันทึกเงินเดือน งวด ต.ค. 2569').getByRole('button', { name: 'บันทึก', exact: true }).click();
  await toast(page, 'บันทึกเงินเดือน งวด ต.ค. 2569 แล้ว · เงินเดือน 216,500 + สมทบนายจ้าง 8,800 บาท · ค้างจ่าย');

  // Salaries paid by transfer, then the voucher printed.
  await page.getByRole('button', { name: 'จ่ายเงินเดือน', exact: true }).click();
  await asked(page, 'จ่ายเงินเดือน งวด ต.ค. 2569').getByRole('button', { name: 'บันทึกการจ่าย' }).click();
  await toast(page, 'บันทึกจ่ายเงินเดือน งวด ต.ค. 2569 แล้ว · ใบสำคัญจ่าย MA-PV261000001');
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).first().click();
  await page.emulateMedia({ media: 'print' });
  const stage = page.locator('#printStage');
  await expect(stage.getByText('MA-PV261000001', { exact: true })).toBeVisible();
  const lines = stage.locator('table').filter({ has: page.getByRole('cell', { name: 'รหัสบัญชี', exact: true }) }).getByRole('row');
  await expect(lines).toHaveCount(9);
  const rows = [
    ['ลำดับ', 'รายการ', 'เลขที่เอกสาร', 'รหัสบัญชี', 'จำนวนเงิน'],
    ['1', 'เงินเดือนและค่าจ้าง งวด ต.ค. 2569 (11 คน)', 'MA-EX261000003', '6010', '216,500.00'],
    ['2', 'เงินสมทบประกันสังคม (ส่วนนายจ้าง) งวด ต.ค. 2569', 'MA-EX261000004', '6011', '8,800.00'],
    ['รวม', '225,300.00'],
    ['หัก เงินสมทบประกันสังคม (ส่วนนายจ้าง)', '2060', '8,800.00'],
    ['หัก เงินสมทบประกันสังคม (ส่วนลูกจ้าง)', '2060', '8,800.00'],
    ['หัก ภาษีเงินได้หัก ณ ที่จ่าย (ภ.ง.ด.1)', '2050', '1,550.00'],
    ['จ่ายจริง', '206,150.00'],
    ['(สองแสนหกพันหนึ่งร้อยห้าสิบบาทถ้วน)'],
  ];
  for (const [i, cells] of rows.entries()) await expect(lines.nth(i).locator('th, td')).toHaveText(cells);
  await page.emulateMedia({ media: 'screen' });

  // The trial balance has what the voucher names: both expenses, both contributions owed, the tax owed.
  const paid = await trial(page);
  expect(paid.salary.dr).toBeCloseTo(before.salary.dr + 216500, 2);
  expect(paid.ssoEr.dr).toBeCloseTo(before.ssoEr.dr + 8800, 2);
  expect(paid.ssoOwed.cr).toBeCloseTo(before.ssoOwed.cr + 17600, 2);
  expect(paid.taxOwed.cr).toBeCloseTo(before.taxOwed.cr + 1550, 2);

  // The contribution remitted: 2060 cleared; its voucher (S165) has no account column.
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  await page.getByRole('button', { name: 'นำส่งประกันสังคม', exact: true }).click();
  await asked(page, 'นำส่งประกันสังคม งวด ต.ค. 2569').getByRole('button', { name: 'บันทึกการนำส่ง' }).click();
  await toast(page, 'บันทึกนำส่งประกันสังคม งวด ต.ค. 2569 แล้ว · ใบสำคัญจ่าย MA-PV261000002');
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).last().click();
  await page.emulateMedia({ media: 'print' });
  await expect(stage.getByText('MA-PV261000002', { exact: true })).toBeVisible();
  await expect(stage.getByText('17,600.00', { exact: true }).first()).toBeVisible();
  await expect(stage.getByText('รหัสบัญชี', { exact: true })).toHaveCount(0);
  await page.emulateMedia({ media: 'screen' });
  const remitted = await trial(page);
  expect(remitted.ssoOwed.cr).toBeCloseTo(before.ssoOwed.cr, 2);
  expect(remitted.taxOwed.cr).toBeCloseTo(before.taxOwed.cr + 1550, 2);
});
