import { test, expect } from '../support/test';

test('S05 เจ้าของร้านระงับบัญชีพนักงาน พนักงานเข้าระบบไม่ได้ แล้วเปิดใช้อีกครั้ง พนักงานเข้าได้', async ({ app, page, golden }) => {
  test.slow(); // many steps; each one waits for the saved data to settle
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const row = page.getByRole('row').filter({ hasText: 'EMP005' });
  await row.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  // The password box has no label; it takes the focus when the prompt opens.
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('5555');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(row).toContainText('ใช้งานได้');
  await golden.step('ออกบัญชีให้ EMP005 ฝนทิพย์ ต้อนรับ');

  let before = await app.state();
  await row.getByRole('button', { name: '⏸ ระงับ' }).click();
  await expect(row).toContainText('ระงับ');
  await expect(row.getByRole('button', { name: '▶ เปิดใช้' })).toBeVisible();
  await golden.step('กดระงับบัญชี');
  await golden.stateChange('suspend-account', before);
  await row.scrollIntoViewIfNeeded();
  await golden.screen('account-suspended');

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ชื่อผู้ใช้ อีเมล หรือเบอร์โทร').fill('092-111-2233');
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill('5555');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByText('บัญชีนี้ถูกระงับการใช้งาน — ติดต่อเจ้าของร้าน').filter({ visible: true })).toBeVisible();
  await golden.step('พนักงานที่ถูกระงับเข้าระบบ ถูกปฏิเสธ');
  await golden.screen('suspended-login-refused');

  await app.login('dg1688', '123456');
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  before = await app.state();
  await row.getByRole('button', { name: '▶ เปิดใช้' }).click();
  await expect(row).toContainText('ใช้งานได้');
  await golden.step('เจ้าของเข้าระบบอีกครั้ง แล้วกดเปิดใช้บัญชี');
  await golden.stateChange('reenable-account', before);

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-111-2233', '5555');
  await golden.step('พนักงานเข้าระบบได้');
});
