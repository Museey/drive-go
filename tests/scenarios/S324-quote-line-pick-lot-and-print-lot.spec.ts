import { test, expect } from '../support/test';

// The lot button of a quote line ("ล็อต: อัตโนมัติ" → the lot window in pick mode: "เลือกล็อตนี้", "ใช้อัตโนมัติ") and the
// quote's print option "แสดงล็อต": no scenario used them.
test('S324 ใบเสนอราคา: เลือกล็อตของรายการอะไหล่ แล้วพิมพ์โดยแสดงล็อต', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  const lots = page.locator('#mLots');

  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill('ปรีชา');
  await custBox.locator('..').getByText('ปรีชา ทองสุข').click();
  await page.getByPlaceholder('1.', { exact: true }).fill('เปลี่ยนน้ำมันเบรก');
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025/ }).click();
  await golden.step('ใบเสนอราคาใหม่ มีน้ำมันเบรก DOT4');

  // Pick the lot, then go back to automatic, then pick again.
  await page.getByRole('button', { name: 'ล็อต: อัตโนมัติ' }).filter({ visible: true }).click();
  await expect(lots.getByRole('heading', { name: 'เลือกล็อต' })).toBeVisible();
  await golden.step('หน้าต่างเลือกล็อตของรายการ');
  await lots.getByRole('button', { name: 'เลือกล็อตนี้' }).click();
  await expect(page.getByRole('button', { name: /ล็อต MA-RC261000001-23/ }).filter({ visible: true })).toBeVisible();
  await golden.step('เลือกล็อต MA-RC261000001-23');
  await page.getByRole('button', { name: /ล็อต MA-RC261000001-23/ }).filter({ visible: true }).click();
  await lots.getByRole('button', { name: 'ใช้อัตโนมัติ' }).click();
  await expect(page.getByRole('button', { name: 'ล็อต: อัตโนมัติ' }).filter({ visible: true })).toBeVisible();
  await golden.step('กดใช้อัตโนมัติ กลับเป็นล็อตอัตโนมัติ');
  await page.getByRole('button', { name: 'ล็อต: อัตโนมัติ' }).filter({ visible: true }).click();
  await lots.getByRole('button', { name: 'เลือกล็อตนี้' }).click();

  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true })).toBeVisible();
  await golden.step('บันทึกใบเสนอราคาพร้อมล็อตที่เลือก');
  await golden.stateChange('save-quote', before);

  // Print with the lot under the item.
  await page.getByText('แสดงล็อต', { exact: true }).filter({ visible: true }).click();
  await golden.step('ติ๊กแสดงล็อตในเงื่อนไขการพิมพ์');
  before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์ใบเสนอราคา (ต้นฉบับ + สำเนา)' }).click();
  await golden.step('พิมพ์ใบเสนอราคา');
  await golden.stateChange('print-quote', before);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#printStage').getByText('ล็อต MA-RC261000001-23').first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('quote-printed-with-lot');
  await page.emulateMedia({ media: 'screen' });
});
