import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';
import { legacyStateChange, legacySteps, sameScreen } from '../support/legacy-golden';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';

test.use({ dataset: 'franchise-trial' });

// Replaces S99 in the new system (tests/intentional-changes.json, decision A3):
// the branch head's account panel shows ******** instead of each employee's
// password. Every step, the rest of the screen and every data change are
// still S99's.
const S99 = 'S99-branch-head-suspends-staff-login.spec.ts';

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

const shbPanel = (page: Page) => page.locator('.panel')
  .filter({ hasText: 'บัญชีเข้าระบบของพนักงาน (SHB) — สาขา B001 สาขาหลัก รังสิต' }).filter({ visible: true });

test('S111 ระบบใหม่: หัวหน้าสาขาระงับบัญชีพนักงาน ตารางบัญชีไม่แสดงรหัสผ่าน พนักงานเข้าระบบไม่ได้ แล้วเปิดใช้คืน', async ({ app, page }, testInfo) => {
  const steps = legacySteps(S99, app);
  await app.open();
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const staff = shbPanel(page).getByRole('row').filter({ hasText: 'EMP001' });
  await expect(staff.getByRole('textbox')).toHaveValue('staff001');
  await steps.same('หัวหน้าสาขา B001 เปิดแผงบัญชีพนักงาน');
  const before = await app.state();

  await staff.getByRole('button', { name: '⏸ ระงับ' }).click();
  await expect(staff.getByRole('button', { name: '▶ เปิดใช้' })).toBeVisible();
  await steps.same('ระงับบัญชี staff001');
  // A3: the password column shows ******** (the test copy showed 5678).
  const passwords = shbPanel(page).getByRole('cell', { name: '********', exact: true });
  await expect(passwords).toHaveCount(1);
  await expect(shbPanel(page).getByRole('cell', { name: /^\d{4}$/ })).toHaveCount(0);
  await sameScreen(page, app, testInfo, S99, 'staff001-suspended', { mask: [passwords] });
  await app.settle();
  expect(formatDiff(stateDiff(before, await app.state()))).toBe(legacyStateChange(S99, 'suspend'));

  await signOut(page);
  const studio = page.locator('#drivego-studio');
  await studio.getByPlaceholder(/ชื่อผู้ใช้/).fill('staff001');
  await studio.getByPlaceholder('กรอกรหัสผ่าน').fill('5678');
  await studio.locator('[type="submit"]:visible').click();
  await expect(studio.getByText('บัญชีนี้ถูกระงับการใช้งาน — ติดต่อหัวหน้าสาขา', { exact: true })).toBeVisible();
  await steps.same('พนักงานที่ถูกระงับเข้าระบบไม่ได้');

  await app.login('b001', '1234');
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const beforeReopen = await app.state();
  await staff.getByRole('button', { name: '▶ เปิดใช้' }).click();
  await expect(staff.getByRole('button', { name: '⏸ ระงับ' })).toBeVisible();
  await steps.same('หัวหน้าสาขาเปิดใช้บัญชี staff001 คืน');
  await app.settle();
  expect(formatDiff(stateDiff(beforeReopen, await app.state()))).toBe(legacyStateChange(S99, 'reopen'));

  await signOut(page);
  await app.login('staff001', '5678');
  await steps.same('พนักงานเข้าระบบได้อีกครั้ง');
  steps.done();
});
