import { test, expect } from '../support/test';

test('S47 ช่างซ่อม (สิทธิ "ไม่เห็นราคา") เข้าระบบ ไม่เห็นคอลัมน์ราคาในทะเบียนอะไหล่ แต่ยังเห็นยอดมูลค่าทุนและยอดใบเสนอราคา', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const mechanicRow = page.getByRole('row').filter({ hasText: 'EMP003' });
  await mechanicRow.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await golden.step('ตั้งรหัสผ่านให้ช่างซ่อม EMP003');

  const before = await app.state();
  // The password box has no label; it takes the focus when the prompt opens.
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('3333');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(mechanicRow.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await golden.step('ออกบัญชีให้ช่างซ่อมแล้ว');

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-444-5566', '3333');
  await golden.step('ช่างซ่อมเข้าสู่ระบบ');
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button "00 Mr.DriveGo"
      - button /02 ข้อมูลลูกค้า/
      - button /03 ใบเสนอราคา \\/ อนุมัติซ่อม/
      - button /04 ใบเสร็จรับเงิน \\/ ใบกำกับภาษี/
      - button /07 สต๊อกอะไหล่/
  `);

  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  const header = page.getByRole('row').filter({ hasText: 'รหัสสินค้า (อู่)' }).filter({ visible: true });
  // The legacy app hides the price columns with CSS, so compare the text the user sees.
  await expect(header).toContainText('ปริมาณคงคลัง', { useInnerText: true });
  await expect(header).not.toContainText('ราคาซื้อ (ต้นทุน)', { useInnerText: true });
  await expect(header).not.toContainText('ราคาขาย', { useInnerText: true });
  await expect(page.getByText('935,410.00 บาท').filter({ visible: true })).toHaveCount(0);
  // Legacy behaviour reported to the owner: the search summary still shows the cost value.
  const costSummary = page.getByText('มูลค่าทุนคงเหลือ (บาท)', { exact: true }).filter({ visible: true });
  await expect(costSummary).toBeVisible();
  await expect(page.getByText('566,870.00', { exact: true }).filter({ visible: true })).toBeVisible();
  await costSummary.scrollIntoViewIfNeeded();
  await golden.step('ช่างซ่อมเปิดทะเบียนอะไหล่');
  await golden.screen('mechanic-stock');

  await page.getByRole('button', { name: /03 ใบเสนอราคา/ }).click();
  // Legacy behaviour reported to the owner: quotation totals are visible to the mechanic.
  await expect(page.getByText('43,452.70', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('ช่างซ่อมเปิดใบเสนอราคา');
  await golden.screen('mechanic-quotes');
  await golden.stateChange('mechanic-account', before);
});
