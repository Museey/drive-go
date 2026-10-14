import { test, expect } from '../support/test';

test('S17 สร้างใบตัดสต็อกขายตรงใหม่ (ไม่ผ่านใบเสนอราคา) เลขที่เอกสารต่อจากใบล่าสุด แล้วบันทึกรอรับชำระ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await golden.step('หน้า 4.1 ตัดสต็อกสินค้า');

  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true }).click();
  await golden.step('ฟอร์มสร้างข้อมูลใหม่');

  // ลูกค้าเดิม: วิภา ศรีสมบูรณ์ (เลือกจากรายการที่เด้งใต้ช่องค้นหา)
  const custBox = page.getByPlaceholder('พิมพ์ชื่อลูกค้า / เบอร์โทร / ทะเบียน').filter({ visible: true });
  await custBox.fill('วิภา');
  await custBox.locator('..').getByText('วิภา ศรีสมบูรณ์').click();
  await expect(custBox).toHaveValue('วิภา ศรีสมบูรณ์ · 084-847-5030');

  // BR-001 ผ้าเบรกหน้า Toyota Revo (คงเหลือ 19) ราคาขาย B 1,380 บาท × 2
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001/ }).click();
  // แถว BR-001: ช่องตัวเลขช่องแรกคือประกัน (เดือน) ช่องที่ 2 คือจำนวน
  const row = page.getByRole('row').filter({ hasText: 'BR-001' }).filter({ has: page.getByRole('spinbutton') });
  await row.getByRole('spinbutton').nth(1).fill('2');
  await row.getByRole('spinbutton').nth(1).press('Tab');
  await expect(page.getByText('2,953.20').filter({ visible: true }).first()).toBeVisible();
  await golden.step('เลือกลูกค้าและสินค้า 2 ชิ้นแล้ว');
  await golden.screen('direct-sale-form');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await golden.step('หลังบันทึกใบตัดสต็อก');
  await golden.stateChange('direct-sale', before);
  await golden.screen('saved');
});
