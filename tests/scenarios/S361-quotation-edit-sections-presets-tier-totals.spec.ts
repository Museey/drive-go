import { test, expect } from '../support/test';

// Parts of the quote window no other scenario used (docs/BEHAVIORS.md): picking a problem
// from the list under the field, "+ เพิ่มอาการที่ตรวจพบ" and × of a finding, × of a line, the price tier through the
// shop's drop-down list (pointing, choosing, closing when the window is resized), the technician, the proposer, the
// discount, VAT, the print options, "ล้างลูกค้าที่เลือก", and saving.
test('S361 แก้ไขใบเสนอราคาร่าง: เลือกปัญหาจากรายการ อาการที่ตรวจพบ ระดับราคา ส่วนลด VAT ตัวเลือกพิมพ์ แล้วบันทึก', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByText('MA-QT261000001', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.locator('#qPrev')).toContainText('MA-QT261000001');
  await page.waitForTimeout(400);
  await golden.step('เปิดใบเสนอราคาร่าง MA-QT261000001');
  const before = await app.state();

  // 2: the problem list opens under the field; choose "แอร์ไม่เย็น".
  await page.getByPlaceholder('1.', { exact: true }).click();
  const sug = page.getByRole('listbox').filter({ hasText: 'ทะเบียนปัญหา' });
  await expect(sug).toBeVisible();
  await golden.step('กดช่องปัญหาข้อ 1 รายการจากทะเบียนปัญหาขึ้นใต้ช่อง');
  await page.setViewportSize({ width: 1280, height: 760 });
  await sug.getByRole('option', { name: 'แอร์ไม่เย็น', exact: true }).click();
  await expect(page.getByPlaceholder('1.', { exact: true })).toHaveValue('แอร์ไม่เย็น');
  await golden.step('เลือก "แอร์ไม่เย็น" จากรายการ');

  // 3: two findings, then × removes the second.
  await page.getByPlaceholder('ระบุอาการ / ปัญหาที่ตรวจพบข้อที่ 1', { exact: true }).fill('คอมเพรสเซอร์แอร์มีเสียงดัง');
  await page.getByRole('button', { name: '+ เพิ่มอาการที่ตรวจพบ' }).click();
  await page.getByPlaceholder('ระบุอาการ / ปัญหาที่ตรวจพบข้อที่ 2', { exact: true }).fill('ข้อนี้พิมพ์ผิด');
  await golden.step('พิมพ์อาการที่ตรวจพบ 2 ข้อ');
  await page.getByRole('row').filter({ has: page.getByPlaceholder('ระบุอาการ / ปัญหาที่ตรวจพบข้อที่ 2', { exact: true }) })
    .getByRole('button', { name: '×' }).click();
  await golden.step('กด × ลบอาการข้อ 2');

  // 4: a labour line, then × removes it; the price tier through the drop-down list.
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).click();
  await golden.step('เพิ่มบรรทัดค่าแรง');
  await page.locator('#qItems tbody tr').filter({ visible: true }).last().getByRole('button', { name: '×' }).click();
  await golden.step('กด × ลบบรรทัดค่าแรง');
  // (scrolled into place first: the shop's list closes when the page scrolls under it)
  const tier = page.getByRole('combobox').filter({ hasText: 'ระดับราคา A' });
  const openTier = async () => { await tier.scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await tier.click(); };
  await openTier();
  const list = page.getByRole('listbox').filter({ has: page.getByRole('option', { name: 'ระดับราคา C' }) });
  await expect(list).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(list).toBeHidden();
  await golden.step('เปิดรายการระดับราคา แล้วย่อหน้าต่าง รายการปิดเอง');
  await openTier();
  await list.getByRole('option', { name: 'ระดับราคา A' }).hover();
  await list.getByRole('option', { name: 'ระดับราคา A' }).click();
  await expect(tier).toHaveValue('A');
  await golden.step('เลือกระดับราคา A ราคาอะไหล่เปลี่ยนตาม');

  // 5: technician, proposer, discount, VAT.
  await page.getByLabel('ผู้ประเมินอาการซ่อม (ช่างผู้ตรวจ)').filter({ visible: true }).selectOption({ index: 1 });
  await page.getByLabel('ชื่อผู้เสนอซ่อม').filter({ visible: true }).selectOption({ index: 1 });
  await page.getByLabel('ส่วนลด (บาท)').filter({ visible: true }).fill('100');
  await page.getByLabel('ภาษีมูลค่าเพิ่ม').filter({ visible: true }).selectOption({ label: 'ไม่คิด VAT' });
  await golden.step('เลือกช่างผู้ประเมิน ผู้เสนอซ่อม ส่วนลด 100 บาท ไม่คิด VAT');

  // Print options above the document.
  await page.getByLabel('รหัสสินค้าบนเอกสาร').filter({ visible: true }).selectOption({ index: 1 });
  await page.getByLabel('ข้อมูลสำหรับการชำระเงิน').filter({ visible: true }).selectOption({ index: 1 });
  await page.getByLabel(/ไม่แสดงหัวเอกสาร/).filter({ visible: true }).check();
  await golden.step('ตั้งตัวเลือกการพิมพ์: รหัสสินค้า ธนาคาร ไม่แสดงหัวเอกสาร');
  await golden.screen('quote-edited');

  // "ล้างลูกค้าที่เลือก", then the same customer again.
  const custName = await page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ').filter({ visible: true }).first().inputValue();
  await page.getByRole('button', { name: 'ล้างลูกค้าที่เลือก' }).click();
  await golden.step('กดล้างลูกค้าที่เลือก');
  const cust = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ').filter({ visible: true }).first();
  await cust.fill(custName.split(' · ')[0]);
  await cust.press('Enter');
  await expect(cust).toHaveValue(custName);
  await golden.step('เลือกลูกค้าเดิมกลับเข้ามา');

  await page.getByRole('toolbar', { name: 'เครื่องมือเอกสาร' }).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await app.settle();
  await golden.step('บันทึกใบเสนอราคา');
  await golden.stateChange('save-quote', before);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('ปิดหน้าต่าง');
});
