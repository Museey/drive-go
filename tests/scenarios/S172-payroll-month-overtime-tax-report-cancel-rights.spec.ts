import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.7, decisions R12, R13, F5, X2 and the owner's answers of 2026-10-25):
// - an employee's regular monthly income ("เงินได้ประจำ", EMP003 1,000) counts in the social security
//   base; overtime and bonuses are typed on the payroll page for the month and do not;
// - a month can be recorded and paid at once; the tax report's social security and ภ.ง.ด.1 base and
//   its payroll table are those of the recorded month (nothing before it is recorded or once cancelled);
// - a recorded month — even paid — is cancelled with a reason: its two expenses go, the period stays
//   in the history as cancelled with their numbers, and the month can be recorded again;
// - recording takes the owner or the right "บันทึกค่าใช้จ่าย": an account that may open 06.4 without
//   it sees the month and cannot record, pay or cancel.
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const asked = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const toast = (page: Page, text: string) => expect(page.getByText(text, { exact: true }).filter({ visible: true })).toBeVisible();

test('S172 ระบบใหม่: เงินได้ประจำนับเป็นฐานประกันสังคม ค่าล่วงเวลากรอกรายงวด รายงานภาษีจากงวดที่บันทึก ยกเลิกงวดที่จ่ายแล้วแล้วบันทึกใหม่ คนไม่มีสิทธิ์บันทึกไม่ได้', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();

  // EMP003 has 1,000 a month of regular income.
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('row').filter({ hasText: 'EMP003' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  await page.getByLabel('เงินได้ประจำ (บาท/เดือน)', { exact: true }).fill('1000');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('row').filter({ hasText: 'EMP003' }).getByRole('cell', { name: '13,000.00 เงินได้ประจำ 1,000.00', exact: true })).toBeVisible();
  await app.settle();
  expect((await app.state()).DB.emp.find((e: any) => e.code === 'EMP003')).toMatchObject({ salary: 12000, regular: 1000 });

  // October: EMP003's base is 13,000 (650); EMP001 has 3,500 overtime and 2,000 bonus, not in his base.
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  const row = (code: string) => page.locator('#payTbl').getByRole('row').filter({ hasText: code });
  await expect(row('EMP003').getByRole('cell').nth(3)).toHaveText('12,000.00+ เงินได้ประจำ 1,000.00');
  await expect(row('EMP003').getByRole('cell').nth(7)).toHaveText('650.00');
  await row('EMP001').getByLabel('ค่าล่วงเวลา EMP001').fill('3500');
  await row('EMP001').getByLabel('ค่าล่วงเวลา EMP001').press('Tab');
  await row('EMP001').getByLabel('เงินพิเศษ EMP001').fill('2000');
  await row('EMP001').getByLabel('เงินพิเศษ EMP001').press('Tab');
  await expect(row('EMP001').getByRole('cell').nth(6)).toHaveText('30,500.00');
  await expect(row('EMP001').getByRole('cell').nth(7)).toHaveText('875.00');
  await expect(row('EMP001').getByRole('cell').nth(8)).toHaveText('29,625.00');
  const total = page.locator('#payTbl').getByRole('row').filter({ hasText: 'รวม 11 คน' });
  await expect(total.getByRole('cell')).toHaveText(['รวม 11 คน', '223,000.00', '8,850.00', '214,150.00', '8,850.00']);

  // Recorded and paid at once, in cash.
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  const rec = asked(page, 'บันทึกเงินเดือน งวด ต.ค. 2569');
  await rec.getByLabel('สถานะ').selectOption('จ่ายแล้ว');
  await rec.getByLabel('วิธีจ่าย').selectOption('เงินสด');
  await rec.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await toast(page, 'บันทึกเงินเดือน งวด ต.ค. 2569 แล้ว · เงินเดือน 223,000 + สมทบนายจ้าง 8,850 บาท · จ่ายแล้ว');
  await expect(page.getByText('จ่ายแล้ว 13/10/2569 (เงินสด) · ใบสำคัญจ่าย MA-PV261000001', { exact: true })).toBeVisible();
  await expect(page.getByText('ประกันสังคมค้างนำส่ง', { exact: true })).toBeVisible();
  await app.settle();
  const first = (await app.state()).DB;
  expect(first.payroll[0].lines.find((l: any) => l.code === 'EMP001')).toMatchObject({ ot: 3500, bonus: 2000, gross: 30500, ssoBase: 17500, ssoEmp: 875 });
  expect(first.payroll[0].lines.find((l: any) => l.code === 'EMP003')).toMatchObject({ salary: 12000, regular: 1000, gross: 13000, ssoBase: 13000, ssoEmp: 650 });

  // The tax report of October: the recorded month.
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  const sumRow = (label: string) => page.locator('#taxSumTbl').getByRole('row').filter({ hasText: label });
  await expect(sumRow('เงินสมทบประกันสังคมนำส่ง').getByRole('cell').last()).toHaveText('17,700.00');
  await expect(sumRow('ฐานเงินเดือนสำหรับ ภ.ง.ด.1').getByRole('cell').last()).toHaveText('223,000.00');
  const taxPay = page.locator('#payrollTbl');
  await expect(taxPay.getByRole('row').filter({ hasText: 'EMP001' }).getByRole('cell')).toHaveText(
    ['EMP001 · ศักดิ์ชัย มั่นคง', 'หัวหน้าช่าง', '25,000.00', '3,500.00', '2,000.00', '30,500.00', '875.00', '875.00', '1,750.00']);
  await expect(taxPay.getByRole('row').filter({ hasText: 'รวม 11 คน' })).toContainText('223,000.00');

  // Cancelled (paid already) with a reason: the expenses go, the month can be recorded again.
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  await page.getByRole('button', { name: 'ยกเลิกงวดนี้' }).click();
  const cancel = asked(page, 'ยกเลิกเงินเดือน งวด ต.ค. 2569');
  await expect(cancel.getByText(/รายจ่าย MA-EX261000003 และ MA-EX261000004 ของงวดนี้จะถูกยกเลิก รวมการจ่ายที่บันทึกไว้ \(MA-PV261000001\) แล้วบันทึกงวดใหม่ได้/)).toBeVisible();
  await expect(cancel.getByRole('button', { name: 'ยกเลิกงวดนี้' })).toBeDisabled();
  await cancel.getByRole('textbox').fill('ลืมใส่ค่าล่วงเวลาของช่างไฟฟ้า');
  await cancel.getByRole('button', { name: 'ยกเลิกงวดนี้' }).click();
  await toast(page, 'ยกเลิกเงินเดือน งวด ต.ค. 2569 แล้ว — บันทึกงวดใหม่ได้');
  await app.settle();
  const cancelled = (await app.state()).DB;
  expect(cancelled.expenses.some((x: any) => ['MA-EX261000003', 'MA-EX261000004'].includes(x.no))).toBe(false);
  expect(cancelled.payroll[0]).toMatchObject({ cancelled: true, cancelReason: 'ลืมใส่ค่าล่วงเวลาของช่างไฟฟ้า', cancelDate: '2026-10-13',
    cancelledDocs: [expect.objectContaining({ no: 'MA-EX261000003', paid: true, pvNo: 'MA-PV261000001', method: 'เงินสด' }),
      expect.objectContaining({ no: 'MA-EX261000004', paid: false, pvNo: '' })] });
  expect(cancelled.audit.at(-1)).toMatchObject({ kind: 'expense', act: 'del',
    note: 'ยกเลิกเงินเดือน งวด ต.ค. 2569 — ลืมใส่ค่าล่วงเวลาของช่างไฟฟ้า · MA-EX261000003 (จ่ายแล้ว MA-PV261000001), MA-EX261000004' });
  await expect(page.locator('#payHistTbl').getByRole('row').filter({ hasText: 'งวด ต.ค. 2569 · ยกเลิกแล้ว' })).toContainText('ลืมใส่ค่าล่วงเวลาของช่างไฟฟ้า');
  await expect(row('EMP001').getByLabel('ค่าล่วงเวลา EMP001')).toHaveValue('');
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await expect(sumRow('เงินสมทบประกันสังคมนำส่ง').getByRole('cell').last()).toHaveText('0.00');
  await expect(taxPay.getByText('ยังไม่ได้บันทึกเงินเดือนงวด ต.ค. 2569 (06.4 จ่ายเงินเดือน)', { exact: true })).toBeVisible();

  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  await asked(page, 'บันทึกเงินเดือน งวด ต.ค. 2569').getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText(/^บันทึกแล้ว · รายจ่าย MA-EX261000005 \(เงินเดือน\) และ MA-EX261000006 \(นายจ้างสมทบ\)$/)).toBeVisible();

  // EMP009 may open 06.4 (once her form is saved, her older rights follow her table) but has no "บันทึกค่าใช้จ่าย".
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const staff = page.getByRole('row').filter({ hasText: 'EMP009' });
  await staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('9999');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(staff).toContainText('ใช้งานได้');
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('row').filter({ hasText: 'EMP009' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  expect((await app.state()).DB.emp.find((e: any) => e.code === 'EMP009').perms).toMatchObject({ sub: { buyPay: true }, doc: { acctEdit: false } });
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('081-888-9900', '9999');
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  await expect(page.getByText(/^บันทึกแล้ว · รายจ่าย MA-EX261000005/)).toBeVisible();
  for (const name of ['จ่ายเงินเดือน', 'นำส่งประกันสังคม', 'ยกเลิกงวดนี้'])
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  const month = page.getByRole('textbox', { name: 'งวดเดือน' }).filter({ visible: true });
  await month.fill('2026-11');
  await month.dispatchEvent('change');
  await expect(page.getByText(/^ยังไม่ได้บันทึกงวด พ\.ย\. 2569/)).toBeVisible();
  await expect(row('EMP001').getByRole('spinbutton')).toHaveCount(0);
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  await toast(page, 'บัญชีนี้ไม่มีสิทธิ์บันทึกเงินเดือน (ต้องมีสิทธิ์บันทึกค่าใช้จ่าย)');
});
