import { test, expect } from '../support/test';

// Sample files: tests/assets/S54-customers.csv (2 new customers with 3 cars, 1 more car for an existing
// customer, 1 car already in the system, 1 row without a name) and tests/assets/S54-stock.csv (4 new items,
// one with a category and unit that are not on the lists, 1 code already in the register, 1 code repeated
// in the file, 1 empty row).
test('S54 นำเข้าลูกค้า / รถ และอะไหล่ใหม่จากไฟล์ CSV ที่เมนู 11.3 (แถวซ้ำและแถวไม่ครบถูกข้าม)', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '11 ตั้งค่าเพิ่มเติม' }).click();
  await page.getByRole('button', { name: '11.3 นำเข้า / ส่งออกข้อมูล' }).click();
  await golden.step('หน้านำเข้า / ส่งออกข้อมูล');

  let chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /^นำเข้าลูกค้า \/ รถจากไฟล์ CSV/ }).click();
  await (await chooser).setFiles('tests/assets/S54-customers.csv');
  await expect(page.getByText('ลูกค้าใหม่ 2 ราย · รถ 3 คัน')).toBeVisible();
  await golden.step('เลือกไฟล์ลูกค้า ระบบสรุปก่อนนำเข้า');
  await golden.screen('confirm-import-customers');

  let before = await app.state();
  await page.getByRole('button', { name: 'นำเข้า', exact: true }).click();
  await expect(page.getByText('ในระบบ 32 ราย')).toBeVisible();
  await golden.step('หลังนำเข้าลูกค้า');
  await golden.stateChange('import-customers', before);

  chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /^นำเข้าสินค้าใหม่จากไฟล์ CSV/ }).click();
  await (await chooser).setFiles('tests/assets/S54-stock.csv');
  await expect(page.getByText('พบสินค้าใหม่ 4 รายการ', { exact: false })).toBeVisible();
  await golden.step('เลือกไฟล์สินค้า ระบบสรุปก่อนนำเข้า');
  await golden.screen('confirm-import-stock');

  before = await app.state();
  await page.getByRole('button', { name: 'นำเข้า', exact: true }).click();
  await expect(page.getByText('ในระบบ 56 รายการ')).toBeVisible();
  await golden.step('หลังนำเข้าสินค้า');
  await golden.stateChange('import-stock', before);

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await search.fill('AC-240');
  await search.press('Enter');
  const row = page.getByRole('row').filter({ hasText: 'สเปรย์ล้างคอยล์เย็น' }).filter({ visible: true });
  await expect(row).toContainText('สารเคมีแอร์');
  await row.scrollIntoViewIfNeeded();
  await golden.step('ค้นหา AC-240 ที่นำเข้า ในทะเบียนอะไหล่');
  await golden.screen('imported-item-in-register');

  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  const custSearch = page.getByPlaceholder('ค้นหา ยี่ห้อ / ทะเบียน / ชื่อลูกค้า / เบอร์โทร');
  await custSearch.fill('ส่งด่วนบางขุนเทียน');
  await custSearch.press('Enter');
  const cars = page.getByRole('row').filter({ hasText: 'บริษัท ส่งด่วนบางขุนเทียน จำกัด' }).filter({ visible: true });
  await expect(cars).toHaveCount(2);
  await cars.first().scrollIntoViewIfNeeded();
  await golden.step('ค้นหาบริษัทที่นำเข้า เจอรถ 2 คัน');
  await golden.screen('imported-company-in-customers');
});
