import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (team's check of 2026-11-18; the owner approved the checks and their messages on 2026-11-20, and said
// "ปี ค.ศ. ให้แปลงเป็น พ.ศ. เอง"; frontend/CHANGES.md 174–176): the three CSV imports of 11.3 check the rows as the forms
// do (S471, S472) and say why a row is skipped.
// · tests/assets/S473-customers.csv: a phone with letters, a mileage of −500 and the year "25xx" are skipped (the legacy
//   import kept them, and turned −500 into 500); the year 1990 becomes 2533; "สมชาย ใจดี" with another phone is added as
//   a new customer, and the card says a name matches a customer there is.
// · tests/assets/S473-vendors.csv: "บริษัท ไทยพาร์ท ซัพพลาย จำกัด" is added (the legacy import took it for the vendor
//   "หจก. ไทยพาร์ท ซัพพลาย" and skipped it), a phone with letters is skipped, the หจก. itself is already there.
// · tests/assets/S473-stock.csv: a quantity "abc" and a price "12abc" (the legacy import made them 0 and 12) and a Min
//   of −1 are skipped; "1,000" is read as 1000.
const choose = async (page: Page, button: RegExp, file: string) => {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: button }).click();
  await (await chooser).setFiles(file);
};
const ask = (page: Page, title: string) => page.locator('div.panel, .modal, [role=dialog]')
  .filter({ has: page.getByRole('heading', { name: title, exact: true }) }).filter({ visible: true }).first();

test('S473 ระบบใหม่: นำเข้าลูกค้า ผู้ขาย และสินค้าจาก CSV ข้ามแถวที่เบอร์โทร เลขไมล์ ปีจดทะเบียน หรือตัวเลขไม่ถูกต้อง พร้อมบอกเหตุผล แปลงปี ค.ศ. เป็น พ.ศ. บอกเมื่อชื่อลูกค้าตรงกับลูกค้าเดิม และบริษัทกับ หจก. ชื่อเดียวกันไม่ถือว่าซ้ำ', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const db = async () => (await app.state()).DB;
  const start = await db();
  await page.getByRole('button', { name: '11 ตั้งค่าเพิ่มเติม' }).click();
  await page.getByRole('button', { name: '11.3 นำเข้า / ส่งออกข้อมูล' }).click();

  // Customers
  await choose(page, /^นำเข้าลูกค้า \/ รถจากไฟล์ CSV/, 'tests/assets/S473-customers.csv');
  const cust = ask(page, 'นำเข้าลูกค้า / รถจาก CSV');
  await expect(cust).toContainText('ลูกค้าใหม่ 2 ราย · รถ 2 คัน');
  await expect(cust).toContainText('ข้าม 3 แถว');
  await expect(cust).toContainText('เบอร์โทรไม่ถูกต้อง 1 · เลขไมล์ไม่ใช่ตัวเลข 1 · ปีจดทะเบียนไม่ใช่ พ.ศ. 4 หลัก 1');
  await expect(cust).toContainText('ชื่อตรงกับลูกค้าในระบบ 1 ราย — เพิ่มเป็นรายใหม่');
  await cust.getByRole('button', { name: 'นำเข้า', exact: true }).click();
  await expect(page.getByText(`ในระบบ ${start.cust.length + 2} ราย`)).toBeVisible();
  await app.settle();
  const added = (await db()).cust.slice(start.cust.length);
  expect(added.map((c: any) => [c.name, c.tel, c.vehicles.map((v: any) => [v.plateL + ' ' + v.plateN, v.year, v.mile])])).toEqual([
    ['ทดสอบ ปีคริสต์ศักราช', '0833333333', [['7กข 1004', '2533', '1000']]],
    ['สมชาย ใจดี', '0844444444', [['7กข 1005', '2560', '5000']]],
  ]);

  // Vendors
  await choose(page, /^นำเข้าผู้ขายใหม่จากไฟล์ CSV/, 'tests/assets/S473-vendors.csv');
  const ven = ask(page, 'นำเข้าผู้ขายจาก CSV');
  await expect(ven).toContainText('พบผู้ขายใหม่ 1 ราย');
  await expect(ven).toContainText('ข้าม 2 แถว (เบอร์โทรไม่ถูกต้อง 1 · มีในระบบแล้ว 1)');
  await ven.getByRole('button', { name: 'นำเข้า', exact: true }).click();
  await expect(page.getByText(`ในระบบ ${start.vendors.length + 1} ราย`)).toBeVisible();
  await app.settle();
  expect((await db()).vendors.slice(start.vendors.length).map((v: any) => [v.name, v.tel])).toEqual([['บริษัท ไทยพาร์ท ซัพพลาย จำกัด', '021112233']]);

  // Parts
  await choose(page, /^นำเข้าสินค้าใหม่จากไฟล์ CSV/, 'tests/assets/S473-stock.csv');
  const stock = ask(page, 'นำเข้าสินค้าจาก CSV');
  await expect(stock).toContainText('พบสินค้าใหม่ 1 รายการ');
  await expect(stock).toContainText('ข้าม 2 แถว (ตัวเลขไม่ถูกต้อง)');
  await expect(stock).toContainText('ข้าม 1 แถว (ตัวเลขติดลบ)');
  await stock.getByRole('button', { name: 'นำเข้า', exact: true }).click();
  await expect(page.getByText(`ในระบบ ${start.stock.length + 1} รายการ`)).toBeVisible();
  await app.settle();
  expect((await db()).stock.slice(start.stock.length).map((s: any) => [s.code, s.qty, s.cost, s.pa, s.min, s.max]))
    .toEqual([['ST-474', 2, 1000, 1500, 1, 5]]);
});
