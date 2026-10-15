import { test, expect } from '../support/test';

test('S62 ยกเลิกใบกำกับภาษีของบิลที่รับเงินแล้ว ระบบยกเลิกเอกสารต้นทางด้วย', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await golden.step('หน้า 4.6 ใบกำกับภาษี');

  // MA-TX261000003 ของใบตัดสต็อก MA-SA261000010 บริษัท ก่อสร้างพระราม 2 จำกัด (ชำระแล้ว)
  const taxRow = page.getByRole('row').filter({ hasText: 'MA-TX261000003' }).filter({ visible: true });
  await expect(taxRow).toContainText('MA-SA261000010');
  await taxRow.getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(page.getByText('เอกสารต้นทาง MA-SA261000010 จะถูกยกเลิกไปด้วยโดยอัตโนมัติ')).toBeVisible();
  await golden.step('ระบบเตือนว่าเอกสารต้นทางจะถูกยกเลิกด้วย');
  await golden.screen('confirm-cancel-tax');

  await page.getByRole('button', { name: 'ยกเลิกใบกำกับภาษี' }).click();
  // ช่องเหตุผลอยู่ใต้ข้อความถามในป๊อปอัพ
  const reason = page.getByText('ระบุเหตุผลที่ยกเลิก (ไม่บังคับ)', { exact: true }).locator('..').getByRole('textbox');
  await expect(reason).toBeVisible();
  await golden.step('ถามเหตุผลที่ยกเลิก');

  await reason.fill('ลูกค้าแจ้งว่าชื่อบริษัทในใบกำกับภาษีไม่ถูกต้อง');
  const before = await app.state();
  await page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).click();
  await expect(taxRow.getByRole('button', { name: 'ยกเลิก' })).toHaveCount(0);
  await golden.step('หลังยกเลิกใบกำกับภาษี');
  await golden.stateChange('cancel-tax-invoice', before);
  await taxRow.scrollIntoViewIfNeeded();
  await golden.screen('tax-list-after-cancel');

  // เปิดใบต้นทางจากเลขที่ในแถวใบกำกับภาษี
  await taxRow.getByText('MA-SA261000010', { exact: true }).click();
  await expect(page.getByRole('heading', { name: /MA-SA261000010/ }).filter({ visible: true })).toBeVisible();
  await golden.step('เปิดใบตัดสต็อก MA-SA261000010 หลังยกเลิกใบกำกับภาษี');
  await golden.screen('source-doc-after-cancel');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // รายการ "ดูทั้งหมด" ของเอกสารเดิมไม่แสดงใบที่ยกเลิกแล้ว (14 ใบ − ยกเลิก 2 ใบ)
  await page.getByRole('button', { name: '└ 4.3 ใบเสร็จรับเงิน' }).click();
  await page.getByRole('button', { name: 'ดูเอกสารเดิม (ใบเสร็จ / ใบแจ้งหนี้ของระบบเดิม)' }).click();
  await page.getByRole('button', { name: 'ดูทั้งหมด' }).click();
  await expect(page.getByRole('row', { name: /^รวม 12 ฉบับ/ })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'MA-SA261000010' }).filter({ visible: true })).toHaveCount(0);
  await golden.step('รายการเอกสารทั้งหมดไม่มี MA-SA261000010 แล้ว');
  await golden.screen('all-docs');

  // เปิดบิลอีกใบของลูกค้ารายเดียวกันจากรายการ
  const beforeOpen = await app.state();
  await page.getByRole('row').filter({ hasText: 'MA-SA261000011' }).filter({ visible: true })
    .getByRole('button', { name: 'เปิด' }).click();
  await expect(page.getByRole('heading', { name: /MA-SA261000011/ }).filter({ visible: true })).toBeVisible();
  await golden.step('เปิดใบตัดสต็อก MA-SA261000011 จากรายการเอกสารทั้งหมด');
  await golden.stateChange('open-doc', beforeOpen);
});
