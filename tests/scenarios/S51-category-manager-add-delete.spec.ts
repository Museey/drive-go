import { test, expect } from '../support/test';

test('S51 ตั้งค่าหมวดอะไหล่: เพิ่มหมวดใหม่ แล้วลบหมวด "ยาง / ล้อ" ที่มีสินค้าและผู้ขายใช้อยู่ สินค้าย้ายไปหมวด "อื่น ๆ"', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'ตั้งค่าสินค้าและอะไหล่' }).click();
  const newCat = page.getByPlaceholder('เช่น อะไหล่ระบบไฮบริด');
  await expect(newCat).toBeVisible();
  await golden.step('หน้าต่างตั้งค่าสินค้าและอะไหล่ เปิดหัวข้อหมวดอะไหล่');

  // Rows of the category list in this window (the register behind it has a summary row per category too).
  const catRow = (name: string | RegExp) => page.getByRole('row').filter({ hasText: name }).filter({ visible: true })
    .filter({ has: page.getByText(/^(มาตรฐาน|เพิ่มเอง)$/) });

  let before = await app.state();
  await newCat.fill('อุปกรณ์ตกแต่งรถ');
  await page.getByRole('button', { name: '+ เพิ่มหมวด', exact: true }).filter({ visible: true }).click();
  const added = catRow('อุปกรณ์ตกแต่งรถ');
  await expect(added).toContainText('เพิ่มเอง');
  await golden.step('เพิ่มหมวด "อุปกรณ์ตกแต่งรถ"');
  await golden.stateChange('add-category', before);

  const tyre = catRow('ยาง / ล้อ');
  await expect(tyre).toContainText('3 รายการ');
  await tyre.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('สินค้า 3 รายการจะถูกย้ายไปหมวด “อื่น ๆ”', { exact: false })).toBeVisible();
  await golden.step('กดลบหมวด "ยาง / ล้อ" ระบบบอกผลกระทบก่อนลบ');
  await golden.screen('confirm-delete-used-category');

  before = await app.state();
  await page.getByRole('button', { name: 'ลบหมวด', exact: true }).click();
  await expect(tyre).toHaveCount(0);
  await expect(catRow('หมวดปลายทาง')).toContainText('4 รายการ');
  await golden.step('หลังลบหมวด "ยาง / ล้อ"');
  await golden.stateChange('delete-used-category', before);

  await added.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('ยังไม่มีสินค้าหรือผู้ขายใช้หมวดนี้', { exact: false })).toBeVisible();
  await golden.step('กดลบหมวด "อุปกรณ์ตกแต่งรถ" ที่ยังไม่มีใครใช้');
  before = await app.state();
  await page.getByRole('button', { name: 'ลบหมวด', exact: true }).click();
  await expect(added).toHaveCount(0);
  await golden.step('หลังลบหมวด "อุปกรณ์ตกแต่งรถ"');
  await golden.stateChange('delete-unused-category', before);
  await golden.screen('category-list-after');

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await search.fill('ยาง');
  await search.press('Enter');
  const tyres = page.getByRole('row').filter({ hasText: /TY-9/ }).filter({ visible: true });
  await expect(tyres).toHaveCount(3);
  for (const r of await tyres.all()) await expect(r).toContainText('อื่น ๆ');
  await tyres.first().scrollIntoViewIfNeeded();
  await golden.step('ค้นหา "ยาง" ในทะเบียน สินค้ายางอยู่หมวด "อื่น ๆ"');
  await golden.screen('tyres-now-other');
});
