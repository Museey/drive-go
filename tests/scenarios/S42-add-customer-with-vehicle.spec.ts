import { test, expect } from '../support/test';

test('S42 เพิ่มลูกค้าบุคคลธรรมดาใหม่พร้อมรถยนต์ 1 คัน (กดบันทึกโดยไม่กรอกชื่อจะถูกเตือนก่อน)', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await page.getByRole('button', { name: '+ เพิ่มลูกค้า' }).click();
  await golden.step('ฟอร์มเพิ่มลูกค้า');

  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await save.click();
  await golden.step('กดบันทึกโดยยังไม่กรอกชื่อ');

  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  // A select's accessible name also contains its chosen option, so selects are matched by the start of the label.
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await field('ชื่อเจ้าของ / ผู้นำมาซ่อม *').fill('สมศักดิ์ รักรถ');
  await field('เลขที่').fill('99/9');
  await field('ถนน').fill('ประชาอุทิศ');
  await field('แขวง / ตำบล').fill('บางมด');
  await field('เขต / อำเภอ').fill('ทุ่งครุ');
  await field('รหัสไปรษณีย์').fill('10140');
  await field('เบอร์โทรติดต่อ').fill('081-234-5678');
  await select('ยี่ห้อรถ').selectOption('Honda (ฮอนด้า)');
  await field('รุ่นรถ').fill('City 1.0 Turbo');
  await field('สีรถ').fill('ขาว');
  await field('ทะเบียน · หมวดอักษร').fill('1กก');
  await field('ทะเบียน · หมวดตัวเลข').fill('1234');
  await select('จังหวัดทะเบียน').selectOption('กรุงเทพมหานคร');
  await field('เลขไมล์ล่าสุด').fill('45000');
  await field('ปีจดทะเบียน').fill('2565');
  await golden.step('กรอกข้อมูลลูกค้าและรถครบ');
  await golden.screen('customer-form');

  const before = await app.state();
  await save.click();
  await expect(page.getByRole('button', { name: '+ เพิ่มลูกค้า' })).toBeVisible();
  await golden.step('หลังบันทึกลูกค้าใหม่');
  await golden.stateChange('add-customer', before);

  await page.getByPlaceholder('ค้นหา ยี่ห้อ / ทะเบียน / ชื่อลูกค้า / เบอร์โทร').fill('1กก 1234');
  await page.getByPlaceholder('ค้นหา ยี่ห้อ / ทะเบียน / ชื่อลูกค้า / เบอร์โทร').press('Enter');
  const found = page.getByRole('row').filter({ hasText: 'สมศักดิ์ รักรถ' });
  await expect(found).toHaveCount(1);
  await expect(found).toContainText('1กก 1234');
  await found.scrollIntoViewIfNeeded();
  await golden.step('ค้นหาทะเบียน 1กก 1234 เจอลูกค้าใหม่');
  await golden.screen('customer-found');
});
