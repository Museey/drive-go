import { test, expect } from '../support/test';
import { legacyStateChange, legacySteps, sameScreen } from '../support/legacy-golden';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';
import { ownerPanelLicence } from '../support/licence';

// Replaces S03 in the new system (tests/intentional-changes.json): the old
// password is checked on the server and the new one stored there (T7); the
// sign-in screen has no demo account line (A3) and no way in without a
// password (A1), so S03's last step and its sign-in screenshot cannot happen.
// Every other step and screen is still S03's.
const S03 = 'S03-owner-changes-password.spec.ts';

test('S105 ระบบใหม่: เจ้าของร้านเปลี่ยนรหัสผ่าน (ตรวจและเก็บที่ server) รหัสเดิมใช้ไม่ได้ รหัสใหม่ใช้ได้ และไม่มีทางเข้าโดยไม่กรอกรหัส', async ({ app, page }, testInfo) => {
  test.slow();
  // A new password has at least 8 characters, not 6 (security review proposal 2, the owner's decision of 2026-10-31).
  const steps = legacySteps(S03, app, [['อย่างน้อย 6 ตัวอักษร', 'อย่างน้อย 8 ตัวอักษร']]);
  await app.loginAsOwner();
  await steps.same('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(page.getByRole('heading', { name: /บัญชีผู้ซื้อระบบ \(เจ้าของร้าน\)/ })).toBeVisible();
  const before = await app.state();
  const answer = async (text: string, button: string) => {
    await page.locator('input:focus').waitFor();
    await page.keyboard.type(text);
    await page.getByRole('button', { name: button, exact: true }).filter({ visible: true }).click();
  };

  await page.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }).click();
  await expect(page.getByText('ใส่รหัสผ่านเดิม', { exact: true })).toBeVisible();
  await steps.same('กดเปลี่ยนรหัสผ่าน ระบบถามรหัสผ่านเดิม');
  await answer('654321', 'ต่อไป');
  await steps.same('ใส่รหัสผ่านเดิมผิด');

  await page.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }).click();
  await answer('123456', 'ต่อไป');
  await expect(page.getByText('ตั้งรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)')).toBeVisible();
  await steps.same('ใส่รหัสผ่านเดิมถูก ระบบให้ตั้งรหัสใหม่');
  await answer('dg123', 'บันทึก');
  await steps.same('รหัสใหม่สั้นกว่า 6 ตัว');

  await page.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }).click();
  await answer('123456', 'ต่อไป');
  await expect(page.getByText('ตั้งรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)')).toBeVisible();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('drive2026');
  // Task 3.15: the licence shown is the server's (tests/support/licence.ts), checked by its text and left out of the picture.
  // The prompt's line says 8 characters, not 6 (checked above): left out of the picture too.
  await sameScreen(page, app, testInfo, S03, 'new-password-typed', { mask: [...await ownerPanelLicence(page), page.getByText('ตั้งรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)')] });
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await steps.same('เปลี่ยนรหัสผ่านเป็น drive2026');
  await app.settle();
  expect(formatDiff(stateDiff(before, await app.state()))).toBe(legacyStateChange(S03, 'change-owner-password'));

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await page.getByPlaceholder('ชื่อผู้ใช้ อีเมล หรือเบอร์โทร').fill('dg1688');
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill('123456');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByText('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง').filter({ visible: true })).toBeVisible();
  await steps.same('ออกจากระบบ แล้วเข้าด้วยรหัสเดิม ถูกปฏิเสธ');
  // (S03's screenshot here showed the demo account line, which is gone.)

  await app.login('dg1688', 'drive2026');
  await steps.same('เข้าด้วยรหัสใหม่ได้');
  expect((await app.state()).DGB.shop.pass).toBe('********');

  // S03's last step used the demo way in without a password: there is none.
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await expect(page.getByRole('button', { name: /โดยไม่กรอกรหัส/ })).toHaveCount(0);
  steps.skip('ออกจากระบบ แล้วกดเข้าโหมดทดลองโดยไม่กรอกรหัส ยังเข้าได้');
  steps.done();
});
