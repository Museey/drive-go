import { test, expect } from '../support/test';

// Parts of the goods receipt window no scenario used (docs/BEHAVIORS.md): "ค้นหาละเอียด" (category and brand filters,
// the search box, "+ เพิ่ม", ✕), "+ สินค้าใหม่ (ยังไม่มีในสต๊อก)" and × of a line, the tick boxes and the three tick
// buttons, "ปรับต้นทุนแถวที่ติ๊ก" (direction, the three ways, a quick %, ปิด / ✕ / ยืนยัน), "ย้อนกลับ" and the
// scale button at the end of a line's cost.
test('S340 ใบรับสินค้า: ค้นหาละเอียด เพิ่มสินค้าใหม่ ติ๊กแถว เฉลี่ยส่วนลดท้ายบิลลงต้นทุน ย้อนกลับ แล้วบวกค่าขนส่งเฉพาะแถว', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await golden.step('ใบรับสินค้าใหม่ เลือกผู้ขาย หจก. ไทยพาร์ท ซัพพลาย');

  const lines = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  // สินค้าที่ยังไม่มีในสต๊อก
  await page.getByRole('button', { name: '+ สินค้าใหม่ (ยังไม่มีในสต๊อก)' }).click();
  await golden.step('กด + สินค้าใหม่ ได้บรรทัดว่าง');
  await lines.nth(0).getByPlaceholder('รหัสอู่').fill('FL-901');
  await lines.nth(0).getByPlaceholder('รหัสอู่').press('Tab');
  await lines.nth(0).getByRole('textbox').nth(2).fill('ไส้กรองน้ำมันเครื่อง Hino');
  await lines.nth(0).getByRole('spinbutton').nth(0).fill('5');
  await lines.nth(0).getByRole('spinbutton').nth(1).fill('240');
  await golden.step('กรอกสินค้าใหม่ FL-901 ไส้กรองน้ำมันเครื่อง Hino 5 ชิ้น ราคา 240');
  await page.getByRole('button', { name: '+ สินค้าใหม่ (ยังไม่มีในสต๊อก)' }).click();
  await expect(lines).toHaveCount(2);
  await lines.nth(1).getByRole('button', { name: '×' }).click();
  await expect(lines).toHaveCount(1);
  await golden.step('เพิ่มบรรทัดเกินมา กด × ลบทิ้ง');

  // ค้นหาละเอียด: หมวด → แบรนด์ → คำค้น → + เพิ่ม
  await page.getByRole('button', { name: 'ค้นหาละเอียด' }).click();
  const find = page.locator('#mGrFind');
  await golden.step('หน้าต่างค้นหาสินค้าละเอียด');
  await find.getByRole('combobox').nth(0).selectOption('อะไหล่ไฟฟ้า');
  await golden.step('เลือกหมวดอะไหล่ไฟฟ้า');
  const brand = find.getByRole('combobox').nth(1);
  await brand.selectOption((await brand.locator('option', { hasText: 'ไม่ระบุแบรนด์' }).getAttribute('value'))!);
  await golden.step('เลือกแบรนด์ "ไม่ระบุแบรนด์"');
  await find.getByPlaceholder('พิมพ์เพื่อค้นหาสินค้า').pressSequentially('ไดชาร์จ');
  await expect(find.getByRole('row').filter({ hasText: 'EL-101' })).toBeVisible();
  await golden.step('พิมพ์ "ไดชาร์จ" เหลือไดชาร์จ Toyota Revo');
  await find.getByRole('row').filter({ hasText: 'EL-101' }).getByRole('button', { name: '+ เพิ่ม' }).click();
  await golden.step('กด + เพิ่ม ไดชาร์จ EL-101 เข้าใบ');
  await find.getByRole('button', { name: 'ปิด', exact: true }).click();
  await golden.step('ปิดหน้าต่างค้นหาละเอียด');

  // ผ้าเบรกหน้าจากช่องค้นหา ราคาตามบิล 870
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  await lines.nth(2).getByRole('spinbutton').nth(0).fill('10');
  await lines.nth(2).getByRole('spinbutton').nth(1).fill('870');

  // ติ๊ก
  await page.getByRole('button', { name: 'ติ๊กทั้งหมด' }).click();
  await golden.step('ติ๊กทั้งหมด 3 แถว');
  await page.getByRole('button', { name: 'ล้างที่ติ๊ก' }).click();
  await golden.step('ล้างที่ติ๊ก');
  await page.locator('#grItems thead').getByRole('checkbox').check();
  await golden.step('ติ๊กช่องหัวตาราง ติ๊กทุกแถว');
  await page.locator('#grItems thead').getByRole('checkbox').uncheck();
  await golden.step('เอาติ๊กช่องหัวตารางออก');
  await page.getByRole('button', { name: 'ติ๊กเฉพาะราคาจากบิลนี้' }).click();
  await golden.step('ติ๊กเฉพาะราคาจากบิลนี้ ได้สินค้าใหม่และผ้าเบรก (ไดชาร์จใช้ต้นทุนเดิมในระบบ)');

  // ปรับต้นทุน: เปิดแล้วปิดก่อน
  const adj = page.locator('#mGrAdj');
  await page.getByRole('button', { name: /^ปรับต้นทุนแถวที่ติ๊ก/ }).click();
  await golden.step('หน้าต่างปรับต้นทุน 2 แถวที่ติ๊กไว้');
  await adj.getByRole('button', { name: 'ปิด', exact: true }).last().click();
  await golden.step('กดปิดหน้าต่างปรับต้นทุน');

  // ส่วนลดท้ายบิล 300 บาท เฉลี่ยตามมูลค่า
  await page.getByRole('button', { name: /^ปรับต้นทุนแถวที่ติ๊ก/ }).click();
  await adj.getByText('ลดต้นทุน', { exact: true }).click();
  await golden.step('เลือกลดต้นทุน');
  await adj.getByRole('button', { name: '5%' }).click();
  await golden.step('กดปุ่มลัด 5% เห็นผลก่อนยืนยัน');
  await adj.getByText('จำนวนบาท — ต่อหน่วย').click();
  await golden.step('เปลี่ยนเป็นจำนวนบาทต่อหน่วย');
  await adj.getByText('จำนวนบาท — ทั้งก้อน แล้วเฉลี่ยตามสัดส่วน').click();
  await adj.getByRole('spinbutton').fill('300');
  await expect(adj.getByText('ต้นทุนรวมลดลง')).toBeVisible();
  await golden.step('ลดทั้งก้อน 300 บาท เฉลี่ยตามมูลค่า');
  await golden.screen('adjust-lump');
  await adj.getByText('เปอร์เซ็นต์ (%)').click();
  await adj.getByText('เพิ่มต้นทุน', { exact: true }).click();
  await golden.step('ลองสลับเป็นเปอร์เซ็นต์และเพิ่มต้นทุน');
  await adj.getByText('ลดต้นทุน', { exact: true }).click();
  await adj.getByText('จำนวนบาท — ทั้งก้อน แล้วเฉลี่ยตามสัดส่วน').click();
  await adj.getByRole('spinbutton').fill('300');
  await adj.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await golden.step('ยืนยันเฉลี่ยส่วนลด 300 บาทลงต้นทุน');

  await page.getByRole('button', { name: 'ย้อนกลับ' }).click();
  await golden.step('กดย้อนกลับ ต้นทุนกลับเป็นค่าก่อนปรับ');

  // ค่าขนส่งของไดชาร์จ 50 บาท/ชิ้น จากปุ่มท้ายช่องต้นทุนของแถว
  await lines.nth(1).getByTitle('ปรับต้นทุนเฉพาะแถวนี้').click();
  await golden.step('ปุ่มปรับต้นทุนเฉพาะแถว EL-101');
  await adj.getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await golden.step('กด ✕ ปิด');
  await lines.nth(1).getByTitle('ปรับต้นทุนเฉพาะแถวนี้').click();
  await adj.getByText('จำนวนบาท — ต่อหน่วย').click();
  await adj.getByRole('spinbutton').fill('50');
  await adj.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await golden.step('บวกค่าขนส่ง 50 บาทต่อชิ้นให้ไดชาร์จ');
  await golden.screen('lines-adjusted');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  await golden.step('บันทึกใบรับสินค้ารออนุมัติ');
  await golden.stateChange('save-gr', before);
});
