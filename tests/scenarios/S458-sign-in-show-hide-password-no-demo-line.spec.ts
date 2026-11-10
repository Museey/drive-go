import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S411 in the new system (tests/intentional-changes.json, decisions A1, A3, as S103 and S105 replace S00 and
// S03): the sign-in screen has no test account line ("บัญชีทดสอบ: dg1688 / 123456 …") and no way in without a password,
// so the sign-in card is shorter and S411's picture of it cannot be taken (S105 leaves out S03's sign-in picture the
// same way). What the picture showed is checked here: the typed password shown in its box and the eye button pressed.
// Every step is S411's.
const S411 = 'S411-sign-in-show-hide-password.spec.ts';

test('S458 ระบบใหม่: กดปุ่มรูปตาเพื่อดูรหัสผ่านที่พิมพ์ในหน้าเข้าสู่ระบบ (ไม่มีบัญชีทดสอบ) ซ่อนอีกครั้ง แล้วเข้าสู่ระบบ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S411, { app, page, testInfo });
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
  // S411's picture "password-shown": the password is shown as typed; the test account line and the way in
  // without a password are not there (A1, A3).
  await expect(password).toBeVisible();
  await expect(password).toHaveValue('123456');
  await expect(studio.getByText('บัญชีทดสอบ', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /โดยไม่กรอกรหัส/ })).toHaveCount(0);
  await expect(page.getByText(/โดยไม่กรอกรหัส/)).toHaveCount(0);

  await studio.getByRole('button', { name: 'ซ่อนรหัสผ่าน' }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await golden.step('กดซ่อนรหัสผ่าน');

  await studio.locator('[type="submit"]:visible').click();
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
  await golden.step('เข้าสู่ระบบแล้ว');
  golden.done();
});
