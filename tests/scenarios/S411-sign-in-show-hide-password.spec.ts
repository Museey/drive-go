import { test, expect } from '../support/test';

// The eye button beside the password on the sign-in screen: shows what was typed, hides it again, then signs in.
test('S411 กดปุ่มรูปตาเพื่อดูรหัสผ่านที่พิมพ์ในหน้าเข้าสู่ระบบ ซ่อนอีกครั้ง แล้วเข้าสู่ระบบ', async ({ app, page, golden }) => {
  await app.open();
  await golden.step('หน้าเข้าสู่ระบบ');

  const studio = page.locator('#drivego-studio');
  await studio.getByPlaceholder(/ชื่อผู้ใช้/).fill('dg1688');
  const password = studio.getByPlaceholder('กรอกรหัสผ่าน');
  await password.fill('123456');
  await expect(password).toHaveAttribute('type', 'password');

  await studio.getByRole('button', { name: 'แสดงรหัสผ่าน' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(studio.getByRole('button', { name: 'ซ่อนรหัสผ่าน' })).toHaveAttribute('aria-pressed', 'true');
  await golden.step('กดแสดงรหัสผ่าน');
  await golden.screen('password-shown');

  await studio.getByRole('button', { name: 'ซ่อนรหัสผ่าน' }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await golden.step('กดซ่อนรหัสผ่าน');

  await studio.locator('[type="submit"]:visible').click();
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
  await golden.step('เข้าสู่ระบบแล้ว');
});
