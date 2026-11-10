import { test, expect } from '../support/test';

// 09 ข้อมูลพนักงาน: "แก้ไข / สิทธิ" of a mechanic, the start date (อายุงาน follows), "ลาออก / ปิดบัญชี" and back,
// every permission preset in turn, the permission table's row and column buttons and one box, the cost and discount
// switches, saved; then "สรุปสิทธิ์ทุกคน" and its ปิด.
test('S402 แก้ไขสิทธิพนักงานด้วยชุดสิทธิสำเร็จรูปทุกชุด ปุ่มทั้งแถวทั้งคอลัมน์ สวิตช์ต้นทุนและส่วนลด แล้วดูสรุปสิทธิ์ทุกคน', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await golden.step('ข้อมูลพนักงาน');
  await page.getByPlaceholder('ค้นหา รหัส / ชื่อ / ตำแหน่ง').fill('ช่าง');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await golden.step('ค้นหาพนักงานตำแหน่งช่าง');

  await page.getByRole('row').filter({ hasText: 'EMP003' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  const form = page.locator('#mEmp');
  await expect(form.getByRole('heading', { name: 'แก้ไขพนักงาน · EMP003 วิชัย ขยันงาน' })).toBeVisible();
  await golden.step('แก้ไขพนักงาน EMP003 วิชัย ขยันงาน');

  await form.getByLabel('วันที่เริ่มงาน').fill('2020-06-01');
  await expect(form.getByLabel('อายุงาน')).toHaveValue('6 ปี 4 เดือน');
  await golden.step('เปลี่ยนวันที่เริ่มงานเป็น 01/06/2563 อายุงานคำนวณใหม่');

  await form.getByRole('button', { name: 'ลาออก / ปิดบัญชี' }).click();
  await expect(form.getByLabel('วันที่พ้นสภาพ')).toBeVisible();
  await golden.step('กดลาออก / ปิดบัญชี แสดงวันที่พ้นสภาพ');
  await form.getByRole('button', { name: 'ปฏิบัติงานอยู่' }).click();
  await expect(form.getByLabel('วันที่พ้นสภาพ')).toBeHidden();
  await golden.step('กลับเป็นปฏิบัติงานอยู่');

  const box = (name: string) => form.getByRole('checkbox', { name, exact: true });
  for (const preset of ['ให้สิทธิทั้งหมด', 'ไม่ให้สิทธิใด', 'ชุดผู้จัดการอู่', 'ชุดธุรการหน้าร้าน', 'ชุดหัวหน้าช่าง', 'ชุดคลังอะไหล่',
    'ชุดบัญชีการเงิน', 'ชุดแคชเชียร์', 'ชุดหัวหน้าอนุมัติ', 'ชุดผู้ตรวจสอบ']) {
    await form.getByRole('button', { name: preset, exact: true }).click();
    await golden.step('กด ' + preset);
  }
  await expect(box('02 · รายชื่อลูกค้า · เข้าดู')).toBeChecked();
  await expect(box('02 · รายชื่อลูกค้า · เพิ่ม')).not.toBeChecked();

  // The table: a whole row, a whole column, one box.
  await form.getByRole('button', { name: '02 · รายชื่อลูกค้า', exact: true }).click();
  await expect(box('02 · รายชื่อลูกค้า · เพิ่ม')).toBeChecked();
  await golden.step('กดชื่อแถว 02 · รายชื่อลูกค้า ติ๊กทั้งแถว');
  await form.getByRole('button', { name: 'พิมพ์เอกสาร', exact: true }).click();
  await golden.step('กดหัวคอลัมน์พิมพ์เอกสาร ติ๊กทั้งคอลัมน์');
  await box('02 · รายชื่อลูกค้า · ยกเลิก / ลบ').uncheck();
  await golden.step('เอาสิทธิยกเลิก / ลบ ของรายชื่อลูกค้าออก');

  // The special switches: cost shown, discount not allowed.
  // (each pair clicked both ways, whatever the preset left)
  await form.getByRole('radio', { name: 'ไม่แสดงต้นทุน', exact: true }).check();
  await form.getByRole('radio', { name: 'แสดงต้นทุน', exact: true }).check();
  await expect(form.getByRole('radio', { name: 'แสดงต้นทุน', exact: true })).toBeChecked();
  await form.getByRole('radio', { name: 'อนุญาต', exact: true }).check();
  await form.getByRole('radio', { name: 'ไม่อนุญาต', exact: true }).check();
  await expect(form.getByRole('radio', { name: 'ไม่อนุญาต', exact: true })).toBeChecked();
  await golden.step('เลือกแสดงต้นทุน และไม่อนุญาตให้ส่วนลด');
  await golden.screen('employee-permissions');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(form).toBeHidden();
  await golden.step('บันทึกสิทธิของ EMP003');
  await golden.stateChange('save-permissions', before);

  await page.getByRole('button', { name: 'สรุปสิทธิ์ทุกคน' }).click();
  const summary = page.locator('#mPermSummary');
  await expect(summary.getByRole('heading', { name: 'สรุปสิทธิ์การใช้งานทุกคน' })).toBeVisible();
  await golden.step('สรุปสิทธิ์การใช้งานทุกคน');
  await summary.getByRole('banner').getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(summary).toBeHidden();
  await golden.step('ปิดสรุปสิทธิ์');
});
