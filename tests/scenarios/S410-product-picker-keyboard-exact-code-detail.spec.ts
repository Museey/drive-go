import { test, expect } from '../support/test';

// The product picker of a new quotation, used every other way than a click on a suggestion: the quick search opened
// and moved through with ↓ / ↑ and taken with Enter, closed with Esc; a full code typed in "รหัสสินค้าเต็ม" with Enter
// (a wrong code first); "ค้นหาสินค้าละเอียด" with its search box, next / previous page, two items added, closed.
test('S410 เลือกสินค้าเข้าใบเสนอราคาด้วยแป้นพิมพ์ รหัสสินค้าเต็ม และหน้าค้นหาสินค้าละเอียดพร้อมเปลี่ยนหน้า', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  await golden.step('ใบเสนอราคาใหม่');

  const lines = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });

  // Quick search with the keyboard.
  const quick = page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true });
  await quick.fill('กรองแอร์');
  await expect(page.getByRole('option').first()).toBeVisible();
  await golden.step('พิมพ์กรองแอร์ในค้นหาสินค้าเร็ว');
  await quick.press('ArrowDown');
  await quick.press('ArrowDown');
  await quick.press('ArrowUp');
  await golden.step('เลื่อนรายการด้วยลูกศรลง ลง ขึ้น');
  await quick.press('Enter');
  await expect(lines).toHaveCount(1);
  await golden.step('กด Enter เลือกสินค้ารายการแรก');
  await quick.fill('น้ำมันเครื่อง');
  await expect(page.getByRole('option').first()).toBeVisible();
  await quick.press('Escape');
  await expect(page.getByRole('option')).toHaveCount(0);
  await golden.step('พิมพ์น้ำมันเครื่องแล้วกด Esc ปิดรายการ');

  // A full code.
  const exact = page.getByLabel('รหัสสินค้าเต็ม / ค้นหาละเอียด').filter({ visible: true });
  await exact.fill('EL-11');
  await exact.press('Enter');
  await expect(page.getByText('ไม่พบรหัสสินค้าตรงกัน กรุณาพิมพ์รหัสเต็ม').filter({ visible: true })).toBeVisible();
  await golden.step('พิมพ์รหัสไม่เต็ม EL-11 แล้วกด Enter');
  await exact.fill('EL-118');
  await exact.press('Enter');
  await expect(lines).toHaveCount(2);
  await golden.step('พิมพ์รหัสเต็ม EL-118 แล้วกด Enter ได้แบตเตอรี่เข้าใบเสนอราคา');

  // The detailed search.
  await page.getByRole('button', { name: 'ค้นหาสินค้าละเอียด' }).filter({ visible: true }).click();
  const dialog = page.getByRole('dialog', { name: 'ค้นหาสินค้าละเอียด' });
  await expect(dialog).toBeVisible();
  await golden.step('หน้าค้นหาสินค้าละเอียด');
  await dialog.getByRole('button', { name: 'ถัดไป' }).click();
  await golden.step('หน้าถัดไป');
  await dialog.getByRole('button', { name: 'ก่อนหน้า' }).click();
  await golden.step('กลับหน้าก่อนหน้า');
  await dialog.getByRole('searchbox', { name: 'ค้นหาในรายการ' }).fill('ผ้าเบรก');
  await golden.step('ค้นหาผ้าเบรก');
  await golden.screen('detail-search');
  await dialog.getByRole('button', { name: 'เลือก', exact: true }).first().click();
  await expect(lines).toHaveCount(3);
  await golden.step('เพิ่มผ้าเบรกรายการแรก');
  await dialog.getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(dialog).toBeHidden();
  await golden.step('ปิดหน้าค้นหาสินค้าละเอียด ใบเสนอราคามี 3 รายการ');
});
