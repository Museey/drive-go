import { test, expect } from '../support/test';
import { secondDevice } from '../support/live';

// New behaviour (task 3.10, answer 10.6, decision Q2): what the owner changes about an employee who is signed in on
// another device takes effect there at once. Taking a menu away hides it from the employee's screen without a reload;
// suspending the account signs that device out straight away, not at its next save.
test('S246 ระบบใหม่: เจ้าของเอาสิทธิ์เมนูออก เมนูหายจากเครื่องของพนักงานทันที แล้วระงับบัญชี เครื่องของพนักงานหลุดออกจากระบบทันที', async ({ app, page, browser }) => {
  test.slow();
  await app.loginAsOwner();
  // The owner gives the front desk (EMP005) a login (as in S137).
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const staff = page.getByRole('row').filter({ hasText: 'EMP005' });
  await staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('5555');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(staff).toContainText('ใช้งานได้');
  await app.settle();

  const desk = await secondDevice(browser, page);
  await desk.app.open();
  await desk.app.login('092-111-2233', '5555');
  const crm = desk.page.getByRole('button', { name: /^01 ลูกค้าสัมพันธ์/ });
  await expect(crm).toBeVisible();

  // The owner takes menu 01 away from them (the staff window closes itself when saved).
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('row').filter({ hasText: 'EMP005' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  await page.getByRole('checkbox', { name: '01 · ลูกค้าสัมพันธ์ / นัดหมาย · เข้าดู' }).uncheck();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  await expect(crm).toBeHidden();
  expect(((await desk.app.state()) as any).DB.emp.find((e: any) => e.code === 'EMP005').perms.tabs.crm).toBe(false);

  // Then suspends the account: their device is signed out at once.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await staff.getByRole('button', { name: '⏸ ระงับ' }).click();
  await expect(staff).toContainText('ระงับ');
  await app.settle();
  await expect(desk.page.getByText('หมดเวลาการเข้าระบบ กรุณาเข้าสู่ระบบใหม่')).toBeVisible();
  await desk.page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await desk.page.waitForEvent('load');
  await expect(desk.page.getByPlaceholder('กรอกรหัสผ่าน')).toBeVisible();
  await desk.context.close();
});
