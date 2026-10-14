import { test, expect } from '../support/test';

test('S44 เพิ่มพนักงานใหม่ตำแหน่งช่างซ่อม ให้สิทธิ "ชุดช่างซ่อม" แล้วพนักงานใหม่ขึ้นในหน้าจ่ายเงินเดือน', async ({ app, page, golden }) => {
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
  await golden.step('เลือกสิทธิชุดช่างซ่อม');
  await golden.screen('employee-preset');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('row').filter({ hasText: 'EMP012' })).toContainText('ณัฐพล ใจเย็น');
  await golden.step('หลังบันทึกพนักงานใหม่');
  await golden.stateChange('add-employee', before);

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '4 · จ่ายเงินเดือน' }).click();
  const payrollRow = page.getByRole('row').filter({ hasText: 'EMP012' }).filter({ visible: true });
  await expect(payrollRow).toContainText('13,000.00');
  await expect(page.getByRole('row').filter({ hasText: 'รวม 12 คน' })).toBeVisible();
  await payrollRow.scrollIntoViewIfNeeded();
  await golden.step('หน้าจ่ายเงินเดือนมีพนักงานใหม่');
  await golden.screen('payroll-with-new-employee');
});
