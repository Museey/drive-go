import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';

test.use({ dataset: 'franchise-trial' });

// The legacy prompt box has no label; it takes the focus when the prompt opens.
async function answerPrompt(page: Page, value: string, button: string) {
  const ok = page.getByRole('button', { name: button, exact: true }).filter({ visible: true });
  await ok.waitFor();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type(value);
  await ok.click();
}

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

test('S94 สำนักงานใหญ่เพิ่มสาขาใหม่ ออกรหัสหัวหน้าสาขา ออกรหัสเพิ่ม เปลี่ยนชื่อผู้ใช้ รีเซ็ตรหัสผ่าน แล้วหัวหน้าสาขาใหม่เข้าระบบ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '🏬 สาขา · รหัสผู้ใช้ · สิทธิ' }).click();
  await expect(page.getByText('2 สาขา', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('HQ เปิดทะเบียนสาขา');
  const before = await app.state();

  await page.getByRole('button', { name: '+ เพิ่มสาขาใหม่ + ออกรหัส HB อัตโนมัติ' }).click();
  await golden.step('ถามชื่อสาขาใหม่');
  await answerPrompt(page, 'สาขาลาดพร้าว', 'สร้างสาขา + ออกรหัส');
  // Both the HQ console and menu 10 draw the branch cards; use the one on screen.
  const card = page.locator('.permbox').filter({ hasText: 'B003 · สาขาลาดพร้าว' }).filter({ visible: true });
  await expect(card).toBeVisible();
  await golden.step('สร้างสาขา B003 พร้อมรหัส HB');

  await card.getByLabel('ผู้จัดการสาขา').fill('สมศักดิ์ ลาดพร้าว');
  await card.getByLabel('ผู้จัดการสาขา').press('Tab');
  await card.getByLabel('เบอร์โทร').fill('02-333-3333');
  await card.getByLabel('เบอร์โทร').press('Tab');
  await card.getByLabel('ที่อยู่').fill('ถ.ลาดพร้าว ซอย 71 กรุงเทพฯ');
  await card.getByLabel('ที่อยู่').press('Tab');
  await golden.step('กรอกผู้จัดการ เบอร์โทร ที่อยู่ของสาขา B003');

  await card.getByRole('button', { name: '+ ออกรหัสเพิ่ม' }).click();
  await golden.step('ถามชื่อผู้ถือรหัสเพิ่ม');
  await answerPrompt(page, 'รองผู้จัดการสาขาลาดพร้าว', 'ออกรหัส');
  const holder = (name: string) => card.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });
  const deputy = holder('รองผู้จัดการสาขาลาดพร้าว');
  await expect(deputy).toBeVisible();
  await golden.step('ออกรหัส HB เพิ่มให้รองผู้จัดการ');

  // Usernames are unique across HQ, every branch and every staff account.
  const deputyUser = deputy.getByRole('textbox');
  await deputyUser.fill('b001');
  await deputyUser.press('Tab');
  await expect(deputyUser).not.toHaveValue('b001');
  await golden.step('ตั้งชื่อผู้ใช้ซ้ำกับสาขาอื่น ถูกปฏิเสธ');
  await deputyUser.fill('B003.Deputy');
  await deputyUser.press('Tab');
  await golden.step('เปลี่ยนชื่อผู้ใช้เป็น b003.deputy');

  await deputy.getByRole('button', { name: 'รีเซ็ตรหัสผ่าน' }).click();
  await golden.step('ถามรหัสผ่านใหม่');
  await answerPrompt(page, '5555', 'บันทึก');
  await expect(deputy.getByRole('cell', { name: '5555', exact: true })).toBeVisible();
  await golden.step('รีเซ็ตรหัสผ่านของ b003.deputy แล้ว');
  await card.scrollIntoViewIfNeeded();
  await golden.screen('branch-b003-card');
  await golden.stateChange('new-branch', before);

  await page.getByRole('button', { name: '📊 แดชบอร์ดรวมทุกสาขา' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'B003 · สาขาลาดพร้าว' })).toContainText('ยังไม่เริ่มใช้งาน');
  await golden.step('แดชบอร์ดเห็นสาขา B003 ยังไม่เริ่มใช้งาน');

  // The head of the new branch signs in with the password HQ sees in the register.
  await page.getByRole('button', { name: '🏬 สาขา · รหัสผู้ใช้ · สิทธิ' }).click();
  const head = holder('ผู้จัดการสาขาลาดพร้าว');
  const headUser = await head.getByRole('textbox').inputValue();
  const headPass = (await head.getByRole('cell').nth(2).innerText()).trim();
  expect(headUser).toBe('b003');
  await signOut(page);
  await app.login(headUser, headPass);
  await expect(page.getByRole('button', { name: /HQ ศูนย์กลางแฟรนไชส์/ })).toBeHidden();
  await golden.step('หัวหน้าสาขา B003 เข้าสู่ระบบ เห็นสาขาว่าง');
  await golden.screen('b003-home');

  await signOut(page);
  await app.login('b003.deputy', '5555');
  await golden.step('รองผู้จัดการเข้าสู่ระบบด้วยรหัสที่รีเซ็ต');
});
