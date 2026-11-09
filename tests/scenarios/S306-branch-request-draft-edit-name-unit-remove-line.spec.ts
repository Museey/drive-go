import { test, expect } from '../support/test';

test.use({ dataset: 'franchise-trial' });

// The branch's request to HQ (07 → ★ เบิกสินค้าจาก HQ): typing the product name and unit of a line by hand, and
// "✕" to remove a line, which no other scenario did (docs/BEHAVIORS.md). Then the request is sent.
test('S306 สาขาเขียนใบขอเบิกเอง: พิมพ์ชื่อสินค้าและหน่วยนับ ลบบรรทัดด้วย ✕ แล้วส่งใบขอเบิกไป HQ', async ({ app, page, golden }) => {
  await app.open();
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
  await golden.step('หัวหน้าสาขา B001 เปิดแท็บเบิกสินค้าจาก HQ');
  const before = await app.state();

  const add = page.getByRole('button', { name: '+ เพิ่มบรรทัดเอง' });
  await add.click();
  await add.click();
  await add.click();
  const lines = page.getByRole('table').filter({ hasText: 'จำนวนขอเบิก' }).getByRole('row');
  await expect(lines).toHaveCount(4);
  await golden.step('เพิ่มบรรทัดเปล่า 3 บรรทัด');

  // Line 1: a product HQ has no code for — name and unit typed by hand.
  const name1 = lines.nth(1).getByRole('textbox').nth(0), unit1 = lines.nth(1).getByRole('textbox').nth(1);
  await name1.fill('ฟิล์มกรองแสงหน้า (ม้วน)'); await name1.press('Tab');
  await unit1.fill('ม้วน'); await unit1.press('Tab');
  const qty1 = lines.nth(1).getByRole('spinbutton');
  await qty1.fill('2'); await qty1.press('Tab');
  // Line 2: a product by code, its name typed over.
  const code2 = lines.nth(2).getByRole('combobox');
  await code2.fill('EN-501'); await code2.press('Tab');
  const name2 = lines.nth(2).getByRole('textbox').nth(0);
  await expect(name2).toHaveValue('กรองน้ำมันเครื่อง Toyota');
  await name2.fill('กรองน้ำมันเครื่อง Toyota (Revo)'); await name2.press('Tab');
  await golden.step('พิมพ์ชื่อและหน่วยนับเองในบรรทัดแรก แก้ชื่อสินค้า EN-501 ในบรรทัดที่สอง');

  // Remove the empty third line, then the first one.
  await lines.nth(3).getByRole('button', { name: '✕' }).click();
  await expect(lines).toHaveCount(3);
  await golden.step('กด ✕ ลบบรรทัดที่สามที่ว่างอยู่');
  await lines.nth(1).getByRole('button', { name: '✕' }).click();
  await expect(lines).toHaveCount(2);
  await expect(lines.nth(1).getByRole('textbox').nth(0)).toHaveValue('กรองน้ำมันเครื่อง Toyota (Revo)');
  await golden.step('กด ✕ ลบบรรทัดฟิล์มกรองแสง เหลือ EN-501 บรรทัดเดียว');
  await golden.screen('draft-one-line');

  const qty = lines.nth(1).getByRole('spinbutton');
  await qty.fill('12'); await qty.press('Tab');
  await page.getByRole('button', { name: '📨 ส่งใบขอเบิกไป HQ' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'REQ-6910-0001' })).toContainText('รอ HQ อนุมัติ');
  await golden.step('ส่งใบขอเบิกไป HQ');
  await golden.stateChange('send-request', before);
});
