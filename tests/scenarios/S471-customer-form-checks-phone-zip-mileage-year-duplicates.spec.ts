import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (team's check of 2026-11-18; the owner approved the checks and their messages on 2026-11-20, and said
// "ปี ค.ศ. ให้แปลงเป็น พ.ศ. เอง"; frontend/CHANGES.md 173): the customer form checks what is typed before saving.
// A phone with letters, a postcode that is not 5 digits, a negative mileage and a year that is not พ.ศ. stop the save with
// a message and the form stays open; a ค.ศ. year is turned into พ.ศ. A new customer with the name of a customer there
// is (สมชาย ใจดี, C00015) and a plate already on another customer's car (ษร 1022 ปทุมธานี, C00001 บริษัท ขนส่งไทยรุ่งเรือง จำกัด) are asked about:
// "กลับไปแก้ไข" keeps the form, the other answer saves. The legacy app saved all of it without a word (S42 saves a valid one).
const field = (page: Page, label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
const select = (page: Page, label: string) => page.getByLabel(label).filter({ visible: true });
const dialog = (page: Page, title: string) => page.locator('div.panel, .modal, [role=dialog]')
  .filter({ has: page.getByRole('heading', { name: title, exact: true }) }).filter({ visible: true }).first();

test('S471 ระบบใหม่: ฟอร์มลูกค้าไม่รับเบอร์โทรที่มีตัวอักษร รหัสไปรษณีย์ไม่ครบ 5 หลัก เลขไมล์ติดลบ ปีจดทะเบียนที่ไม่ใช่ พ.ศ. แปลงปี ค.ศ. เป็น พ.ศ. และถามก่อนบันทึกลูกค้าชื่อซ้ำหรือทะเบียนรถของลูกค้ารายอื่น', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await page.getByRole('button', { name: '+ เพิ่มลูกค้า' }).click();
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  const count = async () => ((await app.state()).DB.cust as unknown[]).length;
  const start = await count();
  const stopped = async (message: string) => {
    await save.click();
    await expect(page.getByText(message, { exact: true }).filter({ visible: true }).last()).toBeVisible();
    await expect(field(page, 'ชื่อเจ้าของ / ผู้นำมาซ่อม *')).toBeVisible();
    expect(await count()).toBe(start);
  };

  await field(page, 'ชื่อเจ้าของ / ผู้นำมาซ่อม *').fill('สมชาย ใจดี');
  await field(page, 'รหัสไปรษณีย์').fill('abcde');
  await field(page, 'เบอร์โทรติดต่อ').fill('โทร abc-defg');
  await select(page, 'ยี่ห้อรถ').selectOption('Honda (ฮอนด้า)');
  await field(page, 'รุ่นรถ').fill('City');
  await field(page, 'ทะเบียน · หมวดอักษร').fill('ษร');
  await field(page, 'ทะเบียน · หมวดตัวเลข').fill('1022');
  await select(page, 'จังหวัดทะเบียน').selectOption('ปทุมธานี');
  await field(page, 'เลขไมล์ล่าสุด').fill('-500');
  await field(page, 'ปีจดทะเบียน').fill('25xx');

  await stopped('เบอร์โทรไม่ถูกต้อง — กรอกเลข 9-10 หลัก');
  await field(page, 'เบอร์โทรติดต่อ').fill('02-555-1234, 089-111-2222 ต่อ 12');
  await stopped('รหัสไปรษณีย์ต้องเป็นเลข 5 หลัก');
  await field(page, 'รหัสไปรษณีย์').fill('10140');
  await stopped('เลขไมล์ต้องเป็นตัวเลข 0 ขึ้นไป');
  await field(page, 'เลขไมล์ล่าสุด').fill('45000');
  await stopped('ปีจดทะเบียนต้องเป็นปี พ.ศ. 4 หลัก เช่น 2565');
  await field(page, 'ปีจดทะเบียน').fill('1990');

  // The name is a customer's: asked; back to the form.
  await save.click();
  const same = dialog(page, 'มีลูกค้าที่คล้ายกันอยู่แล้ว');
  await expect(same).toContainText('พบในระบบ:');
  await expect(same).toContainText('C00015 สมชาย ใจดี');
  await expect(same).toContainText('(ชื่อเดียวกัน)');
  await expect(same).toContainText('บันทึกเป็นลูกค้าใหม่อีกรายหรือไม่?');
  await same.getByRole('button', { name: 'กลับไปแก้ไข' }).click();
  await expect(field(page, 'ชื่อเจ้าของ / ผู้นำมาซ่อม *')).toBeVisible();
  expect(await count()).toBe(start);
  await expect(field(page, 'ปีจดทะเบียน')).toHaveValue('2533');

  // Saved as a new one: then the plate, C00001's car, is asked about too.
  await save.click();
  await dialog(page, 'มีลูกค้าที่คล้ายกันอยู่แล้ว').getByRole('button', { name: 'บันทึกเป็นรายใหม่' }).click();
  const plate = dialog(page, 'ทะเบียนรถซ้ำ');
  await expect(plate.getByText(/^ทะเบียน /)).toHaveText('ทะเบียน ษร 1022 ปทุมธานี เป็นรถของ C00001 บริษัท ขนส่งไทยรุ่งเรือง จำกัด อยู่แล้ว — บันทึกต่อหรือไม่ (เช่น รถเปลี่ยนเจ้าของ)');
  await plate.getByRole('button', { name: 'บันทึกต่อ' }).click();
  await expect(page.getByRole('button', { name: '+ เพิ่มลูกค้า' })).toBeVisible();
  await app.settle();
  const db = (await app.state()).DB;
  expect(db.cust.length).toBe(start + 1);
  const made = db.cust.at(-1);
  expect([made.name, made.tel, made.addr.zip, made.vehicles[0].mile, made.vehicles[0].year])
    .toEqual(['สมชาย ใจดี', '02-555-1234, 089-111-2222 ต่อ 12', '10140', '45000', '2533']);
});
