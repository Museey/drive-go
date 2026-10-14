import { test } from '../support/test';

test('S37 เพิ่มสาขาที่สองแล้วโอนอะไหล่จากสาขาหลักไปสาขาใหม่', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // เตรียม: ระบบโอนสินค้าได้เมื่อมีอย่างน้อย 2 สาขา จึงเพิ่มสาขาบางนาที่ 11.4 ก่อน
  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await golden.step('เพิ่มสาขา BN สาขาบางนา');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'โอนสินค้าระหว่างสาขา' }).click();
  await golden.step('ทะเบียนใบโอนสินค้า');

  await page.getByRole('button', { name: '+ สร้างใบโอนสินค้า' }).click();
  await golden.step('ใบโอนสินค้าใหม่');

  await page.getByLabel('สาขาปลายทาง *').filter({ visible: true }).selectOption({ label: 'BN · สาขาบางนา' });
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('เติมสต๊อกสาขา');
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001 · ผ้าเบรกหน้า Toyota Revo/ }).click();
  await page.getByRole('row').filter({ hasText: 'BR-001' }).filter({ visible: true }).getByRole('spinbutton').fill('5');
  // ออกจากช่องจำนวนก่อนกดบันทึก: ระบบเดิมวาดปุ่มใหม่ตอนช่องจำนวนเสียโฟกัส
  // ถ้ากดบันทึกทันทีขณะเคอร์เซอร์ยังอยู่ในช่องจำนวน การคลิกครั้งแรกจะหายไป
  await page.keyboard.press('Tab');
  await golden.step('เลือกปลายทาง BN และผ้าเบรกหน้า 5 ชิ้น');

  await page.getByRole('button', { name: 'บันทึกและโอนสินค้า' }).click();
  await golden.step('หน้าต่างยืนยันโอนสินค้า');
  await golden.screen('move-confirm');

  const before = await app.state();
  await page.getByRole('button', { name: 'โอนสินค้า', exact: true }).click();
  await golden.step('หลังกดโอนสินค้า');
  await golden.stateChange('transfer', before);
  await golden.screen('move-done');
});
