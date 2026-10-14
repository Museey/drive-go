import { test, expect } from '../support/test';

test('S24 สร้างใบวางบิลรวมบิลค้างชำระของลูกค้ารายเดียว แล้วอนุมัติ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('ใบเสร็จรับเงิน / ใบกำกับภาษี', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: '4.5 ใบวางบิล' }).click();
  await golden.step('4.5 ใบวางบิล');

  await page.getByRole('button', { name: '+ สร้างใบวางบิลใหม่' }).click();
  await golden.step('ใบวางบิลใหม่');

  // วิภา ศรีสมบูรณ์ ค้าง 2 ใบ: MA-SA261000004 (10,058.00) และ MA-SA261000014 (310.30)
  await page.getByPlaceholder('พิมพ์ชื่อ / บริษัท / เบอร์โทร / ทะเบียนรถ').filter({ visible: true }).fill('วิภา');
  await page.getByText('วิภา ศรีสมบูรณ์', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ดึงใบเสร็จค้างชำระ' }).click();
  await page.getByText('เลือกแล้ว 2 ใบ · ยอดรวม 10,368.30 บาท').filter({ visible: true }).waitFor();
  await page.getByRole('textbox', { name: 'กำหนดชำระ' }).filter({ visible: true }).fill('2026-11-12');
  await page.getByRole('textbox', { name: 'หมายเหตุ' }).filter({ visible: true }).fill('วางบิลงวดเดือนตุลาคม');
  await golden.step('เลือกลูกค้าและดึงบิลค้างชำระ 2 ใบ');
  await golden.screen('billing-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await page.getByText('ใบวางบิลเป็นเอกสารแสดงยอดค้างของลูกค้า').filter({ visible: true }).waitFor();
  await golden.step('บันทึกใบวางบิลแล้ว');

  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'อนุมัติเอกสาร' }).filter({ visible: true })).toHaveCount(0);
  await golden.step('อนุมัติใบวางบิลแล้ว');
  await golden.stateChange('create-billing-note', before);
  await golden.screen('billing-approved');
});
