import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.9, the owner's answers of 2026-10-26): the server sends other employees' pay only to the
// owner and the rights "ดูสรุปการเงิน ภาษี และเงินเดือน" / "ดูและแก้ไขข้อมูลพนักงาน", so the payroll page of anyone else
// says so instead of a table of blanks, and its buttons refuse; the whole shop's backup file is the owner's,
// as is restoring a backup point, even for an employee with "ส่งออกไฟล์สำรอง" and "สำรองและกู้คืนข้อมูลทั้งระบบ".
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const toast = (page: Page, text: string) => expect(page.getByText(text, { exact: true }).filter({ visible: true })).toBeVisible();
const NO_PAY = 'บัญชีนี้ไม่มีสิทธิ์ดูเงินเดือน (ต้องมีสิทธิ์ดูสรุปการเงิน ภาษี และเงินเดือน หรือดูและแก้ไขข้อมูลพนักงาน)';

test('S178 ระบบใหม่: คนที่เปิดหน้าจ่ายเงินเดือนได้แต่ไม่มีสิทธิ์ดูเงินเดือน เห็นข้อความแทนตาราง บันทึกและพิมพ์ไม่ได้ ส่งออกไฟล์สำรองทั้งร้านได้เฉพาะเจ้าของ', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const saveForm = () => page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  const issue = async (code: string, pin: string) => {
    await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
    const staff = page.getByRole('row').filter({ hasText: code });
    await staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
    await page.locator('input:focus').waitFor();
    await page.keyboard.type(pin);
    await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
    await expect(staff).toContainText('ใช้งานได้');
  };
  // EMP007 (stock clerk) may open 06.4 once their form is saved (their older rights follow their table);
  // EMP009 (internal audit) gets "ส่งออกไฟล์สำรอง" and "สำรองและกู้คืนข้อมูลทั้งระบบ".
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('row').filter({ hasText: 'EMP007' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  await saveForm();
  await page.getByRole('row').filter({ hasText: 'EMP009' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  await page.getByRole('checkbox', { name: 'ส่งออกไฟล์สำรอง', exact: true }).check();
  await page.getByRole('checkbox', { name: 'สำรองและกู้คืนข้อมูลทั้งระบบ', exact: true }).check();
  await saveForm();
  await app.settle();
  const emp = ((await app.state()) as any).DB.emp;
  expect(emp.find((e: any) => e.code === 'EMP007').perms).toMatchObject({ sub: { buyPay: true }, doc: { fin: false, emp: false } });
  expect(emp.find((e: any) => e.code === 'EMP009').perms).toMatchObject({ doc: { export: true, backup: true } });
  await issue('EMP007', '7777');
  await issue('EMP009', '9999');

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-777-8899', '7777');
  await go(page, /^06 รายจ่าย/, '└ 4 · จ่ายเงินเดือน');
  await expect(page.locator('#payTbl').getByRole('cell', { name: NO_PAY, exact: true })).toBeVisible();
  await expect(page.locator('#payTbl').getByRole('row').filter({ hasText: 'EMP001' })).toHaveCount(0);
  // The buttons answer with the same words as the table: both show.
  const noPay = page.getByText(NO_PAY, { exact: true }).filter({ visible: true });
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  await expect(noPay).toHaveCount(2);
  await page.getByRole('button', { name: 'พิมพ์ใบจ่ายเงินเดือน' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByText('ใบจ่ายเงินเดือนพนักงาน', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await page.emulateMedia({ media: 'screen' });
  await app.settle();
  expect(((await app.state()) as any).DB.payroll || []).toHaveLength(0);

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('081-888-9900', '9999');
  await go(page, /^11 ตั้งค่าเพิ่มเติม/, '└ 11.3 นำเข้า / ส่งออกข้อมูล');
  await page.getByRole('button', { name: /^ส่งออกไฟล์สำรองทั้งระบบ/ }).click();
  await toast(page, 'ส่งออกไฟล์สำรองทั้งร้านได้เฉพาะเจ้าของร้าน');
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'กู้คืนข้อมูลจากจุดสำรองที่เลือก' }).filter({ visible: true }).click();
  await toast(page, 'กู้คืนจากจุดสำรองได้เฉพาะเจ้าของร้าน');
});
