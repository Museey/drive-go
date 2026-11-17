import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 2: customers and their cars.
test('02 ลูกค้าและรถ', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await app.settle();
  const add = page.getByRole('button', { name: '+ เพิ่มลูกค้า' });
  await shot(page, '02-list', { mark: [add] });
  await add.click();
  await page.waitForTimeout(400);
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await field('ชื่อเจ้าของ / ผู้นำมาซ่อม *').fill('สมศักดิ์ รักรถ');
  await field('เลขที่').fill('99/9');
  await field('ถนน').fill('ประชาอุทิศ');
  await field('แขวง / ตำบล').fill('บางมด');
  await field('เขต / อำเภอ').fill('ทุ่งครุ');
  await field('รหัสไปรษณีย์').fill('10140');
  await field('เบอร์โทรติดต่อ').fill('081-234-5678');
  await shot(page, '02-form-owner', { mark: [field('ชื่อเจ้าของ / ผู้นำมาซ่อม *')] });
  await select('ยี่ห้อรถ').selectOption('Honda (ฮอนด้า)');
  await field('รุ่นรถ').fill('City 1.0 Turbo');
  await field('สีรถ').fill('ขาว');
  await field('ทะเบียน · หมวดอักษร').fill('1กก');
  await field('ทะเบียน · หมวดตัวเลข').fill('1234');
  await select('จังหวัดทะเบียน').selectOption('กรุงเทพมหานคร');
  await field('เลขไมล์ล่าสุด').fill('45000');
  await field('ปีจดทะเบียน').fill('2565');
  await shot(page, '02-form-car', { mark: [field('ทะเบียน · หมวดอักษร')] });
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await shot(page, '02-form-save', { mark: [save] });
  await save.click();
  await expect(add).toBeVisible();
  await app.settle();
  await shot(page, '02-list-after');
});
