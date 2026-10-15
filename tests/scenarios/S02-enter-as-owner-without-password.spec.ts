import { test, expect } from '../support/test';

test('S02 กดเข้าโหมดทดลองเจ้าของร้านโดยไม่กรอกรหัสผ่าน จากหน้าเข้าสู่ระบบ', async ({ app, page, golden }) => {
  await app.open();
  await golden.step('หน้าเข้าสู่ระบบ');
  const before = await app.state();

  await page.getByRole('button', { name: 'กลับเข้าโหมดทดลองเจ้าของร้านโดยไม่กรอกรหัส' }).click();
  await expect(page.getByPlaceholder('กรอกรหัสผ่าน')).toBeHidden();
  // This way in (unlike a normal sign-in) shows the demo account switcher at the top of the menu.
  await expect(page.getByLabel('ทดลองสลับบัญชี')).toBeVisible();
  await golden.step('เข้าระบบในนามเจ้าของร้านแล้ว');
  await golden.screen('home-as-owner');
  await golden.stateChange('enter-as-owner', before);
});
