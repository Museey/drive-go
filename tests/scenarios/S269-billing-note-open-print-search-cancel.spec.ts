import { test, expect } from '../support/test';

// Buttons of 4.5 ใบวางบิล no other scenario pressed (docs/BEHAVIORS.md): the register's search (Enter and
// "ค้นหาข้อมูล"), the note's number in the register, "พิมพ์ใบวางบิล" in the window (it presses the window's own
// print button), ✕, and "ยกเลิก" in the register with its reason.
test('S269 ใบวางบิล: ค้นหาในทะเบียน เปิดใบจากเลขที่ พิมพ์ ปิดหน้าต่าง แล้วยกเลิกใบวางบิลพร้อมเหตุผล', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.5 ใบวางบิล' }).click();
  const row = page.getByRole('row').filter({ hasText: 'MA-BL261000001' }).filter({ visible: true });
  await expect(row).toContainText('รอรับชำระ');
  await golden.step('ทะเบียนใบวางบิล');

  const search = page.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า + Enter').filter({ visible: true });
  await search.fill('ไม่มีลูกค้าชื่อนี้');
  await search.press('Enter');
  await expect(row).toBeHidden();
  await golden.step('ค้นหาชื่อที่ไม่มี กด Enter ทะเบียนว่าง');
  await search.fill('บางมด');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await expect(row).toBeVisible();
  await golden.step('ค้นหา "บางมด" กดค้นหาข้อมูล เจอ MA-BL261000001');

  await row.getByText('MA-BL261000001', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบวางบิล' })).toBeVisible();
  await golden.step('เปิดใบวางบิล MA-BL261000001 จากเลขที่ในทะเบียน');
  await golden.screen('billing-opened');

  let before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์ใบวางบิล' }).click();
  await golden.step('กดพิมพ์ใบวางบิล');
  await golden.stateChange('print-billing', before);
  await page.emulateMedia({ media: 'print' });
  await golden.screen('billing-printed');
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบวางบิล' })).toBeHidden();
  await golden.step('ปิดหน้าต่างใบวางบิล');

  await row.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await golden.step('กดยกเลิกใบวางบิล ระบบถามเหตุผล');
  before = await app.state();
  const card = page.getByRole('heading', { name: 'ยกเลิกใบวางบิล MA-BL261000001', exact: true }).locator('xpath=ancestor::div[.//button][1]');
  await card.getByRole('textbox').fill('ลูกค้าขอรวมบิลเดือนหน้า');
  await card.getByRole('button', { name: 'ยกเลิกเอกสาร', exact: true }).click();
  await expect(row).toContainText('ยกเลิกแล้ว');
  await golden.step('ยืนยันยกเลิก ใบวางบิลเป็น "ยกเลิกแล้ว" พร้อมเหตุผล');
  await golden.stateChange('cancel-billing', before);
  await golden.screen('billing-cancelled');
});
