import { test, expect } from '../support/test';

test('S10 สร้างใบเสนอราคาใหม่ให้ลูกค้าเดิม พร้อมอะไหล่ในสต็อกและค่าแรง แล้วบันทึก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  await golden.step('ฟอร์มใบเสนอราคาใหม่');

  // ลูกค้าเดิม: ปรีชา ทองสุข (เลือกจากรายการที่เด้งใต้ช่องค้นหา)
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill('ปรีชา');
  await custBox.locator('..').getByText('ปรีชา ทองสุข').click();
  await expect(custBox).toHaveValue('ปรีชา ทองสุข · 085-724-8674');
  await page.getByPlaceholder('1.', { exact: true }).fill('แบตเตอรี่หมด สตาร์ทไม่ติด');

  // อะไหล่ในสต็อก: EL-118 แบตเตอรี่ 75Ah (คงเหลือ 20)
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('EL-118');
  await page.getByRole('option', { name: /EL-118/ }).click();

  // ค่าแรง 350 บาท
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).click();
  const labor = page.getByRole('row')
    .filter({ has: page.getByText('ค่าแรง', { exact: true }) })
    .filter({ has: page.getByRole('spinbutton') });
  await labor.getByRole('textbox').fill('ค่าแรงเปลี่ยนแบตเตอรี่');
  await labor.getByRole('spinbutton').nth(1).fill('350'); // ช่องที่ 2 ของแถว = ราคา/หน่วย
  await labor.getByRole('spinbutton').nth(1).press('Tab');
  const net = page.getByRole('row', { name: /ยอดรวมสุทธิ/ }).filter({ visible: true }).first(); // แถวแรก = ในฟอร์ม (ที่เหลืออยู่ในตัวอย่างก่อนพิมพ์)
  await expect(net).toContainText('4,451.20');
  await net.scrollIntoViewIfNeeded();
  await golden.step('กรอกลูกค้า อาการ อะไหล่ และค่าแรงแล้ว');
  await golden.screen('quote-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true })).toBeVisible();
  await golden.step('หลังบันทึกใบเสนอราคา');
  await golden.stateChange('save-quote', before);

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const newRow = page.getByText('MA-QT261000005', { exact: true }).filter({ visible: true });
  await expect(newRow).toBeVisible();
  await newRow.scrollIntoViewIfNeeded();
  await golden.step('รายการใบเสนอราคาหลังบันทึก');
  await golden.screen('quote-list');
});
