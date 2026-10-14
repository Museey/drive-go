import { test, expect } from '../support/test';

test('S41 เจ้าของร้านออกบัญชีให้แคชเชียร์ แคชเชียร์เข้าระบบด้วยเบอร์โทร เห็นเฉพาะเมนูตามสิทธิ และถูกปฏิเสธเมื่อเปิดฐานลูกค้า', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const cashierRow = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashierRow.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await golden.step('ตั้งรหัสผ่านให้แคชเชียร์ EMP008');

  const before = await app.state();
  // The password box has no label; it takes the focus when the prompt opens.
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('8888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashierRow.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await golden.step('ออกบัญชีให้แคชเชียร์แล้ว');

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await golden.step('ออกจากระบบ กลับมาหน้าเข้าสู่ระบบ');

  await app.login('092-333-4455', '8888');
  await golden.step('แคชเชียร์เข้าสู่ระบบ');
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button "00 Mr.DriveGo"
      - button /04 ใบเสร็จรับเงิน \\/ ใบกำกับภาษี/
  `);
  await golden.screen('cashier-home');

  await page.getByRole('button', { name: 'ดูฐานลูกค้า & รถ' }).click();
  await golden.step('แคชเชียร์กดดูฐานลูกค้า ถูกปฏิเสธ');

  await page.getByRole('button', { name: /04 ใบเสร็จรับเงิน/ }).click();
  await golden.step('แคชเชียร์เปิดเมนู 04 ได้');
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button "00 Mr.DriveGo"
      - button /04 ใบเสร็จรับเงิน \\/ ใบกำกับภาษี/
      - button "└ 4.2 ใบแจ้งหนี้"
      - button "└ 4.3 ใบเสร็จรับเงิน"
      - button "└ 4.4 ใบหัก ณ ที่จ่าย"
  `);
  await expect(page.getByRole('heading', { name: '4.1 ตัดสต็อกสินค้า' })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true })).toHaveCount(0);
  await golden.screen('cashier-receipts');
  await golden.stateChange('cashier-account', before);
});
