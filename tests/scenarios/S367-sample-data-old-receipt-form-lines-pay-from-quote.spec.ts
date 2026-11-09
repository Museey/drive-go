import { test, expect } from '../support/test';

// After "ล้างข้อมูลทั้งหมด" + "โหลดข้อมูลตัวอย่าง" "ระบบขายแบบใหม่" is off, and "+ สร้างใบเสร็จรับเงิน / ใบแจ้งหนี้"
// opens the original receipt form (#mReceiptEdit). Its parts no other scenario used (docs/BEHAVIORS.md): closing an
// empty form, "+ เพิ่มบรรทัดค่าแรง / ค่าบริการ", typing a line's name / quantity / price / warranty, × of a line,
// changing a part line's code, the payment boxes เงินสด / เงินเชื่อ, closing without saving, drawing the receipt from a
// quote ("ดึงข้อมูลจากใบเสนอราคา", which first approves the quote), and the customer box of a counter sale (4.4).
test('S367 ข้อมูลตัวอย่าง: ฟอร์มใบเสร็จแบบเดิม เพิ่ม/แก้/ลบบรรทัด วิธีชำระ ปิดไม่บันทึก ดึงจากใบเสนอราคา และลูกค้าบิลหน้าร้าน', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'โหลดข้อมูลตัวอย่าง' }).click();
  await expect(page.getByRole('button', { name: /^00 Mr\.DriveGo/ })).toBeVisible();
  await app.settle();
  await golden.step('ล้างข้อมูลแล้วโหลดข้อมูลตัวอย่าง');
  await golden.counts('sample-data');

  const create = page.getByRole('button', { name: '+ สร้างใบเสร็จรับเงิน / ใบแจ้งหนี้' });
  const close = () => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const lines = page.locator('#rItems tbody tr');

  // An empty form closes straight away.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await golden.step('หน้า 4.1 ใบแจ้งหนี้ / ใบเสร็จรับเงิน (แบบเดิม)');
  await create.click();
  await golden.step('กดสร้างใบเสร็จรับเงิน / ใบแจ้งหนี้ เปิดฟอร์มใบเสร็จแบบเดิม');
  await close();
  await golden.step('กดปิด ฟอร์มว่างปิดทันที');

  // Lines: two labour lines (the first filled in), × the second, a part whose code is then changed.
  await create.click();
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).click();
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).click();
  await expect(lines).toHaveCount(2);
  const first = lines.nth(0);
  await first.getByRole('textbox').fill('ค่าแรงเปลี่ยนผ้าเบรก');
  await first.getByRole('spinbutton').nth(0).fill('2');
  await first.getByRole('spinbutton').nth(1).fill('350');
  await first.getByRole('spinbutton').nth(2).fill('1');
  await expect(first).toContainText('700.00');
  await golden.step('เพิ่มบรรทัดค่าแรง 2 บรรทัด กรอกบรรทัดแรก 2 × 350 รับประกัน 1 เดือน');
  await lines.nth(1).getByRole('button', { name: '×' }).click();
  await expect(lines).toHaveCount(1);
  await golden.step('กด × ลบบรรทัดที่ 2');
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001/ }).click();
  const part = lines.filter({ has: page.locator('input[value="BR-001"]') });
  await part.getByRole('combobox').fill('AC-215');
  await part.getByRole('combobox').press('Tab');
  await expect(lines.filter({ hasText: 'กรองแอร์' }).or(lines.filter({ has: page.locator('input[value="กรองแอร์ในห้องโดยสาร"]') }))).toHaveCount(1);
  await golden.step('เพิ่มอะไหล่ BR-001 แล้วแก้รหัสเป็น AC-215 รายการเปลี่ยนเป็นกรองแอร์');

  // Payment boxes, then close without saving.
  await page.getByLabel('เงินสด', { exact: true }).filter({ visible: true }).check();
  await golden.step('ติ๊กเงินสด');
  await page.getByLabel('เงินเชื่อ', { exact: true }).filter({ visible: true }).check();
  await golden.step('ติ๊กเงินเชื่อ');
  await golden.screen('old-receipt-form');
  await close();
  await golden.step('กดปิด ระบบเตือนว่ายังไม่ได้บันทึก');
  await page.getByRole('button', { name: 'ปิดโดยไม่บันทึก' }).click();
  await golden.step('ปิดโดยไม่บันทึก');

  // A quote with labour only, drawn into a new receipt: the receipt asks to approve the quote first.
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill('สมชาย');
  await custBox.press('Enter');
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).filter({ visible: true }).click();
  const labor = page.locator('#qItems tbody tr').filter({ has: page.getByRole('spinbutton') }).last();
  await labor.getByRole('textbox').fill('ค่าตรวจเช็คระบบไฟ');
  await labor.getByRole('spinbutton').nth(1).fill('500');
  await labor.getByRole('spinbutton').nth(1).press('Tab');
  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('สร้างใบเสนอราคาค่าแรงอย่างเดียวให้สมชาย ใจดี แล้วบันทึก');
  await golden.stateChange('save-quote', before);
  await expect(page.getByText('เลขที่ MA-QT261000001', { exact: false }).filter({ visible: true }).first()).toBeVisible();
  await close();

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await create.click();
  const src = page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อลูกค้า / ทะเบียนรถ').filter({ visible: true });
  await src.fill('MA-QT261000001');
  await src.press('Enter');
  await golden.step('เลือกใบเสนอราคาที่ยังไม่อนุมัติ ระบบถามให้อนุมัติก่อน');
  before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
  await expect(lines.filter({ hasText: 'ค่าตรวจเช็คระบบไฟ' })).toHaveCount(1);
  await golden.step('อนุมัติแล้ว รายการของใบเสนอราคาเข้ามาในใบเสร็จ');
  await golden.stateChange('approve-and-draw', before);
  await close();
  await page.getByRole('button', { name: 'ปิดโดยไม่บันทึก' }).click();

  // 4.4 counter sale: the customer box.
  await page.getByRole('button', { name: /4\.4 ตัดสต็อกสินค้า/ }).click();
  await page.getByRole('button', { name: '+ เปิดบิลขายหน้าร้าน' }).click();
  const shopCust = page.getByPlaceholder('พิมพ์ชื่อลูกค้า / บริษัท / เบอร์โทร').filter({ visible: true });
  await shopCust.fill('สมชาย');
  await shopCust.press('Enter');
  await expect(shopCust).toHaveValue(/สมชาย ใจดี/);
  await golden.step('บิลขายหน้าร้าน เลือกลูกค้าสมชาย ใจดี');
  await close();
  await app.settle();
  await golden.step('ปิดบิลขายหน้าร้าน');
});
