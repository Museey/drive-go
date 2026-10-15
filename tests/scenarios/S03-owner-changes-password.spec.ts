import { test, expect } from '../support/test';

test('S03 เจ้าของร้านเปลี่ยนรหัสผ่านที่เมนู 10 แล้วเข้าระบบด้วยรหัสใหม่ รหัสเดิมใช้ไม่ได้', async ({ app, page, golden }) => {
  test.slow(); // many steps; each one waits for the saved data to settle
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(page.getByRole('heading', { name: /บัญชีผู้ซื้อระบบ \(เจ้าของร้าน\)/ })).toBeVisible();
  const before = await app.state();

  // The prompt's box has no label; it takes the focus when the prompt opens.
  const answer = async (text: string, button: string) => {
    await page.locator('input:focus').waitFor();
    await page.keyboard.type(text);
    await page.getByRole('button', { name: button, exact: true }).filter({ visible: true }).click();
  };

  await page.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }).click();
  await expect(page.getByText('ใส่รหัสผ่านเดิม', { exact: true })).toBeVisible();
  await golden.step('กดเปลี่ยนรหัสผ่าน ระบบถามรหัสผ่านเดิม');
  await answer('654321', 'ต่อไป');
  await golden.step('ใส่รหัสผ่านเดิมผิด');

  await page.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }).click();
  await answer('123456', 'ต่อไป');
  await expect(page.getByText('ตั้งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)')).toBeVisible();
  await golden.step('ใส่รหัสผ่านเดิมถูก ระบบให้ตั้งรหัสใหม่');
  await answer('dg123', 'บันทึก');
  await golden.step('รหัสใหม่สั้นกว่า 6 ตัว');

  await page.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }).click();
  await answer('123456', 'ต่อไป');
  await expect(page.getByText('ตั้งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)')).toBeVisible();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('drive2026');
  await golden.screen('new-password-typed'); // the box shows the password as plain text
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await golden.step('เปลี่ยนรหัสผ่านเป็น drive2026');
  await golden.stateChange('change-owner-password', before);

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await page.getByPlaceholder('ชื่อผู้ใช้ อีเมล หรือเบอร์โทร').fill('dg1688');
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill('123456');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByText('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง').filter({ visible: true })).toBeVisible();
  await golden.step('ออกจากระบบ แล้วเข้าด้วยรหัสเดิม ถูกปฏิเสธ');
  await golden.screen('old-password-refused');

  await app.login('dg1688', 'drive2026');
  await golden.step('เข้าด้วยรหัสใหม่ได้');

  // The demo-only button on the sign-in screen still lets anyone in as the owner without the new password.
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  const beforeDemo = await app.state();
  await page.getByRole('button', { name: 'กลับเข้าโหมดทดลองเจ้าของร้านโดยไม่กรอกรหัส' }).click();
  await expect(page.getByPlaceholder('กรอกรหัสผ่าน')).toBeHidden();
  await golden.step('ออกจากระบบ แล้วกดเข้าโหมดทดลองโดยไม่กรอกรหัส ยังเข้าได้');
  await golden.stateChange('enter-without-password', beforeDemo);
});
