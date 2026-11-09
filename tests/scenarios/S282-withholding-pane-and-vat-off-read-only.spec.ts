import { test, expect } from '../support/test';

// Boxes and buttons no scenario used (docs/BEHAVIORS.md): in 4.4 ใบหัก ณ ที่จ่าย "เราหักผู้ขาย", the return form
// (ภ.ง.ด.3 / 53) and "นำส่งแล้ว" of a row; then the shop stops being VAT-registered and 4.6 opens read-only.
test('S282 ตั้งแบบนำส่งและติ๊กนำส่งภาษีหัก ณ ที่จ่ายในแท็บเราหักผู้ขาย แล้วปิดการจด VAT หน้าใบกำกับภาษีเปิดให้ดูย้อนหลังเท่านั้น', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '4.4 ใบหัก ณ ที่จ่าย' }).filter({ visible: true }).click();
  await page.getByText('เราหักผู้ขาย', { exact: true }).filter({ visible: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'MA-EX261000002' }).filter({ visible: true });
  await expect(row).toContainText('คุณสุนทร เจ้าของอาคาร');
  await golden.step('4.4 ใบหัก ณ ที่จ่าย แท็บเราหักผู้ขาย');

  let before = await app.state();
  await row.getByRole('combobox').selectOption('53');
  await app.settle();
  await golden.step('เปลี่ยนแบบนำส่งของ MA-EX261000002 เป็น ภ.ง.ด.53');
  await golden.stateChange('change-form', before);
  before = await app.state();
  await row.getByRole('combobox').selectOption('3');
  await row.getByRole('checkbox', { name: 'นำส่งแล้ว' }).check();
  await app.settle();
  await golden.step('กลับเป็น ภ.ง.ด.3 แล้วติ๊กนำส่งแล้ว');
  await golden.stateChange('remit', before);

  // 10: no longer VAT-registered (the shop has issued tax invoices, so it asks first).
  await page.getByRole('button', { name: /^10 ตั้งค่าองค์กร/ }).click();
  await page.getByRole('button', { name: 'ไม่จดภาษีมูลค่าเพิ่ม', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await golden.step('เลือกไม่จดภาษีมูลค่าเพิ่ม กดบันทึก ระบบถามยืนยัน');
  before = await app.state();
  await page.getByRole('button', { name: 'ยืนยัน ปิดการจดทะเบียน' }).click();
  await app.settle();
  await golden.step('ยืนยันปิดการจดทะเบียน');
  await golden.stateChange('vat-off', before);

  // A shop with tax invoices keeps 4.6 open to look back, with a notice (the gate with "ไปหน้าตั้งค่าองค์กร" shows only
  // for a shop with no tax documents, whose 4.6 menu is hidden: tools/unreachable.json).
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await expect(page.getByText('กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม — หน้านี้เปิดไว้ให้ดูเอกสารย้อนหลังเท่านั้น', { exact: false }).filter({ visible: true })).toBeVisible();
  await golden.step('หน้าใบกำกับภาษีเปิดให้ดูย้อนหลังเท่านั้น');
});
