import { test, expect } from '../support/test';

test('S50 เพิ่มหน่วยนับ "ขวด" และหมวด "น้ำยาและสารเคมี" จากหน้ารายละเอียดสินค้า แล้วย้ายน้ำยาล้างระบบเชื้อเพลิงไปใช้', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await search.fill('MS-995');
  await search.press('Enter');
  await page.getByText('MS-995', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByPlaceholder('เพิ่มหน่วยนับใหม่')).toBeVisible();
  await golden.step('เปิดรายละเอียดสินค้า MS-995 น้ำยาล้างระบบเชื้อเพลิง');

  // The unit and category boxes of this form are the selects that offer "ชิ้น" / "อะไหล่เบ็ดเตล็ด".
  const unit = page.getByRole('combobox').filter({ has: page.getByRole('option', { name: 'กิโลกรัม', exact: true }) }).filter({ visible: true });
  const cat = page.getByRole('combobox')
    .filter({ has: page.getByRole('option', { name: 'อะไหล่เบ็ดเตล็ด', exact: true }) })
    .filter({ hasNot: page.getByRole('option', { name: /ทุกหมวด/ }) })
    .filter({ visible: true });
  await expect(unit).toHaveValue('ชิ้น');
  await expect(cat).toHaveValue('อะไหล่เบ็ดเตล็ด');

  const before = await app.state();
  await page.getByPlaceholder('เพิ่มหน่วยนับใหม่').fill('ขวด');
  await page.getByRole('button', { name: '+ เพิ่ม', exact: true }).click();
  await expect(unit).toHaveValue('ขวด');
  await golden.step('กด + เพิ่ม หน่วยนับ "ขวด"');

  await page.getByPlaceholder('เพิ่มหมวดอะไหล่ใหม่ เช่น อะไหล่ระบบไฟฟ้า EV').fill('น้ำยาและสารเคมี');
  await page.getByRole('button', { name: '+ เพิ่มหมวด', exact: true }).filter({ visible: true }).click();
  await expect(cat).toHaveValue('น้ำยาและสารเคมี');
  await golden.step('กด + เพิ่มหมวด "น้ำยาและสารเคมี"');
  // Both are saved at once, before the item itself is saved.
  await golden.stateChange('add-unit-and-category', before);
  await golden.screen('item-form-new-unit-category');

  const beforeSave = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByPlaceholder('เพิ่มหน่วยนับใหม่')).toBeHidden();
  await golden.step('หลังกดบันทึกสินค้า');
  await golden.stateChange('save-item', beforeSave);

  const row = page.getByRole('row').filter({ hasText: 'น้ำยาล้างระบบเชื้อเพลิง' }).filter({ visible: true });
  await expect(row).toContainText('น้ำยาและสารเคมี');
  await expect(row).toContainText('ขวด');
  await row.scrollIntoViewIfNeeded();
  await golden.step('ทะเบียนอะไหล่แสดงหมวดและหน่วยใหม่');
  await golden.screen('item-in-register');
});
