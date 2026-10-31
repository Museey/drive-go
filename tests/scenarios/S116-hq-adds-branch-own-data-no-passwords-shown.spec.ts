import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { allPasswordCells, hiddenPasswords, hqOwnData } from '../support/hq-own-data';
import type { Page } from '@playwright/test';
import { FIXTURE_LINE, licenceLine } from '../support/licence';

test.use({ dataset: 'franchise-trial' });

// Replaces S94 in the new system (tests/intentional-changes.json, decisions
// Q3 and A3): HQ works on its own data set, so HQ's screens show the chain's
// name, its own licence line and its own badges (tests/support/hq-own-data.ts),
// and the branch register shows ******** instead of passwords; HQ gives the new
// head the password from the message shown when the branch is made. Every step,
// message, data change and the rest of every screen are still S94's.
const S94 = 'S94-hq-adds-branch-and-accounts.spec.ts';

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

test('S116 ระบบใหม่: สำนักงานใหญ่ (ข้อมูลของ HQ เอง) เพิ่มสาขาใหม่ ออกรหัสหัวหน้าสาขา ทะเบียนไม่แสดงรหัสผ่าน รีเซ็ตรหัส แล้วหัวหน้าสาขาใหม่เข้าระบบ', async ({ app, page }, testInfo) => {
  test.slow();
  // Passwords the system makes are 8 digits, not 4 (security review proposal 2, the owner's decision of 2026-10-31):
  // the messages that tell them are swapped.
  const golden = legacyGolden(S94, { app, page, testInfo }, { numbers: [['b003 / 3220', 'b003 / 32208179'], ['b003-2 / 9674', 'b003-2 / 96748680']] });
  await app.loginAsOwner();
  await page.getByRole('button', { name: '🏬 สาขา · รหัสผู้ใช้ · สิทธิ' }).click();
  await expect(page.getByText('2 สาขา', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('HQ เปิดทะเบียนสาขา');
  const before = await app.state();

  await page.getByRole('button', { name: '+ เพิ่มสาขาใหม่ + ออกรหัส HB อัตโนมัติ' }).click();
  await golden.step('ถามชื่อสาขาใหม่');
  await answerPrompt(page, 'สาขาลาดพร้าว', 'สร้างสาขา + ออกรหัส');
  // The new head's password is told once, in the message (the same message as S94's).
  const created = page.getByText(/^สร้าง B003 · สาขาลาดพร้าว แล้ว — รหัส HB: b003 \/ \d{8}$/);
  await expect(created).toBeVisible();
  const headPass = (await created.innerText()).trim().split(' / ')[1];
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
  await answerPrompt(page, '55555555', 'บันทึก');
  // A3: the register shows ******** (the test copy showed 5555).
  await expect(deputy.getByRole('cell', { name: '********', exact: true })).toBeVisible();
  await golden.step('รีเซ็ตรหัสผ่านของ b003.deputy แล้ว');
  await card.scrollIntoViewIfNeeded();
  await golden.screen('branch-b003-card', { mask: [...await hqOwnData(page), await hiddenPasswords(card, 2), allPasswordCells(page)] });
  await golden.stateChange('new-branch', before);

  await page.getByRole('button', { name: '📊 แดชบอร์ดรวมทุกสาขา' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'B003 · สาขาลาดพร้าว' })).toContainText('ยังไม่เริ่มใช้งาน');
  await golden.step('แดชบอร์ดเห็นสาขา B003 ยังไม่เริ่มใช้งาน');

  // The head of the new branch signs in with the password from the message (the register shows ********).
  await page.getByRole('button', { name: '🏬 สาขา · รหัสผู้ใช้ · สิทธิ' }).click();
  const head = holder('ผู้จัดการสาขาลาดพร้าว');
  const headUser = await head.getByRole('textbox').inputValue();
  await expect(head.getByRole('cell').nth(2)).toHaveText('********');
  expect(headUser).toBe('b003');
  await signOut(page);
  await app.login(headUser, headPass);
  await expect(page.getByRole('button', { name: /HQ ศูนย์กลางแฟรนไชส์/ })).toBeHidden();
  await golden.step('หัวหน้าสาขา B003 เข้าสู่ระบบ เห็นสาขาว่าง');
  // Task 3.15: the licence shown is the server's (tests/support/licence.ts), checked by its text and left out of the picture.
  await expect(licenceLine(page)).toHaveText(FIXTURE_LINE);   // one date for the chain (15.7); the legacy new branch had a year from today
  await golden.screen('b003-home', { mask: [licenceLine(page)] });

  await signOut(page);
  await app.login('b003.deputy', '55555555');
  await golden.step('รองผู้จัดการเข้าสู่ระบบด้วยรหัสที่รีเซ็ต');
  golden.done();
});
