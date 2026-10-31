import { test, expect } from '../support/test';
import { legacyStateChange, legacySteps, sameScreen } from '../support/legacy-golden';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';
import { ownerPanelLicence } from '../support/licence';

// Replaces S05 in the new system (tests/intentional-changes.json): the
// refused sign-in happens on the server (T7) and the sign-in screen has no
// demo account line (A3), so S05's screenshot of that screen cannot match.
// Every step, every other screen and every data change is still S05's.
const S05 = 'S05-suspend-and-reenable-employee-account.spec.ts';

test('S106 ระบบใหม่: เจ้าของร้านระงับบัญชีพนักงาน (server ปฏิเสธการเข้าระบบ) แล้วเปิดใช้อีกครั้ง พนักงานเข้าได้', async ({ app, page }, testInfo) => {
  test.slow();
  // The password given is 8 characters (security review proposal 2): S05's message says 5555.
  const steps = legacySteps(S05, app, [['รหัสผ่าน 5555', 'รหัสผ่าน 55555555']]);
  await app.loginAsOwner();
  await steps.same('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const row = page.getByRole('row').filter({ hasText: 'EMP005' });
  await row.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('55555555');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(row).toContainText('ใช้งานได้');
  await steps.same('ออกบัญชีให้ EMP005 ฝนทิพย์ ต้อนรับ');

  let before = await app.state();
  await row.getByRole('button', { name: '⏸ ระงับ' }).click();
  await expect(row).toContainText('ระงับ');
  await expect(row.getByRole('button', { name: '▶ เปิดใช้' })).toBeVisible();
  await steps.same('กดระงับบัญชี');
  await app.settle();
  expect(formatDiff(stateDiff(before, await app.state()))).toBe(legacyStateChange(S05, 'suspend-account'));
  await row.scrollIntoViewIfNeeded();
  // Task 3.15: the licence shown is the server's (tests/support/licence.ts), checked by its text and left out of the picture.
  // The password cell shows 55555555 where S05 shows 5555 (security review proposal 2), also left out.
  const password = row.getByRole('cell', { name: '55555555', exact: true });
  await expect(password).toBeVisible();
  await sameScreen(page, app, testInfo, S05, 'account-suspended', { mask: [...await ownerPanelLicence(page), password] });

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ชื่อผู้ใช้ อีเมล หรือเบอร์โทร').fill('092-111-2233');
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill('55555555');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByText('บัญชีนี้ถูกระงับการใช้งาน — ติดต่อเจ้าของร้าน').filter({ visible: true })).toBeVisible();
  await steps.same('พนักงานที่ถูกระงับเข้าระบบ ถูกปฏิเสธ');

  await app.login('dg1688', '123456');
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  before = await app.state();
  await row.getByRole('button', { name: '▶ เปิดใช้' }).click();
  await expect(row).toContainText('ใช้งานได้');
  await steps.same('เจ้าของเข้าระบบอีกครั้ง แล้วกดเปิดใช้บัญชี');
  await app.settle();
  expect(formatDiff(stateDiff(before, await app.state()))).toBe(legacyStateChange(S05, 'reenable-account'));

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-111-2233', '55555555');
  await steps.same('พนักงานเข้าระบบได้');
  steps.done();
});
