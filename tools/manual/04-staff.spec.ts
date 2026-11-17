import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 4: staff, their rights and their own sign-in.
test('04 พนักงานและสิทธิ์', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await app.settle();
  const add = page.getByRole('button', { name: '+ เพิ่มพนักงาน' });
  await shot(page, '04-list', { mark: [add] });
  await add.click();
  await page.waitForTimeout(400);
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await field('ชื่อ - นามสกุล *').fill('ณัฐพล ใจเย็น');
  await field('เลขบัตรประชาชน').fill('1103701234567');
  await field('วันเกิด').fill('2002-05-20');
  await field('ตำแหน่งงาน').fill('ช่างซ่อมทั่วไป');
  await field('เบอร์โทรติดต่อ').fill('092-555-0012');
  await field('อัตราเงินเดือน (บาท)').fill('13000');
  await shot(page, '04-form', { mark: [field('ชื่อ - นามสกุล *')] });
  const preset = page.getByRole('button', { name: 'ชุดช่างซ่อม' });
  await preset.click();
  await shot(page, '04-rights', { mark: [preset] });
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await save.click();
  await app.settle();
  await shot(page, '04-saved', { keepToast: true });
});
