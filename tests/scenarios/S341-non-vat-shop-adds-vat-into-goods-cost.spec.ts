import { test, expect } from '../support/test';

// "ปรับต้นทุน" of the goods receipt window shows a "VAT 7%" quick button only to a shop that is not VAT-registered
// (it cannot claim the input tax back, so the VAT goes into the cost): no scenario pressed it (docs/BEHAVIORS.md).
test('S341 ร้านที่ไม่จด VAT รับสินค้าแล้วกดปุ่มลัด VAT 7% บวกภาษีซื้อเข้าต้นทุนสินค้า', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^10 ตั้งค่าองค์กร/ }).click();
  await page.getByRole('button', { name: 'ไม่จดภาษีมูลค่าเพิ่ม', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await page.getByRole('button', { name: 'ยืนยัน ปิดการจดทะเบียน' }).click();
  await app.settle();
  await golden.step('ร้านปิดการจดทะเบียนภาษีมูลค่าเพิ่ม');

  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  const lines = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  await lines.nth(0).getByRole('spinbutton').nth(0).fill('4');
  await lines.nth(0).getByRole('spinbutton').nth(1).fill('800');
  await golden.step('ผ้าเบรกหน้า 4 ชิ้น ราคาตามบิล 800 (ยังไม่รวม VAT)');

  await page.getByRole('button', { name: 'ติ๊กทั้งหมด' }).click();
  await page.getByRole('button', { name: /^ปรับต้นทุนแถวที่ติ๊ก/ }).click();
  await expect(page.getByRole('button', { name: 'VAT 7%' })).toBeVisible();
  await golden.step('หน้าต่างปรับต้นทุนมีปุ่มลัด VAT 7%');
  await page.getByRole('button', { name: 'VAT 7%' }).click();
  await golden.step('กด VAT 7% ต้นทุน 800 → 856');
  await golden.screen('adjust-vat');
  await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await golden.step('ยืนยัน ต้นทุนรวม VAT แล้ว');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  await golden.step('บันทึกใบรับสินค้า');
  await golden.stateChange('save-gr', before);
});
