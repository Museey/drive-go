import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';

test.use({ dataset: 'franchise-trial' });

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

test('S96 หัวหน้าสาขาออกบัญชีเข้าระบบให้พนักงานคลัง พนักงานเข้าระบบเห็นเฉพาะเมนูตามสิทธิและส่งใบขอเบิกได้', async ({ app, page, golden }) => {
  await app.open();
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const panel = page.locator('.panel').filter({ hasText: 'บัญชีเข้าระบบของพนักงาน (SHB) — สาขา B001 สาขาหลัก รังสิต' }).filter({ visible: true });
  await expect(panel).toBeVisible();
  // The branch register and its passwords are for HQ only.
  await expect(page.getByText('สาขาแฟรนไชส์ — ส่วนนี้เห็นเฉพาะรหัส HQ')).toBeHidden();
  await golden.step('หัวหน้าสาขา B001 เปิดเมนู 10 เห็นแผงบัญชีพนักงาน (SHB)');
  await golden.screen('shb-panel');
  const before = await app.state();

  const row = panel.getByRole('row').filter({ hasText: 'EMP007' });
  await row.getByRole('button', { name: '+ ออกบัญชีเข้าระบบ' }).click();
  await golden.step('ถามชื่อผู้ใช้ของ สมปอง คลังแน่น');
  // Usernames are unique across the whole chain: b002 belongs to the head of another branch.
  await answerPrompt(page, 'b002', 'ต่อไป');
  await expect(row.getByRole('button', { name: '+ ออกบัญชีเข้าระบบ' })).toBeVisible();
  await golden.step('ใช้ชื่อผู้ใช้ของสาขาอื่น ถูกปฏิเสธ');

  // Leaving the box empty takes the suggested username.
  await row.getByRole('button', { name: '+ ออกบัญชีเข้าระบบ' }).click();
  await answerPrompt(page, '', 'ต่อไป');
  await expect(row.getByRole('button', { name: 'รีเซ็ตรหัสผ่าน' })).toBeVisible();
  await golden.step('เว้นว่าง ได้ชื่อผู้ใช้ที่ระบบแนะนำ พร้อมรหัสผ่านสุ่ม');

  await row.getByRole('textbox').fill('sompong');
  await row.getByRole('textbox').press('Tab');
  await golden.step('เปลี่ยนชื่อผู้ใช้เป็น sompong');
  await row.getByRole('button', { name: 'รีเซ็ตรหัสผ่าน' }).click();
  await golden.step('รีเซ็ตรหัสผ่าน ได้รหัสสุ่มใหม่');
  await golden.screen('shb-account-issued');
  await golden.stateChange('staff-account', before);

  // The branch head reads the new password from the screen and gives it to the employee.
  const password = (await row.getByRole('cell').nth(3).innerText()).trim();
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
  await golden.step('พนักงานคลังเข้าระบบด้วยบัญชีของตัวเอง');
  await golden.screen('staff-home');

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
  await golden.step('พนักงานคลังส่งใบขอเบิกไป HQ');
  await golden.stateChange('staff-request', beforeRequest);
});
