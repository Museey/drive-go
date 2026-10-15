import { test, expect } from '../support/test';

test('S64 บันทึกผลการเคลมผู้ขาย รับของคืน ตีเป็นของเสีย และหักยอดสินค้า', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // เตรียม: ส่งเคลม 3 รายการจากใบรับสินค้า MA-RC261000001 แล้วอนุมัติตัดสต๊อก (แบบเดียวกับ S34)
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เคลมผู้ขาย' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเคลมใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('รุ่งเรือง');
  await page.getByText('บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อผู้ขาย').filter({ visible: true }).click();
  await page.keyboard.type('MA-RC');
  await page.getByText('MA-RC261000001', { exact: true }).filter({ visible: true }).click();
  for (const code of ['EL-101', 'EL-125', 'EL-133'])
    await page.getByRole('row').filter({ hasText: code }).getByRole('button', { name: '+ เคลมชิ้นนี้' }).click();
  await page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' }).click();
  const lines = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  const cause = 'เช่น ชำรุดจากการผลิต / ผิดรุ่น / แตกหักระหว่างขนส่ง';
  // ไดชาร์จ EL-101 1 ชิ้น · คอยล์จุดระเบิด EL-125 2 ชิ้น (ทุน 980) · ไฟหน้า LED EL-133 1 ชิ้น
  await lines.nth(0).getByRole('spinbutton').fill('1');
  await lines.nth(0).getByPlaceholder(cause).fill('ชาร์จไฟไม่เข้า');
  await lines.nth(1).getByRole('spinbutton').fill('2');
  await lines.nth(1).getByPlaceholder(cause).fill('ไฟรั่ว เครื่องสะดุด');
  await lines.nth(2).getByRole('spinbutton').fill('1');
  await lines.nth(2).getByPlaceholder(cause).fill('เลนส์แตกระหว่างขนส่ง');
  await page.getByLabel('สถานะการเคลม').filter({ visible: true }).selectOption({ label: 'ส่งเคลมแล้ว' });
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('อนุมัติใบเคลม MA-CL261000001 ตัดสต๊อก 3 รายการแล้ว');

  // ผู้ขายแจ้งผลเคลม: เปลี่ยนสถานะแล้วกดบันทึก ระบบเปิดหน้าบันทึกผลการเคลม
  await page.getByLabel('สถานะการเคลม').filter({ visible: true }).selectOption({ label: 'รับสินค้าคืน / เปลี่ยนใหม่แล้ว' });
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ยืนยันผลการเคลม' })).toBeVisible();
  await golden.step('หน้าบันทึกผลการเคลม (ตั้งต้นรับคืนทุกรายการ)');

  const result = (code: string) => page.getByRole('row').filter({ hasText: code })
    .filter({ has: page.getByRole('combobox') }).filter({ visible: true });
  await result('EL-125').getByRole('combobox').selectOption({ label: 'หักยอดสินค้า' });
  await result('EL-133').getByRole('combobox').selectOption({ label: 'สินค้าเสียหาย' });
  await expect(page.getByText('รับคืนเข้าสต๊อก 1 ชิ้น · ตีเสีย 1 รายการ · หักยอดรวม 1,960.00 บาท')).toBeVisible();
  await golden.step('รับคืนไดชาร์จ 1 ชิ้น · หักยอดคอยล์ 1,960 บาท · ไฟหน้าตีเป็นของเสีย');
  await golden.screen('claim-result');

  const before = await app.state();
  await page.getByRole('button', { name: 'ยืนยันผลการเคลม' }).click();
  await expect(page.getByRole('button', { name: 'ยืนยันผลการเคลม' })).toBeHidden();
  await golden.step('หลังยืนยันผลการเคลม');
  await golden.stateChange('claim-result', before);

  // ใบเคลมที่รับของคืนแล้วยกเลิกไม่ได้
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const row = page.getByRole('row').filter({ hasText: 'MA-CL261000001' }).filter({ visible: true });
  await row.scrollIntoViewIfNeeded();
  await golden.step('ทะเบียนใบเคลมผู้ขาย');
  await golden.screen('claim-list');

  const beforeCancel = await app.state();
  await row.getByRole('button', { name: 'ยกเลิก' }).click();
  await golden.step('กดยกเลิกใบเคลมที่รับของคืนแล้ว');
  await golden.stateChange('cancel-refused', beforeCancel);
});
