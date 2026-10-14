import { test, expect } from '../support/test';

test('S11 ใบเสนอราคาที่รออนุมัติตัดสต็อกไม่ได้ เมื่ออนุมัติแล้วใบนั้นไปรอตัดสต็อกในเมนู 4.1', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByText('MA-QT261000002', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'ไม่อนุมัติ / ตีกลับ' })).toBeVisible();
  await golden.step('เปิดใบเสนอราคา MA-QT261000002 ที่รออนุมัติ');
  await golden.screen('quote-pending');

  await page.getByRole('button', { name: 'ตัดสต็อกสินค้า' }).filter({ visible: true }).click();
  await expect(page.getByText('ต้องอนุมัติใบเสนอราคาก่อน จึงจะตัดสต็อกได้').filter({ visible: true })).toBeVisible();
  await golden.step('กดตัดสต็อกก่อนอนุมัติ ระบบไม่ให้ตัด');

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await expect(page.getByRole('button', { name: 'อนุมัติเอกสาร' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'ฉบับแก้ไข' }).filter({ visible: true })).toBeVisible();
  await golden.step('หลังกดอนุมัติเอกสาร');
  await golden.stateChange('approve-quote', before);

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: 'ใบเสนอราคาที่รอตัดสต็อก 3' }).click();
  await expect(page.getByText('MA-QT261000002', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('ใบเสนอราคาที่รอตัดสต็อก มี MA-QT261000002 เพิ่มขึ้น');
  await golden.screen('waiting-for-stock-cut');
});
