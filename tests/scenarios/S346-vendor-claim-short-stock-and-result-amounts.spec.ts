import { test, expect } from '../support/test';

// Vendor claim steps no scenario reached (docs/BEHAVIORS.md): approving a claim of more pieces than are in stock (the
// "สต๊อกไม่พอ" question lists the short lines), and in "บันทึกผลการเคลม" the ✕ and ปิด buttons and typing the number
// returned and the amount deducted (the window opens again each time the claim is saved).
test('S346 อนุมัติใบเคลมผู้ขายที่เคลมเกินสต๊อก แล้วบันทึกผลโดยพิมพ์จำนวนรับคืนและยอดหัก', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เคลมผู้ขาย' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเคลมใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('รุ่งเรือง');
  await page.getByText('บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อผู้ขาย').filter({ visible: true }).click();
  await page.keyboard.type('MA-RC');
  await page.getByText('MA-RC261000001', { exact: true }).filter({ visible: true }).click();
  for (const code of ['EL-101', 'EL-125'])
    await page.getByRole('row').filter({ hasText: code }).getByRole('button', { name: '+ เคลมชิ้นนี้' }).click();
  await page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' }).click();
  const lines = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  const cause = 'เช่น ชำรุดจากการผลิต / ผิดรุ่น / แตกหักระหว่างขนส่ง';
  // ไดชาร์จมีในสต๊อก 20 ชิ้น แต่เคลมทั้งล็อต 25 ชิ้น
  await lines.nth(0).getByRole('spinbutton').fill('25');
  await lines.nth(0).getByPlaceholder(cause).fill('ทั้งล็อตชาร์จไฟไม่เข้า');
  await lines.nth(1).getByRole('spinbutton').fill('2');
  await lines.nth(1).getByPlaceholder(cause).fill('ไฟรั่ว');
  await page.getByLabel('สถานะการเคลม').filter({ visible: true }).selectOption({ label: 'ส่งเคลมแล้ว' });
  await golden.step('เคลมไดชาร์จ 25 ชิ้น (มีในสต๊อก 20) และคอยล์ 2 ชิ้น');

  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await expect(page.getByRole('button', { name: 'ยืนยันอนุมัติ' })).toBeVisible();
  await golden.step('ระบบถามสต๊อกไม่พอ บอกรายการที่ขาด');
  await golden.screen('short-stock');
  let before = await app.state();
  await page.getByRole('button', { name: 'ยืนยันอนุมัติ' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('ยืนยันอนุมัติ สต๊อกไดชาร์จติดลบ');
  await golden.stateChange('approve-short', before);

  await page.getByLabel('สถานะการเคลม').filter({ visible: true }).selectOption({ label: 'รับสินค้าคืน / เปลี่ยนใหม่แล้ว' });
  const save = () => page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await save();
  await expect(page.getByRole('button', { name: 'ยืนยันผลการเคลม' })).toBeVisible();
  await golden.step('หน้าบันทึกผลการเคลม');
  await page.getByRole('heading', { name: 'บันทึกผลการเคลม' }).locator('xpath=ancestor::div[.//button][1]').getByRole('button', { name: /✕/ }).click();
  await expect(page.getByRole('button', { name: 'ยืนยันผลการเคลม' })).toBeHidden();
  await golden.step('กด ✕ ปิดไปก่อน');
  await save();
  await expect(page.getByRole('button', { name: 'ยืนยันผลการเคลม' })).toBeVisible();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('button', { name: 'ยืนยันผลการเคลม' })).toBeHidden();
  await golden.step('บันทึกอีกครั้ง หน้าบันทึกผลเปิดใหม่ แล้วกดปิด');
  await save();

  const result = (code: string) => page.getByRole('row').filter({ hasText: code })
    .filter({ has: page.getByRole('combobox') }).filter({ visible: true });
  await result('EL-101').getByRole('spinbutton').fill('20');
  await expect(page.getByText('รับคืนเข้าสต๊อก 22 ชิ้น · ตีเสีย 0 รายการ · หักยอดรวม 0.00 บาท')).toBeVisible();
  await golden.step('พิมพ์รับคืนไดชาร์จ 20 ชิ้น');
  await result('EL-101').getByRole('combobox').selectOption({ label: 'หักยอดสินค้า' });
  await result('EL-101').getByRole('spinbutton').fill('21000');
  await expect(page.getByText('รับคืนเข้าสต๊อก 2 ชิ้น · ตีเสีย 0 รายการ · หักยอดรวม 21,000.00 บาท')).toBeVisible();
  await golden.step('เปลี่ยนไดชาร์จเป็นหักยอด พิมพ์ยอดหัก 21,000 บาท');
  await golden.screen('claim-result');
  before = await app.state();
  await page.getByRole('button', { name: 'ยืนยันผลการเคลม' }).click();
  await expect(page.getByRole('button', { name: 'ยืนยันผลการเคลม' })).toBeHidden();
  await golden.step('ยืนยันผลการเคลม');
  await golden.stateChange('claim-result', before);
});
