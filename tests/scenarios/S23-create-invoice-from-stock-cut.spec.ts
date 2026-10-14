import { test, expect } from '../support/test';

test('S23 สร้างใบแจ้งหนี้จากใบตัดสต็อกเงินเชื่อ แล้วอนุมัติ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('ใบเสร็จรับเงิน / ใบกำกับภาษี', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: '4.2 ใบแจ้งหนี้' }).click();
  await golden.step('4.2 ใบแจ้งหนี้');

  await page.getByRole('button', { name: '+ สร้างใบแจ้งหนี้' }).click();
  await golden.step('เลือกใบตัดสต็อกที่จะออกใบแจ้งหนี้');

  // MA-SA261000009 บริษัท ผักสดเดลิเวอรี่ จำกัด เงินเชื่อ 30 วัน ยอด 3,766.40
  await page.getByRole('row').filter({ hasText: 'MA-SA261000009' }).filter({ visible: true })
    .getByRole('button', { name: 'สร้างใบแจ้งหนี้' }).click();
  await page.getByText('ใบแจ้งหนี้ — เอกสารใหม่').filter({ visible: true }).waitFor();
  await golden.step('ใบแจ้งหนี้ใหม่จาก MA-SA261000009');
  await golden.screen('new-invoice');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ไม่อนุมัติ / ตีกลับ' })).toBeVisible();
  await golden.step('บันทึกแล้ว รออนุมัติ');

  await page.getByRole('button', { name: 'อนุมัติ', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'ใบแจ้งหนี้ (A4)' })).toBeVisible();
  await golden.step('อนุมัติใบแจ้งหนี้แล้ว');
  await golden.stateChange('create-invoice', before);
  await golden.screen('approved-invoice');
});
