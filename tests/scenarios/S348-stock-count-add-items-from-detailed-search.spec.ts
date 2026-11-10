import { test, expect } from '../support/test';

// "ค้นหาละเอียด" of the stock count window (the shared detailed search, sending "+ เพิ่ม" to the count instead of a goods
// receipt) was never pressed in a scenario (docs/BEHAVIORS.md).
test('S348 ใบตรวจนับสินค้า: เพิ่มรายการที่จะนับจากหน้าต่างค้นหาละเอียด', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: /ตรวจนับสินค้า/ }).first().click();
  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await golden.step('ใบตรวจนับสินค้าใหม่');

  await page.getByRole('button', { name: 'ค้นหาละเอียด' }).filter({ visible: true }).click();
  await golden.step('หน้าต่างค้นหาสินค้าละเอียด');
  const kw = page.getByPlaceholder('พิมพ์เพื่อค้นหาสินค้า');
  await kw.pressSequentially('ผ้าเบรก');
  await golden.step('พิมพ์ "ผ้าเบรก"');
  await page.getByRole('row').filter({ hasText: 'BR-001' }).filter({ visible: true }).getByRole('button', { name: '+ เพิ่ม' }).click();
  await kw.fill('');
  await kw.pressSequentially('SU-350');
  await page.getByRole('row').filter({ hasText: 'SU-350' }).filter({ visible: true }).getByRole('button', { name: '+ เพิ่ม' }).click();
  await golden.step('กด + เพิ่ม ผ้าเบรกหน้า BR-001 และลูกหมาก SU-350');
  await page.getByRole('heading', { name: 'ค้นหาสินค้าละเอียด' }).locator('xpath=ancestor::div[.//button][1]').getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await expect(page.getByRole('row').filter({ hasText: 'SU-350' }).filter({ visible: true })).toBeVisible();
  await golden.step('ปิดหน้าต่าง ใบตรวจนับมี 2 รายการ');
  await golden.screen('count-lines');
});
