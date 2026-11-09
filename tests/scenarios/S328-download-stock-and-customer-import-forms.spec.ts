import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';

// 11.3 "ดาวน์โหลดแบบฟอร์มนำเข้า" of the products card and of the customers card: no scenario downloaded the empty
// import forms (S54 imported files it brought). The products form carries the three expiry columns added by the
// expiry module after the original columns, with the example filled in.
test('S328 ดาวน์โหลดแบบฟอร์มนำเข้าสินค้าและลูกค้าที่เมนู 11.3', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '11 ตั้งค่าเพิ่มเติม' }).click();
  await page.getByRole('button', { name: '11.3 นำเข้า / ส่งออกข้อมูล' }).click();
  await golden.step('หน้านำเข้า / ส่งออกข้อมูล');
  const card = (title: string) => page.getByRole('article').filter({ hasText: title });

  let before = await app.state();
  let download = page.waitForEvent('download');
  await card('ทะเบียนอะไหล่ · เมนู 07').getByRole('button', { name: /^ดาวน์โหลดแบบฟอร์มนำเข้า/ }).click();
  let file = await download;
  expect(file.suggestedFilename()).toBe('แบบฟอร์มนำเข้าสินค้า.csv');
  const stock = readFileSync(await file.path(), 'utf8').split('\r\n');
  expect(stock).toHaveLength(2);
  expect(stock[0]).toMatch(/^﻿รหัสสินค้า\(อู่\)\*,รหัส OEM,ชื่อสินค้า\*,/);
  expect(stock[0]).toMatch(/,มีวันหมดอายุ,อายุสินค้า \(เดือน\),เตือนล่วงหน้า \(วัน\)$/);
  expect(stock[1]).toMatch(/^BRK-001,04465-0K260,ผ้าเบรกหน้า Toyota Vigo,ระบบเบรก,ชุด,10,850,/);
  expect(stock[1]).toMatch(/,ใช่,36,90$/);
  await golden.step('ดาวน์โหลดแบบฟอร์มนำเข้าสินค้า');
  await golden.stateChange('stock-form', before);

  before = await app.state();
  download = page.waitForEvent('download');
  await card('ข้อมูลลูกค้า · เมนู 02').getByRole('button', { name: /^ดาวน์โหลดแบบฟอร์มนำเข้า/ }).click();
  file = await download;
  expect(file.suggestedFilename()).toBe('แบบฟอร์มนำเข้าลูกค้า.csv');
  const cust = readFileSync(await file.path(), 'utf8').split('\r\n');
  expect(cust.length).toBeGreaterThan(2);
  expect(cust[0]).toMatch(/^﻿ชื่อลูกค้า\*/);
  await golden.step('ดาวน์โหลดแบบฟอร์มนำเข้าลูกค้า');
  await golden.stateChange('customer-form', before);
});
