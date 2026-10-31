import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';
import { legacyStateChange, legacySteps, sameScreen } from '../support/legacy-golden';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';

test.use({ dataset: 'franchise-trial' });

// Replaces S96 in the new system (tests/intentional-changes.json, decision A3):
// the branch head's account panel shows ******** instead of each employee's
// password, so the head gives the employee the password from the message shown
// when it is set. Every step, every message, the rest of each screen and every
// data change are still S96's. Task 3.9 (finding 42, approved): the warehouse employee has no
// "ดูยอดเงินและมูลค่าในหน้าแรก", so the home card of sales waiting for payment keeps its count and drops the amount.
const S96 = 'S96-branch-head-issues-staff-login.spec.ts';

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

// The legacy prompt box has no label; it takes the focus when the prompt opens.
async function answerPrompt(page: Page, value: string, button: string) {
  const ok = page.getByRole('button', { name: button, exact: true }).filter({ visible: true });
  await ok.waitFor();
  await page.locator('input:focus').waitFor();
  if (value) await page.keyboard.type(value);
  await ok.click();
}

test('S110 ระบบใหม่: หัวหน้าสาขาออกบัญชีให้พนักงานคลัง ตารางบัญชีไม่แสดงรหัสผ่าน รหัสใหม่แจ้งในข้อความครั้งเดียว พนักงานเข้าระบบได้', async ({ app, page }, testInfo) => {
  test.slow();
  // Passwords the system makes are 8 digits, not 4 (security review proposal 2, the owner's decision of 2026-10-31):
  // the messages that tell them are swapped.
  const steps = legacySteps(S96, app, [['รหัสผ่าน 3220 ', 'รหัสผ่าน 32208179 '], ['คือ 9674', 'คือ 96748680']]);
  await app.open();
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const panel = page.locator('.panel').filter({ hasText: 'บัญชีเข้าระบบของพนักงาน (SHB) — สาขา B001 สาขาหลัก รังสิต' }).filter({ visible: true });
  await expect(panel).toBeVisible();
  await expect(page.getByText('สาขาแฟรนไชส์ — ส่วนนี้เห็นเฉพาะรหัส HQ')).toBeHidden();
  await steps.same('หัวหน้าสาขา B001 เปิดเมนู 10 เห็นแผงบัญชีพนักงาน (SHB)');
  // A3: every account that has a password shows ******** (the test copy showed 5678).
  const passwords = panel.getByRole('cell', { name: '********', exact: true });
  await expect(passwords).toHaveCount(1);
  await expect(panel.getByRole('cell', { name: /^\d{8}$/ })).toHaveCount(0);
  await sameScreen(page, app, testInfo, S96, 'shb-panel', { mask: [passwords] });
  const before = await app.state();

  const row = panel.getByRole('row').filter({ hasText: 'EMP007' });
  await row.getByRole('button', { name: '+ ออกบัญชีเข้าระบบ' }).click();
  await steps.same('ถามชื่อผู้ใช้ของ สมปอง คลังแน่น');
  await answerPrompt(page, 'b002', 'ต่อไป');
  await expect(row.getByRole('button', { name: '+ ออกบัญชีเข้าระบบ' })).toBeVisible();
  await steps.same('ใช้ชื่อผู้ใช้ของสาขาอื่น ถูกปฏิเสธ');

  await row.getByRole('button', { name: '+ ออกบัญชีเข้าระบบ' }).click();
  await answerPrompt(page, '', 'ต่อไป');
  await expect(row.getByRole('button', { name: 'รีเซ็ตรหัสผ่าน' })).toBeVisible();
  await steps.same('เว้นว่าง ได้ชื่อผู้ใช้ที่ระบบแนะนำ พร้อมรหัสผ่านสุ่ม');

  await row.getByRole('textbox').fill('sompong');
  await row.getByRole('textbox').press('Tab');
  await steps.same('เปลี่ยนชื่อผู้ใช้เป็น sompong');
  await row.getByRole('button', { name: 'รีเซ็ตรหัสผ่าน' }).click();
  // The new password is told once, in the message (the same message as S96's).
  const told = page.getByText(/^รหัสผ่านใหม่ของ สมปอง คลังแน่น คือ \d{8}$/);
  await expect(told).toBeVisible();
  const password = (await told.innerText()).trim().split(' คือ ')[1];
  await steps.same('รีเซ็ตรหัสผ่าน ได้รหัสสุ่มใหม่');
  await expect(row.getByRole('cell').nth(3)).toHaveText('********');
  await sameScreen(page, app, testInfo, S96, 'shb-account-issued', { mask: [panel.getByRole('cell', { name: '********', exact: true })] });
  await app.settle();
  expect(formatDiff(stateDiff(before, await app.state()))).toBe(legacyStateChange(S96, 'staff-account'));

  await signOut(page);
  await app.login('sompong', password);
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button /00 Mr\\.DriveGo/
      - button /04 ใบเสร็จรับเงิน \\/ ใบกำกับภาษี/
      - button /05 ข้อมูลผู้ขาย/
      - button /06 รายจ่าย \\/ ซื้อสินค้า/
      - button /07 สต๊อกอะไหล่/
  `);
  await steps.same('พนักงานคลังเข้าระบบด้วยบัญชีของตัวเอง');
  const waiting = page.locator('#pkgSfHome');
  await expect(waiting).toContainText('ค้างข้ามวัน');
  await expect(waiting).not.toContainText('฿');
  await sameScreen(page, app, testInfo, S96, 'staff-home', { mask: [waiting] });

  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
  const beforeRequest = await app.state();
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดเอง' }).click();
  const line = page.getByRole('table').filter({ hasText: 'จำนวนขอเบิก' }).getByRole('row').nth(1);
  await line.getByRole('combobox').fill('BR-001');
  await line.getByRole('combobox').press('Tab');
  await line.getByRole('spinbutton').fill('12');
  await line.getByRole('spinbutton').press('Tab');
  await page.getByRole('button', { name: '📨 ส่งใบขอเบิกไป HQ' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'REQ-6910-0001' })).toContainText('รอ HQ อนุมัติ');
  await steps.same('พนักงานคลังส่งใบขอเบิกไป HQ');
  await app.settle();
  expect(formatDiff(stateDiff(beforeRequest, await app.state()))).toBe(legacyStateChange(S96, 'staff-request'));
  steps.done();
});
