import { test, expect, type Page } from '../support/test';
import { secondDevice } from '../support/live';

// New behaviour (task 3.10, answer 10.7): signing in, an employee starts in their home branch ("สาขาประจำ" in the staff
// form), whatever branch anybody else is working in. The owner adds สาขาบางนา (as in S37), lets the front desk (EMP005)
// work in both branches with บางนา as their home, and gives them a login; they sign in on their own device in บางนา while
// the owner stays in the main branch.
const workingBranch = (p: Page) => p.getByRole('combobox', { name: 'สาขาที่กำลังทำงาน' });

test('S249 ระบบใหม่: พนักงานที่มีสาขาประจำเป็นสาขาบางนา เข้าระบบแล้วเริ่มทำงานที่สาขาบางนา เจ้าของยังอยู่สาขาหลัก', async ({ app, page, browser }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(workingBranch(page)).toBeEnabled();

  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('row').filter({ hasText: 'EMP005' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  const staff = page.locator('#mEmp');
  await staff.getByRole('checkbox', { name: 'BN · สาขาบางนา' }).check();
  await staff.getByRole('combobox', { name: 'สาขาประจำ' }).selectOption({ label: 'BN · สาขาบางนา' });
  await staff.getByRole('button', { name: 'บันทึก', exact: true }).last().click();
  await expect(staff).toBeHidden();
  const emp = ((await app.state()) as any).DB.emp.find((e: any) => e.code === 'EMP005');
  expect(emp.branches).toEqual(['main', expect.any(String)]);
  expect(emp.branchHome).toBe(emp.branches[1]);

  // Their login (as in S137).
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const row = page.getByRole('row').filter({ hasText: 'EMP005' });
  await row.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('5555');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(row).toContainText('ใช้งานได้');
  await app.settle();

  const desk = await secondDevice(browser, page);
  await desk.app.open();
  await desk.app.login('092-111-2233', '5555');
  await expect(workingBranch(desk.page).locator('option:checked')).toHaveText('BN · สาขาบางนา');
  await expect(workingBranch(page).locator('option:checked')).toHaveText('MA · สาขาหลัก');
  await desk.context.close();
});
