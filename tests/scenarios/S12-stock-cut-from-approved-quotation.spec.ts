import { test, expect } from '../support/test';

test('S12 ตัดสต็อกจากใบเสนอราคาที่อนุมัติแล้ว แล้วบันทึกรอรับชำระ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: 'ใบเสนอราคาที่รอตัดสต็อก 2' }).click();
  await golden.step('รายการใบเสนอราคาที่รอตัดสต็อก');

  // MA-QT261000003 ปรีชา ทองสุข: EL-118 แบตเตอรี่ 75Ah 1 × 3,810 + EL-125 ชุดคอยล์จุดระเบิด 1 × 1,590
  await page.getByText('MA-QT261000003', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('รายการมาจากใบเสนอราคา MA-QT261000003', { exact: false }).filter({ visible: true })).toBeVisible();
  await golden.step('ใบตัดสต็อกใหม่ที่ดึงรายการจากใบเสนอราคา MA-QT261000003');
  await golden.screen('cut-from-quote');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await golden.step('หลังบันทึกใบตัดสต็อก');
  await golden.stateChange('cut-from-quote', before);
  await golden.screen('saved');

  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();
  await expect(page.getByRole('button', { name: 'ใบเสนอราคาที่รอตัดสต็อก 1' })).toBeVisible();
  await golden.step('กลับหน้า 4.1 เหลือใบเสนอราคารอตัดสต็อก 1 ใบ');
});
