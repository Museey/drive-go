import { test, expect } from '../support/test';

// 07 "ชุดอะไหล่ซ่อมบำรุง" (parts kits) and the kit search of the quote: no scenario used them. The register (new,
// search by typing / Enter / "ค้นหาข้อมูล", status filter, open by row and by its button), the editor (name, note,
// price, quantities, "นำออก", save with a missing name, save, both "ปิด"), and in a quote the kit box (type, Enter,
// pick, leave), the kit table (search, pick, close) and "พิมพ์รายการอะไหล่ในชุด".
test('S323 ชุดอะไหล่ซ่อมบำรุง: สร้างชุด ค้นหาในทะเบียน แล้วใส่ชุดในใบเสนอราคา', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  const editor = page.locator('#mPartsKit');
  const pick = async (code: string, name: RegExp) => {
    await editor.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).fill(code);
    await page.getByRole('option', { name }).click();
  };

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'ชุดอะไหล่ซ่อมบำรุง' }).click();
  await golden.step('ทะเบียนชุดอะไหล่ซ่อมบำรุง (ยังไม่มีชุด)');

  // First kit: brake service. Saving without a name first.
  await page.getByRole('button', { name: '+ สร้างชุดอะไหล่' }).click();
  await golden.step('หน้าต่างสร้างชุดอะไหล่ใหม่');
  await editor.getByRole('button', { name: 'บันทึกชุดอะไหล่' }).click();
  await expect(editor.getByText('กรุณาตั้งชื่อชุดอะไหล่')).toBeVisible();
  await golden.step('กดบันทึกโดยยังไม่ตั้งชื่อ');
  await editor.getByLabel('ชื่อชุดอะไหล่').fill('ชุดเปลี่ยนผ้าเบรกหน้า Revo');
  await editor.getByLabel('หมายเหตุ').fill('ผ้าเบรกหน้า + น้ำมันเบรก');
  await pick('BR-001', /BR-001 · ผ้าเบรกหน้า Toyota Revo/);
  await pick('BR-025', /BR-025 · น้ำมันเบรก DOT4/);
  await pick('AC-215', /AC-215 · กรองแอร์ในห้องโดยสาร/);
  await golden.step('เลือกอะไหล่ 3 รายการ');
  await editor.getByRole('spinbutton', { name: 'จำนวนต่อชุด น้ำมันเบรก DOT4 (1 ลิตร)' }).fill('2');
  await editor.getByRole('row').filter({ hasText: 'AC-215' }).getByRole('button', { name: 'นำออก' }).click();
  await editor.getByLabel(/ราคาขายต่อชุด/).fill('2500');
  await golden.step('น้ำมันเบรก 2 ขวด นำกรองแอร์ออก ราคาขาย 2,500');
  let before = await app.state();
  await editor.getByRole('button', { name: 'บันทึกชุดอะไหล่' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('บันทึกชุดเปลี่ยนผ้าเบรกหน้า');
  await golden.stateChange('save-kit', before);
  await editor.getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await golden.step('ปิดด้วยปุ่มปิดด้านบน');

  // Second kit: no price yet, closed with the bottom button.
  await page.getByRole('button', { name: '+ สร้างชุดอะไหล่' }).click();
  await editor.getByLabel('ชื่อชุดอะไหล่').fill('ชุดเปลี่ยนกรองแอร์');
  await pick('AC-215', /AC-215 · กรองแอร์ในห้องโดยสาร/);
  before = await app.state();
  await editor.getByRole('button', { name: 'บันทึกชุดอะไหล่' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.stateChange('save-kit-2', before);
  await editor.getByRole('button', { name: 'ปิด', exact: true }).last().click();
  await golden.step('บันทึกชุดเปลี่ยนกรองแอร์ (ยังไม่ตั้งราคา) แล้วปิดด้วยปุ่มปิดด้านล่าง');

  // Register: search, filter, open.
  const search = page.getByPlaceholder('ค้นหา ชื่อชุด / รหัส / ชื่ออะไหล่ + Enter');
  await search.fill('BR-025');
  await golden.step('พิมพ์ค้นหา BR-025');
  await search.press('Enter');
  await search.fill('กรองแอร์');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await golden.step('ค้นหา กรองแอร์ กดค้นหาข้อมูล');
  await search.fill('');
  await search.press('Enter');
  await page.getByRole('combobox', { name: 'สถานะ' }).filter({ visible: true }).selectOption({ label: 'ยังไม่ตั้งราคา' });
  await golden.step('สถานะ: ยังไม่ตั้งราคา');
  await page.getByRole('combobox', { name: 'สถานะ' }).filter({ visible: true }).selectOption({ label: 'ทั้งหมด' });
  await page.getByRole('row').filter({ hasText: 'ชุดเปลี่ยนกรองแอร์' }).getByRole('button', { name: 'เปิด / แก้ไข' }).click();
  await golden.step('กดเปิด / แก้ไข ชุดเปลี่ยนกรองแอร์');
  await editor.getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await page.getByRole('row').filter({ hasText: 'ชุดเปลี่ยนผ้าเบรกหน้า Revo' }).getByText('ผ้าเบรกหน้า + น้ำมันเบรก').click();
  await golden.step('กดที่แถวชุดเปลี่ยนผ้าเบรกหน้า');
  await editor.getByRole('button', { name: 'ปิด', exact: true }).first().click();

  // A quote: the kit box and the kit table.
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill('ปรีชา');
  await custBox.locator('..').getByText('ปรีชา ทองสุข').click();
  await page.getByPlaceholder('1.', { exact: true }).fill('เบรกมีเสียงดัง');
  const kitBox = page.getByPlaceholder('พิมพ์ชื่อชุด หรือรหัสอะไหล่ในชุด').filter({ visible: true });
  await kitBox.fill('ผ้าเบรก');
  await golden.step('พิมพ์ "ผ้าเบรก" ในช่องค้นหาชุดอะไหล่');
  await kitBox.press('Enter');
  await expect(page.getByText('เพิ่มชุด ชุดเปลี่ยนผ้าเบรกหน้า Revo แล้ว')).toBeVisible();
  await golden.step('กด Enter เพิ่มชุดเปลี่ยนผ้าเบรกหน้า');
  await kitBox.fill('ไม่มีชุดนี้');
  await expect(page.getByText('ไม่พบชุดอะไหล่')).toBeVisible();
  await page.getByPlaceholder('1.', { exact: true }).click();
  await expect(page.getByText('ไม่พบชุดอะไหล่')).toBeHidden();
  await golden.step('พิมพ์ชื่อที่ไม่มี แล้วคลิกที่อื่น รายการปิด');
  await kitBox.fill('กรองแอร์');
  await page.getByRole('option', { name: /ชุดเปลี่ยนกรองแอร์/ }).click();
  await golden.step('เลือกชุดเปลี่ยนกรองแอร์จากรายการ');
  await page.getByRole('button', { name: 'เลือกจากตารางชุดอะไหล่ทั้งหมด' }).filter({ visible: true }).click();
  const table = page.getByRole('dialog', { name: 'เลือกชุดอะไหล่ซ่อมบำรุง' });
  await table.getByRole('searchbox', { name: 'ค้นหาในตาราง' }).fill('Revo');
  await golden.step('ตารางชุดอะไหล่ ค้นหา Revo');
  await table.getByRole('button', { name: 'เพิ่มอีก 1 ชุด' }).click();
  await expect(table.getByText('ในเอกสาร 2 ชุด')).toBeVisible();
  await golden.step('เพิ่มชุดเปลี่ยนผ้าเบรกหน้าอีก 1 ชุด');
  await table.getByRole('button', { name: 'ปิด', exact: true }).click();
  await page.getByText('พิมพ์รายการอะไหล่ในชุด').filter({ visible: true }).click();
  await golden.step('ปิดตาราง ติ๊กพิมพ์รายการอะไหล่ในชุด');
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true })).toBeVisible();
  await golden.step('บันทึกใบเสนอราคาที่มีชุดอะไหล่');
  await golden.stateChange('save-quote', before);
});
