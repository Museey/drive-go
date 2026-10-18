import { test, expect } from '../support/test';

// Every way a sign-in at a Biz shop can end, recorded from the legacy app, so
// the new system's server-side sign-in (task T7) is held to the same results
// and messages. Suspended employees: S05. Sign-in with a changed password: S03.
test('S101 ผลการเข้าระบบของร้าน Biz ทุกกรณี: รหัสผิด ไม่มีผู้ใช้ อีเมล ตัวพิมพ์ใหญ่ พนักงานยังไม่มีบัญชี รหัสพนักงานผิด และเบอร์ไม่มีขีด', async ({ app, page, golden }) => {
  test.slow(); // many steps; each one waits for the saved data to settle
  const signOut = async () => {
    await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
    await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  };
  await app.open();

  expect(await app.loginRefused('dg1688', '111111')).toBe('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
  await golden.step('เจ้าของร้าน รหัสผิด');
  expect(await app.loginRefused('nobody', '123456')).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await golden.step('ไม่มีผู้ใช้นี้');
  expect(await app.loginRefused('092-333-4455', '8888')).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await golden.step('เบอร์ของพนักงานที่ยังไม่มีบัญชี');

  await app.login('demo@example.com', '123456');
  await golden.step('เจ้าของร้านเข้าด้วยอีเมล');
  await signOut();
  await app.login('DG1688', '123456');
  await golden.step('เจ้าของร้านพิมพ์ชื่อผู้ใช้ตัวพิมพ์ใหญ่');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const cashier = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashier.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  // The password box has no label; it takes the focus when the prompt opens.
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('8888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await golden.step('ออกบัญชีให้ EMP008 รหัส 8888');
  await signOut();

  expect(await app.loginRefused('092-333-4455', '9999')).toBe('รหัสผ่านไม่ถูกต้อง');
  await golden.step('พนักงาน รหัสผิด');
  await app.login('0923334455', '8888');
  await golden.step('พนักงานเข้าด้วยเบอร์ที่ไม่มีขีด');
});
