import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S402 in the new system (tests/intentional-changes.json; as S139 for S44, task 3.3, decisions T3, T10, T12):
// the staff form has three more rights under "การเงิน" — "เลือกไม่คิด VAT (ต้องใส่เหตุผล)", "ปิดงวดภาษี",
// "ออกใบลดหนี้ / ใบเพิ่มหนี้" — which the last preset (ชุดผู้ตรวจสอบ) leaves off, so EMP003's saved rights hold them
// (off) and the audit line counts them. Their card makes the special-rights cards taller, so those cards are left out
// of the screen (the boxes are checked here). Every step, the rest of the screen and the rest of the data change are S402's.
const S402 = 'S402-employee-permission-presets-table-summary.spec.ts';

test('S450 ระบบใหม่: แก้ไขสิทธิพนักงานด้วยชุดสิทธิสำเร็จรูปทุกชุด สิทธิ์ภาษีใหม่ 3 ตัวไม่ได้ติ๊ก ปุ่มทั้งแถวทั้งคอลัมน์ สวิตช์ต้นทุนและส่วนลด แล้วดูสรุปสิทธิ์ทุกคน', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S402, { app, page, testInfo });
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
  for (const right of ['เลือกไม่คิด VAT (ต้องใส่เหตุผล)', 'ปิดงวดภาษี', 'ออกใบลดหนี้ / ใบเพิ่มหนี้'])
    await expect(form.getByRole('checkbox', { name: right, exact: true })).not.toBeChecked();
  // The special-rights cards (การเงิน has three more boxes, which makes its row and the rows below taller).
  const cards = form.getByRole('heading', { name: 'สิทธิ์เฉพาะทาง — ต้นทุน ราคา ส่วนลด การเงิน และระบบ' }).locator('xpath=following-sibling::div[1]');
  await golden.screen('employee-permissions', { mask: [cards] });

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(form).toBeHidden();
  await golden.step('บันทึกสิทธิของ EMP003');
  const legacy = JSON.parse(legacyStateChange(S402, 'save-permissions'));
  const audit = legacy['DB.audit'].added[0];
  audit.note = audit.note.replace('สิทธิใช้งาน 15/63 → 31/65', 'สิทธิใช้งาน 15/63 → 31/68');
  await golden.stateChange('save-permissions', before, {
    'DB.emp[EMP003].perms.doc.noVat': [null, false], 'DB.emp[EMP003].perms.doc.taxClose': [null, false],
    'DB.emp[EMP003].perms.doc.creditNote': [null, false], 'DB.audit': legacy['DB.audit'] });

  await page.getByRole('button', { name: 'สรุปสิทธิ์ทุกคน' }).click();
  const summary = page.locator('#mPermSummary');
  await expect(summary.getByRole('heading', { name: 'สรุปสิทธิ์การใช้งานทุกคน' })).toBeVisible();
  await golden.step('สรุปสิทธิ์การใช้งานทุกคน');
  await summary.getByRole('banner').getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(summary).toBeHidden();
  await golden.step('ปิดสรุปสิทธิ์');
  golden.done();
});
