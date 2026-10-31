import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.8, F6-ข and the owner's answers of 2026-10-25): every employee has a certificate of the
// year's pay and tax withheld (50 ทวิ, ภ.ง.ด.1ก, income type 1), printed from the tax report for the year of the
// month shown — what was paid in that year, the employee's social security, the address typed in a new field of
// the employee form ("ที่อยู่ (สำหรับ 50 ทวิ)") and the national id. Each employee's certificate of the year gets a
// number of the shop's 50 ทวิ series (MA-WH…) on the first print, kept on the employee: printing again or saving
// the employee form keeps it. Printing them takes the owner or the right "บันทึกค่าใช้จ่าย".
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
const ADDR = '99/1 ถ.สุขสวัสดิ์ แขวงบางมด เขตจอมทอง กรุงเทพมหานคร 10150';

test('S175 ระบบใหม่: กรอกที่อยู่พนักงาน แล้วพิมพ์ 50 ทวิ ประจำปีของพนักงานทุกคนจากรายงานภาษี เลขหนังสือรับรองออกครั้งเดียว คนไม่มีสิทธิ์บันทึกค่าใช้จ่ายพิมพ์ไม่ได้', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();

  // EMP001's address, in the row of the salary.
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  const edit = async (code: string) => page.getByRole('row').filter({ hasText: code }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const saveForm = () => page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await edit('EMP001');
  await expect(field('ที่อยู่ (สำหรับ 50 ทวิ)')).toHaveValue('');
  await field('ที่อยู่ (สำหรับ 50 ทวิ)').fill(ADDR);
  await saveForm();
  await app.settle();
  expect((await app.state()).DB.emp.find((e: any) => e.code === 'EMP001')).toMatchObject({ addr: ADDR });

  // Before any salary is paid this year: nothing to certify.
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await page.getByRole('button', { name: 'พิมพ์ 50 ทวิ ประจำปีของพนักงาน' }).click();
  await toast(page, 'ปี 2569 ยังไม่มีเงินเดือนที่จ่ายแล้ว');

  // October recorded and paid at once, EMP001 with 1,000 withheld.
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  const tax = page.locator('#payTbl').getByRole('row').filter({ hasText: 'EMP001' }).getByLabel('ภาษีหัก ณ ที่จ่าย EMP001');
  await tax.fill('1000');
  await tax.press('Tab');
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  const rec = asked(page, 'บันทึกเงินเดือน งวด ต.ค. 2569');
  await rec.getByLabel('สถานะ').selectOption('จ่ายแล้ว');
  await rec.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await toast(page, 'บันทึกเงินเดือน งวด ต.ค. 2569 แล้ว · เงินเดือน 216,500 + สมทบนายจ้าง 8,800 บาท · จ่ายแล้ว');

  // The certificates of 2026: 11 employees, numbers MA-WH261000001 – 011 in the order of their codes.
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await page.getByRole('button', { name: 'พิมพ์ 50 ทวิ ประจำปีของพนักงาน' }).click();
  await printed(page, ['หนังสือรับรองการหักภาษี ณ ที่จ่าย', 'MA-WH261000001', 'ศักดิ์ชัย มั่นคง', '3100500123456', 'ปี 2569', '25,000.00', '1,000.00',
    '(หนึ่งพันบาทถ้วน)', 'MA-WH261000011']);
  const stage = page.locator('#printStage');
  await expect(stage.locator('.sheetpage')).toHaveCount(22);
  const first = stage.locator('.sheetpage').first();
  await expect(first).toContainText(`ที่อยู่ ${ADDR}`);
  await expect(first).toContainText('กองทุนประกันสังคม 875.00 บาท');
  await expect(first).toContainText('ลำดับที่ 1 ในแบบ');
  await app.settle();
  const once = (await app.state()).DB;
  expect(once.emp.find((e: any) => e.code === 'EMP001').cert50).toEqual({ 2026: 'MA-WH261000001' });
  expect(once.emp.find((e: any) => e.code === 'EMP011').cert50).toEqual({ 2026: 'MA-WH261000011' });
  expect(once.audit.at(-1)).toMatchObject({ kind: 'emp', act: 'print' });
  expect(once.audit.at(-1).note).toMatch(/^หนังสือรับรองการหักภาษี ณ ที่จ่าย \(50 ทวิ\) ปี 2569 · พนักงาน 11 คน · EMP001 MA-WH261000001, EMP002 MA-WH261000002, /);

  // Printed again, and EMP001's form saved: the same numbers.
  await page.getByRole('button', { name: 'พิมพ์ 50 ทวิ ประจำปีของพนักงาน' }).click();
  await printed(page, ['MA-WH261000001', 'MA-WH261000011']);
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await edit('EMP001');
  await expect(field('ที่อยู่ (สำหรับ 50 ทวิ)')).toHaveValue(ADDR);
  await field('เบอร์โทรติดต่อ').fill('081-555-9999');
  await saveForm();
  await app.settle();
  const again = (await app.state()).DB;
  expect(again.emp.find((e: any) => e.code === 'EMP001')).toMatchObject({ tel: '081-555-9999', addr: ADDR, cert50: { 2026: 'MA-WH261000001' } });
  expect(again.emp.flatMap((e: any) => Object.values(e.cert50 || {}))).toHaveLength(11);

  // EMP004 sees the tax report; without "บันทึกค่าใช้จ่าย" they cannot print them.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const staff = page.getByRole('row').filter({ hasText: 'EMP004' });
  await staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('44444444');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(staff).toContainText('ใช้งานได้');
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await edit('EMP004');
  await page.getByRole('checkbox', { name: 'บันทึกค่าใช้จ่าย สินทรัพย์ และเงินลงทุน', exact: true }).uncheck();
  await saveForm();
  await app.settle();
  expect((await app.state()).DB.emp.find((e: any) => e.code === 'EMP004').perms).toMatchObject({ sub: { acctTax: true }, doc: { acctEdit: false } });
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('081-900-1122', '44444444');
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await page.getByRole('button', { name: 'พิมพ์ 50 ทวิ ประจำปีของพนักงาน' }).click();
  await toast(page, 'บัญชีนี้ไม่มีสิทธิ์ออก 50 ทวิ ของพนักงาน (ต้องมีสิทธิ์บันทึกค่าใช้จ่าย)');
});
