import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S44 in the new system (tests/intentional-changes.json, task 3.3,
// decisions T3, T10, T12): the staff form has three more rights under
// "การเงิน" — "เลือกไม่คิด VAT (ต้องใส่เหตุผล)", "ปิดงวดภาษี", "ออกใบลดหนี้" —
// which the mechanic set leaves off, so the new employee's record has them
// (all off) and the audit line counts 68 rights instead of 65. Every step,
// message, screen and the rest of the data change are S44's.
const S44 = 'S44-add-employee-tech-preset.spec.ts';

test('S139 ระบบใหม่: เพิ่มพนักงานใหม่ตำแหน่งช่างซ่อม ให้สิทธิ "ชุดช่างซ่อม" สิทธิ์ภาษีใหม่ 3 ตัวไม่ได้ติ๊ก แล้วพนักงานใหม่ขึ้นในหน้าจ่ายเงินเดือน', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S44, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('button', { name: '+ เพิ่มพนักงาน' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await expect(field('รหัสพนักงาน *')).toHaveValue('EMP012');
  await golden.step('ฟอร์มเพิ่มพนักงาน');

  await field('ชื่อ - นามสกุล *').fill('ณัฐพล ใจเย็น');
  await field('เลขบัตรประชาชน').fill('1103701234567');
  await field('วันเกิด').fill('2002-05-20');
  await field('ตำแหน่งงาน').fill('ช่างซ่อมทั่วไป');
  await field('เบอร์โทรติดต่อ').fill('092-555-0012');
  await field('อัตราเงินเดือน (บาท)').fill('13000');
  await page.getByRole('button', { name: 'ชุดช่างซ่อม' }).click();
  for (const right of ['เลือกไม่คิด VAT (ต้องใส่เหตุผล)', 'ปิดงวดภาษี', 'ออกใบลดหนี้'])
    await expect(page.getByRole('checkbox', { name: right, exact: true })).not.toBeChecked();
  await golden.step('เลือกสิทธิชุดช่างซ่อม');
  await golden.screen('employee-preset');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('row').filter({ hasText: 'EMP012' })).toContainText('ณัฐพล ใจเย็น');
  await golden.step('หลังบันทึกพนักงานใหม่');
  const legacy = JSON.parse(legacyStateChange(S44, 'add-employee'));
  const emp = legacy['DB.emp'].added[0];
  emp.perms.doc = { ...emp.perms.doc, noVat: false, taxClose: false, creditNote: false };
  const audit = legacy['DB.audit'].added[0];
  audit.note = audit.note.replace('สิทธิใช้งาน 15/65', 'สิทธิใช้งาน 15/68');
  await golden.stateChange('add-employee', before, { 'DB.emp': legacy['DB.emp'], 'DB.audit': legacy['DB.audit'] });

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '4 · จ่ายเงินเดือน' }).click();
  const payrollRow = page.getByRole('row').filter({ hasText: 'EMP012' }).filter({ visible: true });
  await expect(payrollRow).toContainText('13,000.00');
  await expect(page.getByRole('row').filter({ hasText: 'รวม 12 คน' })).toBeVisible();
  await payrollRow.scrollIntoViewIfNeeded();
  await golden.step('หน้าจ่ายเงินเดือนมีพนักงานใหม่');
  await golden.screen('payroll-with-new-employee');
  golden.done();
});
