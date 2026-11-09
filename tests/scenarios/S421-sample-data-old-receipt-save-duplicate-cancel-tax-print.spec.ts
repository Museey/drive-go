import { test, expect } from '../support/test';

// After "ล้างข้อมูลทั้งหมด" + "โหลดข้อมูลตัวอย่าง" "ระบบขายแบบใหม่" is off and receipts are made in the original receipt
// form (#mReceiptEdit). What no other scenario did with it (docs/BEHAVIORS.md): saving with the side toolbar's บันทึก,
// "+ สร้างใบเสร็จรับเงินใหม่" in the toolbar, drawing a quote that already has a receipt (the warning and its
// "เปิดใบเสร็จเดิม"), "ยกเลิกเอกสาร" in the toolbar, the side toolbar's "สร้างเอกสารใหม่" / "ปิดหน้าต่าง", and printing
// the tax invoice of a receipt that has one ("พิมพ์เอกสาร ▾" → "ใบกำกับภาษี").
test('S421 ข้อมูลตัวอย่าง: ใบเสร็จแบบเดิม บันทึก ดึงใบเสนอราคาซ้ำ (เตือนและเปิดใบเดิม) ยกเลิกเอกสาร และพิมพ์ใบกำกับภาษี', async ({ app, page, golden }) => {
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

  const form = page.locator('#mReceiptEdit');
  const side = page.getByRole('toolbar', { name: 'เครื่องมือเอกสาร' }).filter({ visible: true });
  const lines = page.locator('#rItems tbody tr');
  const src = page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อลูกค้า / ทะเบียนรถ').filter({ visible: true });

  // A quote with labour only for สมชาย ใจดี.
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
  await expect(page.getByText('เลขที่ MA-QT261000001', { exact: false }).filter({ visible: true }).first()).toBeVisible();
  await golden.step('ใบเสนอราคาค่าแรงอย่างเดียว MA-QT261000001 บันทึกแล้ว');
  await golden.stateChange('save-quote', before);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // A receipt drawn from it (approving it on the way), saved with the side toolbar.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสร็จรับเงิน / ใบแจ้งหนี้' }).click();
  await src.fill('MA-QT261000001');
  await src.press('Enter');
  await page.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
  await expect(lines.filter({ hasText: 'ค่าตรวจเช็คระบบไฟ' })).toHaveCount(1);
  await form.getByLabel('เงินสด', { exact: true }).check();
  await golden.step('ใบเสร็จใหม่ ดึงจาก MA-QT261000001 อนุมัติแล้ว ติ๊กเงินสด');
  before = await app.state();
  await side.getByRole('button', { name: 'บันทึก' }).click();
  await expect(form.getByText('เลขที่ MA-RE261000001').first()).toBeVisible();
  await app.settle();
  await golden.step('กดบันทึกที่แถบข้าง ได้ใบเสร็จ MA-RE261000001');
  await golden.stateChange('save-receipt', before);

  // A new receipt from the toolbar; the same quote again: the warning, then "เปิดใบเสร็จเดิม".
  await form.getByRole('button', { name: '+ สร้างใบเสร็จรับเงินใหม่' }).click();
  await expect(form.getByText('เอกสารใหม่', { exact: false }).first()).toBeVisible();
  await golden.step('กดสร้างใบเสร็จรับเงินใหม่ที่แถบเครื่องมือ');
  await src.fill('MA-QT261000001');
  await src.press('Enter');
  await expect(page.getByRole('heading', { name: 'ใบเสนอราคานี้ออกใบเสร็จไปแล้ว' })).toBeVisible();
  await golden.step('ดึง MA-QT261000001 อีกครั้ง ระบบเตือนว่าออกใบเสร็จไปแล้ว');
  await golden.screen('duplicate-warning');
  await page.getByRole('button', { name: 'เปิดใบเสร็จเดิม' }).click();
  await expect(form.getByText('เลขที่ MA-RE261000001').first()).toBeVisible();
  await golden.step('กดเปิดใบเสร็จเดิม');

  // "ยกเลิกเอกสาร" in the toolbar, with a reason.
  await form.getByRole('button', { name: 'ยกเลิกเอกสาร' }).click();
  const ask = page.locator('#mAsk');
  await expect(ask.getByText('ยกเลิกเอกสาร MA-RE261000001')).toBeVisible();
  await ask.getByRole('textbox').fill('ลูกค้าขอเปลี่ยนรายการ');
  await golden.step('กดยกเลิกเอกสาร ใส่เหตุผล');
  before = await app.state();
  await ask.getByRole('button', { name: 'ยกเลิกเอกสาร' }).click();
  await app.settle();
  await golden.step('ยืนยันยกเลิกเอกสาร MA-RE261000001');
  await golden.stateChange('cancel-receipt', before);

  // The side toolbar: a new document, then close the window.
  await side.getByRole('button', { name: 'สร้างเอกสารใหม่' }).click();
  await expect(form.getByText('เอกสารใหม่', { exact: false }).first()).toBeVisible();
  await golden.step('กดสร้างเอกสารใหม่ที่แถบข้าง');
  await side.getByRole('button', { name: 'ปิดหน้าต่าง' }).click();
  await expect(form).toBeHidden();
  await golden.step('กดปิดหน้าต่างที่แถบข้าง');

  // A receipt with a tax invoice: print the tax invoice.
  await page.locator('#docOvDateMode').selectOption({ label: 'เลือกทั้งหมด' });
  const search = page.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า + Enter').filter({ visible: true });
  await search.fill('RE.69-09-05-01');
  await search.press('Enter');
  await page.getByText('RE.69-09-05-01', { exact: true }).filter({ visible: true }).first().click();
  await expect(form.getByText('เลขที่ RE.69-09-05-01').first()).toBeVisible();
  await golden.step('เปิดใบเสร็จ RE.69-09-05-01 ที่มีใบกำกับภาษี');
  await form.getByRole('button', { name: 'พิมพ์เอกสาร ▾' }).click();
  before = await app.state();
  await form.getByRole('button', { name: 'ใบกำกับภาษี', exact: true }).click();
  await app.settle();
  await golden.step('กดพิมพ์เอกสาร → ใบกำกับภาษี');
  await golden.stateChange('print-tax-invoice', before);
});
