import { test, expect } from '../support/test';

test('S14 ออกใบกำกับภาษีใหม่ (VAT 7%) จากใบตัดสต็อกที่ชำระแล้ว', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await golden.step('หน้า 4.6 ใบกำกับภาษี');

  await page.getByRole('button', { name: '+ ออกใบกำกับภาษีใหม่' }).click();
  // MA-SA261000011 บริษัท ก่อสร้างพระราม 2 จำกัด 1,348.20 บาท ชำระแล้ว ยังไม่มีใบกำกับภาษี
  await page.getByRole('row').filter({ hasText: 'MA-SA261000011' }).filter({ visible: true }).getByRole('radio').check();
  await golden.step('เลือกใบตัดสต็อก MA-SA261000011');

  await page.getByRole('button', { name: 'ออกใบกำกับภาษี', exact: true }).click();
  await expect(page.getByPlaceholder('13 หลัก').filter({ visible: true })).toHaveValue('0105550990011');
  const totals = page.getByText('รวมเป็นเงิน (ก่อน VAT)').filter({ visible: true });
  await totals.scrollIntoViewIfNeeded();
  await golden.step('ฟอร์มใบกำกับภาษี กรอกข้อมูลผู้ซื้อและรายการให้แล้ว');
  await golden.screen('tax-invoice-form');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบกำกับภาษี (ต้นฉบับ + สำเนา)' })).toBeVisible();
  await golden.step('หลังบันทึกใบกำกับภาษี');
  await golden.stateChange('issue-tax-invoice', before);

  await page.getByRole('button', { name: 'ปิดหน้าต่าง' }).filter({ visible: true }).click();
  const newRow = page.getByRole('row').filter({ hasText: 'MA-TX261000004' }).filter({ visible: true });
  await expect(newRow).toContainText('MA-SA261000011');
  await newRow.scrollIntoViewIfNeeded();
  await golden.step('รายการใบกำกับภาษีมี MA-TX261000004');
  await golden.screen('tax-invoice-list');
});
