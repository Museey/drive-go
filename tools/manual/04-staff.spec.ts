import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 2 of the manual (part): staff and their rights. Numbers on a picture are the numbers of its steps.
test('04 พนักงานและสิทธิ์', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await app.settle();
  const add = page.getByRole('button', { name: '+ เพิ่มพนักงาน' });
  await shot(page, '04-list', { mark: [[add, '1']], scroll: false });
  await add.click();
  await page.waitForTimeout(400);
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await field('ชื่อ - นามสกุล *').fill('ณัฐพล ใจเย็น');
  await field('เลขบัตรประชาชน').fill('1103701234567');
  await field('วันเกิด').fill('2002-05-20');
  await field('ตำแหน่งงาน').fill('ช่างซ่อมทั่วไป');
  await field('เบอร์โทรติดต่อ').fill('092-555-0012');
  await field('อัตราเงินเดือน (บาท)').fill('13000');
  // The 4-digit code is not the sign-in password (the manual says so): the picture shows it so the text can point at it.
  const pin = page.getByLabel(/รหัสผ่านเข้าใช้งาน \(ตัวเลข 4 หลัก\)/).filter({ visible: true });
  await shot(page, '04-form', { mark: [[field('ชื่อ - นามสกุล *'), '2'], [field('อัตราเงินเดือน (บาท)'), '2'], [pin, '']] });
  const preset = page.getByRole('button', { name: 'ชุดช่างซ่อม' });
  await preset.click();
  await shot(page, '04-rights', { mark: [[preset, '3']] });
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await save.click();
  await app.settle();
});
