import { test, expect } from '../support/test';

test.use({ dataset: 'franchise-trial' });

const ALL_MENUS = `
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button /00 Mr\\.DriveGo/
      - button /01 ลูกค้าสัมพันธ์/
      - button /P1 DriveGo ProX · Ecosystem/
      - button /02 ข้อมูลลูกค้า/
      - button /03 ใบเสนอราคา \\/ อนุมัติซ่อม/
      - button /04 ใบเสร็จรับเงิน \\/ ใบกำกับภาษี/
      - button /05 ข้อมูลผู้ขาย/
      - button /06 รายจ่าย \\/ ซื้อสินค้า/
      - button /07 สต๊อกอะไหล่/
      - button /08 บัญชี - การเงิน/
      - button /09 งานบุคคล/
      - button /P2 ห้องข้อมูลเทคนิค/
      - button /10 ตั้งค่าองค์กร/
      - button /11 ตั้งค่าเพิ่มเติม/
  `;

test('S98 สำนักงานใหญ่ปิดโหมดแฟรนไชส์ (เดโม) แล้วเปิดใหม่ด้วยรหัสเปิดใช้ จากนั้นต้องเข้าสู่ระบบใหม่', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  await golden.step('HQ เปิดเมนู 10');
  const before = await app.state();

  await page.getByRole('button', { name: 'ปิดโหมดแฟรนไชส์ (เดโม)' }).click();
  await golden.step('กดปิดโหมดแฟรนไชส์ ถามยืนยัน');
  await page.getByRole('button', { name: 'ปิดโหมด', exact: true }).click();
  // Legacy behaviour reported to the owner: the workspace stays open as a single shop
  // (branch B001's data, every menu) with no franchise account signed in.
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(ALL_MENUS);
  await golden.step('กลับสู่โหมดอู่เดี่ยว เห็นทุกเมนูของสาขา B001');
  await golden.screen('single-shop-mode');
  await golden.stateChange('deactivate', before);

  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const code = page.getByPlaceholder('รหัสเปิดใช้จากใบสั่งซื้อแพ็กเกจ Franchise');
  await expect(code).toBeVisible();
  await golden.step('เมนู 10 แสดงแผงเปิดใช้โหมดแฟรนไชส์');
  await golden.screen('activation-panel');
  const beforeActivate = await app.state();

  await code.fill('PROX-FR-2025');
  await page.getByRole('button', { name: '🔓 เปิดใช้โหมดแฟรนไชส์' }).click();
  await golden.step('ใส่รหัสเปิดใช้ผิด');

  // The demo code is printed under the box; lower case is accepted.
  await code.fill('prox-fr-2026');
  await page.getByRole('button', { name: '🔓 เปิดใช้โหมดแฟรนไชส์' }).click();
  await expect(code).toBeHidden();
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(ALL_MENUS);
  await golden.step('เปิดใช้โหมดแฟรนไชส์แล้ว แต่ยังเห็นทุกเมนูโดยไม่มีบัญชีเข้าระบบ');
  await golden.screen('after-activate');
  await golden.stateChange('activate', beforeActivate);

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await golden.step('กดออกจากระบบ ถามยืนยัน');
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await golden.step('ออกจากระบบ กลับมาหน้าเข้าสู่ระบบ');

  await app.login('hq', '1234');
  await expect(page.getByRole('button', { name: '📊 แดชบอร์ดรวมทุกสาขา' })).toBeVisible();
  await golden.step('HQ เข้าสู่ระบบอีกครั้ง');
});
