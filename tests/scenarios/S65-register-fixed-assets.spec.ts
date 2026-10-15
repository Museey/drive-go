import { test, expect } from '../support/test';

test('S65 บันทึกการซื้อสินทรัพย์ถาวร 2 รายการในใบเดียว มี VAT 7% แล้วดูทะเบียนค่าเสื่อมราคา', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '3 · ซื้อสินทรัพย์' }).click();
  await golden.step('หน้าซื้อสินทรัพย์');

  await page.getByRole('button', { name: '+ บันทึกการซื้อสินทรัพย์' }).click();
  await golden.step('ฟอร์มบันทึกการซื้อสินทรัพย์ถาวร');

  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await field('วันที่ได้มา *').fill('2026-10-10');
  await field('ผู้ขาย').fill('บริษัท เครื่องมือช่างไทย จำกัด');
  await field('เลขที่ใบกำกับภาษี').fill('TT-6910-0077');
  await expect(page.getByLabel('ภาษีมูลค่าเพิ่ม').filter({ visible: true })).toHaveValue('7');

  const line = (i: number) => page.getByRole('row')
    .filter({ has: page.getByPlaceholder('เช่น เครื่องเชื่อม CO2') }).filter({ visible: true }).nth(i);
  // ประเภทกำหนดอายุให้อัตโนมัติ และวาดตารางใหม่ จึงเลือกประเภทก่อนกรอกตัวเลข
  await line(0).getByRole('combobox').selectOption('เครื่องมือช่าง');
  await line(0).getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill('เครื่องเชื่อม CO2 / MIG 250A');
  await line(0).getByRole('spinbutton').nth(0).fill('38000');
  await line(0).getByRole('spinbutton').nth(2).fill('1');
  await line(1).getByRole('combobox').selectOption('เครื่องใช้สำนักงาน');
  await line(1).getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill('เครื่องปรับอากาศห้องรับรองลูกค้า 18,000 BTU');
  await line(1).getByRole('spinbutton').nth(0).fill('24500');
  await line(1).getByRole('spinbutton').nth(2).fill('1');
  await line(1).getByRole('spinbutton').nth(2).press('Tab');
  await expect(page.getByText(/^กรอกแล้ว 2 รายการ/).filter({ visible: true })).toBeVisible();
  await golden.step('กรอกสินทรัพย์ 2 รายการ รวม 62,500 บาท');
  await golden.screen('asset-form');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('row').filter({ hasText: 'เครื่องเชื่อม CO2 / MIG 250A' }).filter({ visible: true })).toBeVisible();
  await golden.step('หลังบันทึก รายการขึ้นในหน้าซื้อสินทรัพย์');
  await golden.stateChange('save-assets', before);
  await golden.screen('asset-list');

  await page.getByRole('button', { name: 'ดูทะเบียนและค่าเสื่อมราคา' }).click();
  // ตารางทะเบียนแบ่งเป็นสองส่วน (คอลัมน์ซ้ายตรึงไว้) จึงพบแถวเดียวกันสองครั้ง
  const reg = page.getByRole('row').filter({ hasText: 'เครื่องปรับอากาศห้องรับรองลูกค้า 18,000 BTU' }).filter({ visible: true }).first();
  await reg.scrollIntoViewIfNeeded();
  await golden.step('ทะเบียนสินทรัพย์และค่าเสื่อมราคา');
  await golden.screen('asset-register');
});
