import { test, expect } from '../support/test';

// Buttons of the goods receipt window no other scenario pressed (docs/BEHAVIORS.md): the number in the register,
// "พิมพ์ใบรับสินค้า" (it presses the window's own print button), "คัดลอกใบนี้" and "ยกเลิกเอกสาร" of the window's
// toolbar, and "บันทึก" of the side rail (it presses the window's own save button).
test('S271 ใบรับสินค้า: เปิดจากเลขที่ในทะเบียน พิมพ์ คัดลอกเป็นใบใหม่ บันทึกรออนุมัติ แล้วยกเลิกใบที่คัดลอก', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await golden.step('ทะเบียนใบรับสินค้า');

  await page.getByText('MA-RC261000001', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบรับสินค้า' })).toBeVisible();
  await golden.step('เปิดใบรับสินค้า MA-RC261000001 จากเลขที่ในทะเบียน');

  let before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์ใบรับสินค้า' }).click();
  await golden.step('กดพิมพ์ใบรับสินค้า');
  await golden.stateChange('print-gr', before);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('gr-printed');
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: 'คัดลอกใบนี้' }).click();
  await app.settle();
  await golden.step('คัดลอกใบนี้ ได้ใบใหม่ที่มีรายการเดิม');

  before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('heading', { name: 'ยกเลิกใบรับสินค้า MA-RC261000002' })).toBeHidden();
  await app.settle();
  await golden.step('บันทึกใบที่คัดลอก ได้ MA-RC261000002 รออนุมัติ');
  await golden.stateChange('save-copied-gr', before);

  await page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true }).click();
  await golden.step('กดยกเลิกเอกสาร ระบบถามเหตุผล');
  before = await app.state();
  const card = page.getByRole('heading', { name: 'ยกเลิกใบรับสินค้า MA-RC261000002', exact: true }).locator('xpath=ancestor::div[.//button][1]');
  await card.getByRole('textbox').fill('คัดลอกซ้ำโดยไม่ได้ตั้งใจ');
  await card.getByRole('button', { name: 'ยืนยันยกเลิก', exact: true }).click();
  await golden.step('ยืนยันยกเลิกใบรับสินค้า MA-RC261000002');
  await golden.stateChange('cancel-copied-gr', before);

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('row').filter({ hasText: 'MA-RC261000002' }).filter({ visible: true })).toContainText('ยกเลิก');
  await golden.step('ทะเบียนใบรับสินค้าหลังยกเลิก');
});
