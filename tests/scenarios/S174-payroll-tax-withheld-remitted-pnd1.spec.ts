import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.8, F6 and the owner's answers of 2026-10-25): the shop types each employee's income
// tax withheld for the month on the payroll page (the accountant works it out; the system does not compute it).
// - it cannot be more than what is left after social security; the salary expense stays the gross pay and the
//   employees are paid net of social security and the tax;
// - the tax is remitted ("นำส่ง ภ.ง.ด.1") once the salaries are paid, with its payment voucher (to กรมสรรพากร);
// - the payslip deducts it; the tax report has a line for the month's ภ.ง.ด.1 (by the day the salaries were
//   paid), a column in the payroll table and a printed summary;
// - a period cancelled after the remittance says so.
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const asked = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const toast = (page: Page, text: string) => expect(page.getByText(text, { exact: true }).filter({ visible: true })).toBeVisible();
const printed = async (page: Page, texts: string[]) => {
  await page.emulateMedia({ media: 'print' });
  for (const text of texts) await expect(page.locator('#printStage').getByText(text, { exact: true }).first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
};

test('S174 ระบบใหม่: กรอกภาษีหัก ณ ที่จ่ายของพนักงานรายงวด จ่ายเงินเดือนสุทธิหลังหักภาษี นำส่ง ภ.ง.ด.1 พร้อมใบสำคัญจ่าย สลิปและรายงานภาษีแสดงภาษี', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  const table = page.locator('#payTbl');
  const row = (code: string) => table.getByRole('row').filter({ hasText: code });
  const typeTax = async (code: string, value: string) => {
    await row(code).getByLabel(`ภาษีหัก ณ ที่จ่าย ${code}`).fill(value);
    await row(code).getByLabel(`ภาษีหัก ณ ที่จ่าย ${code}`).press('Tab');
  };

  // More than what is left after social security (EMP003: 12,000 − 600) is refused.
  await typeTax('EMP003', '12000');
  await toast(page, 'ภาษีหัก ณ ที่จ่ายของ EMP003 ต้องไม่เกินรายได้หลังหักประกันสังคม (11,400.00 บาท)');
  await expect(row('EMP003').getByLabel('ภาษีหัก ณ ที่จ่าย EMP003')).toHaveValue('');

  // EMP001 1,250 and EMP002 300: 1,550 in all.
  await typeTax('EMP001', '1250');
  await typeTax('EMP002', '300');
  await expect(row('EMP001').getByRole('cell')).toHaveText(['EMP001', 'ศักดิ์ชัย มั่นคง', 'หัวหน้าช่าง', '25,000.00', '', '', '25,000.00', '875.00', '', '22,875.00', '875.00']);
  await expect(row('EMP001').getByLabel('ภาษีหัก ณ ที่จ่าย EMP001')).toHaveValue('1250');
  await expect(table.getByRole('row').filter({ hasText: 'รวม 11 คน' }).getByRole('cell')).toHaveText(['รวม 11 คน', '216,500.00', '8,800.00', '1,550.00', '206,150.00', '8,800.00']);
  await expect(table.getByRole('row').filter({ hasText: 'ภาษีหัก ณ ที่จ่ายที่ต้องนำส่ง (ภ.ง.ด.1)' })).toContainText('1,550.00');

  // Recorded owed: the tax is remitted after the salaries are paid.
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  const rec = asked(page, 'บันทึกเงินเดือน งวด ต.ค. 2569');
  await expect(rec.getByRole('row').filter({ hasText: 'หักภาษีเงินได้ ณ ที่จ่าย (ภ.ง.ด.1)' })).toContainText('1,550.00');
  await expect(rec.getByRole('row').filter({ hasText: 'จ่ายสุทธิ' })).toContainText('206,150.00');
  await rec.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await toast(page, 'บันทึกเงินเดือน งวด ต.ค. 2569 แล้ว · เงินเดือน 216,500 + สมทบนายจ้าง 8,800 บาท · ค้างจ่าย');
  await expect(page.getByText('ภาษีหัก ณ ที่จ่าย 1,550.00 บาท — นำส่งหลังจ่ายเงินเดือน', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'นำส่ง ภ.ง.ด.1', exact: true })).toHaveCount(0);
  const histTax = page.locator('#payHistTbl').getByRole('row').filter({ hasText: 'นำส่งภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1) งวด ต.ค. 2569' });
  await expect(histTax).toContainText('1,550.00');
  await expect(histTax).toContainText('รอจ่ายเงินเดือน');
  await app.settle();
  const recorded = (await app.state()).DB;
  const period = recorded.payroll[0];
  expect(period.totals).toEqual({ n: 11, gross: 216500, emp: 8800, er: 8800, net: 206150, tax: 1550 });
  expect(period.lines.find((l: any) => l.code === 'EMP001')).toMatchObject({ gross: 25000, ssoEmp: 875, tax: 1250, net: 22875 });
  expect(period.lines.find((l: any) => l.code === 'EMP003')).toMatchObject({ tax: 0, net: 11400 });
  expect(recorded.expenses.find((x: any) => x.no === 'MA-EX261000003')).toMatchObject({ base: 216500,
    note: 'หักประกันสังคมลูกจ้าง 8,800.00 บาท · หักภาษี ณ ที่จ่าย 1,550.00 บาท · จ่ายสุทธิ 206,150.00 บาท' });

  // Salaries paid by transfer: their voucher takes the tax off too.
  await page.getByRole('button', { name: 'จ่ายเงินเดือน', exact: true }).click();
  const pay = asked(page, 'จ่ายเงินเดือน งวด ต.ค. 2569');
  await expect(pay.getByText('จ่ายสุทธิให้พนักงาน 11 คน 206,150.00 บาท (รวมรายได้ 216,500.00 หักประกันสังคม 8,800.00 หักภาษี ณ ที่จ่าย 1,550.00)', { exact: true })).toBeVisible();
  await pay.getByRole('button', { name: 'บันทึกการจ่าย' }).click();
  await toast(page, 'บันทึกจ่ายเงินเดือน งวด ต.ค. 2569 แล้ว · ใบสำคัญจ่าย MA-PV261000001');
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).first().click();
  await printed(page, ['MA-PV261000001', 'หัก เงินสมทบประกันสังคม (ส่วนลูกจ้าง)', 'หัก ภาษีเงินได้หัก ณ ที่จ่าย (ภ.ง.ด.1)', '1,550.00', '206,150.00']);
  await expect(page.getByText('ภาษี ภ.ง.ด.1 ค้างนำส่ง', { exact: true })).toBeVisible();
  await expect(histTax.getByRole('button', { name: 'จ่าย', exact: true })).toBeVisible();

  // The tax remitted: its own voucher, to the Revenue Department.
  await page.getByRole('button', { name: 'นำส่ง ภ.ง.ด.1', exact: true }).click();
  const remit = asked(page, 'นำส่งภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1) งวด ต.ค. 2569');
  await expect(remit.getByText('นำส่งกรมสรรพากร 1,550.00 บาท (ภาษีเงินได้ที่หักจากเงินเดือน 2 คน) ภายในวันที่ 7 พ.ย. 2569', { exact: true })).toBeVisible();
  await remit.getByLabel('วิธีจ่าย').selectOption('เงินสด');
  await remit.getByRole('button', { name: 'บันทึกการนำส่ง' }).click();
  await toast(page, 'บันทึกนำส่ง ภ.ง.ด.1 งวด ต.ค. 2569 แล้ว · ใบสำคัญจ่าย MA-PV261000002');
  await expect(page.getByText('นำส่ง ภ.ง.ด.1 แล้ว 13/10/2569 (เงินสด) · ใบสำคัญจ่าย MA-PV261000002', { exact: true })).toBeVisible();
  await expect(histTax).toContainText('จ่ายแล้ว');
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).last().click();
  await printed(page, ['ใบสำคัญจ่าย', 'MA-PV261000002', 'กรมสรรพากร', 'ภาษีเงินได้หัก ณ ที่จ่ายจากเงินเดือน (ภ.ง.ด.1) งวด ต.ค. 2569 (2 คน)', '1,550.00', 'เงินสด']);
  await app.settle();
  const remitted = (await app.state()).DB;
  expect(remitted.payroll[0].taxRemit).toMatchObject({ date: '2026-10-13', method: 'เงินสด', pvNo: 'MA-PV261000002', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' });
  expect(remitted.audit.filter((a: any) => a.kind === 'expense' && a.act === 'pay').map((a: any) => a.note)).toEqual([
    'จ่ายเงินเดือน งวด ต.ค. 2569 สุทธิ 206,150.00 บาท (เงินโอน) · ใบสำคัญจ่าย MA-PV261000001',
    'นำส่งภาษีหัก ณ ที่จ่าย (ภ.ง.ด.1) งวด ต.ค. 2569 1,550.00 บาท (เงินสด) · ใบสำคัญจ่าย MA-PV261000002',
  ]);

  // EMP001's payslip.
  await row('EMP001').getByRole('button', { name: 'สลิปเงินเดือน' }).click();
  await printed(page, ['สลิปเงินเดือน', 'EMP001 · ศักดิ์ชัย มั่นคง', 'ภาษีเงินได้หัก ณ ที่จ่าย', '1,250.00', '2,125.00', '22,875.00']);

  // The tax report of October.
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await expect(page.locator('#taxSumTbl').getByRole('row').filter({ hasText: 'ภาษีเงินเดือนหัก ณ ที่จ่ายที่ต้องนำส่ง (ภ.ง.ด.1)' }).getByRole('cell').last()).toHaveText('1,550.00');
  const taxPay = page.locator('#payrollTbl');
  await expect(taxPay.getByRole('row').filter({ hasText: 'EMP001' }).getByRole('cell')).toHaveText(
    ['EMP001 · ศักดิ์ชัย มั่นคง', 'หัวหน้าช่าง', '25,000.00', '0.00', '0.00', '25,000.00', '1,250.00', '875.00', '875.00', '1,750.00']);
  await expect(taxPay.getByRole('row').filter({ hasText: 'รวม 11 คน' }).getByRole('cell')).toHaveText(
    ['รวม 11 คน', '216,500.00', '1,550.00', '8,800.00', '8,800.00', '17,600.00']);
  await page.getByRole('button', { name: 'พิมพ์สรุป ภ.ง.ด.1' }).click();
  await printed(page, ['สรุปภาษีเงินได้หัก ณ ที่จ่าย ภ.ง.ด.1', '3100500123456', 'EMP001 · ศักดิ์ชัย มั่นคง', '1,250.00', 'รวม 11 ราย (หักภาษี 2 ราย)', '1,550.00']);
  await expect(page.locator('#printStage')).toContainText('งวด ต.ค. 2569: นำส่งแล้ว 13/10/2569 · ใบสำคัญจ่าย MA-PV261000002');
  await app.settle();
  expect((await app.state()).DB.audit.at(-1)).toMatchObject({ kind: 'expense', act: 'print', note: 'สรุป ภ.ง.ด.1 เดือน ต.ค. 2569 · 11 ราย · ภาษี 1,550.00 บาท' });

  // Cancelled after the remittance: the reason, the vouchers named, the month has no ภ.ง.ด.1 any more.
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  await page.getByRole('button', { name: 'ยกเลิกงวดนี้' }).click();
  const cancel = asked(page, 'ยกเลิกเงินเดือน งวด ต.ค. 2569');
  await expect(cancel.getByText(/รวมการจ่ายที่บันทึกไว้ \(MA-PV261000001, MA-PV261000002\) แล้วบันทึกงวดใหม่ได้/)).toBeVisible();
  await cancel.getByRole('textbox').fill('กรอกภาษีผิดคน');
  await cancel.getByRole('button', { name: 'ยกเลิกงวดนี้' }).click();
  await toast(page, 'ยกเลิกเงินเดือน งวด ต.ค. 2569 แล้ว — บันทึกงวดใหม่ได้');
  await expect(page.locator('#payHistTbl').getByRole('row').filter({ hasText: 'งวด ต.ค. 2569 · ยกเลิกแล้ว' })).toContainText('ภ.ง.ด.1 MA-PV261000002');
  await expect(histTax).toHaveCount(0);
  await app.settle();
  expect((await app.state()).DB.audit.at(-1)).toMatchObject({ kind: 'expense', act: 'del',
    note: 'ยกเลิกเงินเดือน งวด ต.ค. 2569 — กรอกภาษีผิดคน · MA-EX261000003 (จ่ายแล้ว MA-PV261000001), MA-EX261000004 · นำส่ง ภ.ง.ด.1 แล้ว MA-PV261000002' });
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await expect(page.locator('#taxSumTbl').getByRole('row').filter({ hasText: 'ภ.ง.ด.1) ภายในวันที่ 7' })).toHaveCount(0);
});
