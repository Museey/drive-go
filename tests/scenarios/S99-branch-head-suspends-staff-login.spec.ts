import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';

test.use({ dataset: 'franchise-trial' });

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

const shbPanel = (page: Page) => page.locator('.panel')
  .filter({ hasText: 'บัญชีเข้าระบบของพนักงาน (SHB) — สาขา B001 สาขาหลัก รังสิต' }).filter({ visible: true });

test('S99 หัวหน้าสาขาระงับบัญชีเข้าระบบของพนักงาน พนักงานเข้าระบบไม่ได้ แล้วเปิดใช้คืน', async ({ app, page, golden }) => {
  await app.open();
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const staff = shbPanel(page).getByRole('row').filter({ hasText: 'EMP001' });
  await expect(staff.getByRole('textbox')).toHaveValue('staff001');
  await golden.step('หัวหน้าสาขา B001 เปิดแผงบัญชีพนักงาน');
  const before = await app.state();

  await staff.getByRole('button', { name: '⏸ ระงับ' }).click();
  await expect(staff.getByRole('button', { name: '▶ เปิดใช้' })).toBeVisible();
  await golden.step('ระงับบัญชี staff001');
  await golden.screen('staff001-suspended');
  await golden.stateChange('suspend', before);

  await signOut(page);
  const studio = page.locator('#drivego-studio');
  await studio.getByPlaceholder(/ชื่อผู้ใช้/).fill('staff001');
  await studio.getByPlaceholder('กรอกรหัสผ่าน').fill('5678');
  await studio.locator('[type="submit"]:visible').click();
  await expect(studio.getByText('บัญชีนี้ถูกระงับการใช้งาน — ติดต่อหัวหน้าสาขา', { exact: true })).toBeVisible();
  await golden.step('พนักงานที่ถูกระงับเข้าระบบไม่ได้');

  await app.login('b001', '1234');
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const beforeReopen = await app.state();
  await staff.getByRole('button', { name: '▶ เปิดใช้' }).click();
  await expect(staff.getByRole('button', { name: '⏸ ระงับ' })).toBeVisible();
  await golden.step('หัวหน้าสาขาเปิดใช้บัญชี staff001 คืน');
  await golden.stateChange('reopen', beforeReopen);

  await signOut(page);
  await app.login('staff001', '5678');
  await golden.step('พนักงานเข้าระบบได้อีกครั้ง');
});
