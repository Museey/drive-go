import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (team's check of 2026-11-18; the owner approved the checks and their messages on 2026-11-20;
// frontend/CHANGES.md 173): the other forms check what is typed the same way as the customer form (S471).
// · 05 ผู้ขาย: a phone with letters and a postcode that is not 5 digits stop the save; a new vendor with the name of one
//   there is (หจก. ไทยพาร์ท ซัพพลาย) is asked about, and "บริษัท ไทยพาร์ท ซัพพลาย จำกัด" (another legal form) is not.
// · 07 อะไหล่: a selling price below 0, and Min above Max, stop the save.
// · 10 ตั้งค่าองค์กร: the shop's phone; 09 งานบุคคล: an employee's phone; 03 ใบเสนอราคา: a negative mileage.
// The legacy app saved all of them as typed.
const dialog = (page: Page, title: string) => page.locator('div.panel, .modal, [role=dialog]')
  .filter({ has: page.getByRole('heading', { name: title, exact: true }) }).filter({ visible: true }).first();
const said = (page: Page, text: string) => expect(page.getByText(text, { exact: true }).filter({ visible: true }).last()).toBeVisible();
const TEL = 'เบอร์โทรไม่ถูกต้อง — กรอกเลข 9-10 หลัก';

test('S472 ระบบใหม่: ผู้ขาย อะไหล่ เบอร์โทรร้าน เบอร์โทรพนักงาน และเลขไมล์ในใบเสนอราคา ตรวจค่าก่อนบันทึก ผู้ขายชื่อซ้ำถามก่อน บริษัทกับ หจก. ชื่อเดียวกันไม่ถือว่าซ้ำ', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const db = async () => (await app.state()).DB;
  const vendors = (await db()).vendors.length;

  // 05 ผู้ขาย
  await page.getByRole('button', { name: /^05 ข้อมูลผู้ขาย/ }).click();
  await page.getByRole('button', { name: '+ เพิ่มผู้ขาย' }).click();
  const vfield = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const vsave = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await page.getByLabel('ชื่อผู้ขาย / ร้าน *').filter({ visible: true }).fill('หจก. ไทยพาร์ท ซัพพลาย');
  await vfield('เบอร์โทร').fill('tel abc');
  await vfield('รหัสไปรษณีย์').fill('12');
  await vsave.click();
  await said(page, TEL);
  await vfield('เบอร์โทร').fill('02-111-2233');
  await vsave.click();
  await said(page, 'รหัสไปรษณีย์ต้องเป็นเลข 5 หลัก');
  await vfield('รหัสไปรษณีย์').fill('10400');
  await vsave.click();
  const same = dialog(page, 'มีผู้ขายที่คล้ายกันอยู่แล้ว');
  await expect(same).toContainText('พบในระบบ:');
  await expect(same).toContainText('หจก. ไทยพาร์ท ซัพพลาย');
  await expect(same).toContainText('(ชื่อเดียวกัน)');
  await expect(same).toContainText('บันทึกเป็นผู้ขายใหม่อีกรายหรือไม่?');
  await same.getByRole('button', { name: 'กลับไปแก้ไข' }).click();
  expect((await db()).vendors.length).toBe(vendors);
  // Another legal form: not the same vendor, saved without a question.
  await page.getByLabel('ชื่อผู้ขาย / ร้าน *').filter({ visible: true }).fill('บริษัท ไทยพาร์ท ซัพพลาย จำกัด');
  await vsave.click();
  await expect(page.getByRole('button', { name: '+ เพิ่มผู้ขาย' })).toBeVisible();
  await app.settle();
  const v = (await db()).vendors;
  expect([v.length, v.at(-1).name, v.at(-1).tel, v.at(-1).addr.zip]).toEqual([vendors + 1, 'บริษัท ไทยพาร์ท ซัพพลาย จำกัด', '02-111-2233', '10400']);

  // 07 อะไหล่
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: '+ เพิ่มอะไหล่' }).click();
  const sfield = (label: string) => page.getByLabel(label).filter({ visible: true });
  const ssave = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first();
  await sfield('รหัสสินค้าของอู่ *').fill('BR-471');
  await sfield('ชื่อสินค้า *').fill('ผ้าเบรกทดสอบ');
  await sfield('ราคาซื้อ (ต้นทุน)').fill('100');
  await page.locator('#fPA').fill('-10');
  await sfield('Min — จุดสั่งซื้อ (เตือนสีเหลือง)').fill('5');
  await sfield('Max — ระดับสูงสุด (เตือนสีแดงอ่อน)').fill('2');
  await ssave.click();
  await said(page, 'ราคา จำนวน และ Min / Max ต้องเป็นตัวเลขไม่ติดลบ');
  await page.locator('#fPA').fill('150');
  await ssave.click();
  await said(page, 'Min — จุดสั่งซื้อ ต้องไม่มากกว่า Max');
  expect((await db()).stock.some((s: any) => s.code === 'BR-471')).toBe(false);
  await sfield('Max — ระดับสูงสุด (เตือนสีแดงอ่อน)').fill('10');
  await ssave.click();
  await expect(page.getByRole('button', { name: '+ เพิ่มอะไหล่' })).toBeVisible();
  await app.settle();
  expect((await db()).stock.find((s: any) => s.code === 'BR-471')).toMatchObject({ pa: 150, min: 5, max: 10 });

  // 10 ตั้งค่าองค์กร: the shop's phone
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const shopTel = page.getByLabel('เบอร์โทรศัพท์', { exact: true }).filter({ visible: true });
  const was = (await db()).shop.tel;
  await shopTel.fill('02-555-12');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await said(page, TEL);
  await app.settle();
  expect((await db()).shop.tel).toBe(was);

  // 09 งานบุคคล: an employee's phone
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('button', { name: '+ เพิ่มพนักงาน' }).click();
  const efield = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const emps = (await db()).emp.length;
  await efield('ชื่อ - นามสกุล *').fill('ทดสอบ เบอร์ผิด');
  await efield('เบอร์โทรติดต่อ').fill('09x-555-0012');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await said(page, TEL);
  expect((await db()).emp.length).toBe(emps);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // 03 ใบเสนอราคา: a negative mileage
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill('ปรีชา');
  await custBox.locator('..').getByText('ปรีชา ทองสุข').click();
  const quotes = (await db()).quotes.length;
  await page.getByRole('spinbutton', { name: 'เลขไมล์' }).filter({ visible: true }).fill('-100');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await said(page, 'เลขไมล์ต้องเป็นตัวเลข 0 ขึ้นไป');
  expect((await db()).quotes.length).toBe(quotes);
});
