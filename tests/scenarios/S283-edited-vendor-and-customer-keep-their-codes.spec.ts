import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';

// Replaces S272 in the new system (tests/intentional-changes.json, owner 2026-11-09): an edited vendor or customer
// keeps its code. The legacy app gave the record the next code on every save (V00002 → V00009); here the vendor stays
// V00002, so that data change is S272's without the new code. Every step and every other data change is S272's; after
// them, a customer edited the same way keeps C00027.
const S272 = 'S272-master-data-edit-delete-and-appointment.spec.ts';

test('S283 ระบบใหม่: แก้ไขผู้ขายและลูกค้าแล้วรหัสเดิมคงอยู่ ลบผู้ขาย ลบลูกค้า ลบสินค้า เพิ่มหมวดด้วย Enter และบันทึกนัดหมาย', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S272, { app, page, testInfo });
  test.slow();
  await app.loginAsOwner();

  // Answers the confirm card with this title.
  const confirm = async (title: string, answer: string) => {
    const card = page.getByRole('heading', { name: title, exact: true }).locator('xpath=ancestor::div[.//button][1]');
    await card.getByRole('button', { name: answer, exact: true }).click();
  };

  // 05 vendors: edit V00002's contact, then delete V00008.
  await page.getByRole('button', { name: /^05 ข้อมูลผู้ขาย/ }).click();
  const ven = (name: string) => page.getByRole('row').filter({ hasText: name }).filter({ visible: true });
  await ven('หจก. ไทยพาร์ท ซัพพลาย').getByRole('button', { name: 'แก้ไข', exact: true }).click();
  const contact = page.getByLabel('ผู้ติดต่อ', { exact: false }).filter({ visible: true }).first();
  await expect(contact).toHaveValue('คุณมาลี');
  await golden.step('เปิดแก้ไขผู้ขาย หจก. ไทยพาร์ท ซัพพลาย');
  let before = await app.state();
  await contact.fill('คุณมาลี (ฝ่ายขาย)');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(ven('หจก. ไทยพาร์ท ซัพพลาย')).toContainText('คุณมาลี (ฝ่ายขาย)');
  await expect(ven('หจก. ไทยพาร์ท ซัพพลาย')).toContainText('V00002');
  await golden.step('บันทึกผู้ติดต่อใหม่ของผู้ขาย');
  // S272's change of this save, with the record keeping V00002 (no code change).
  const kept = JSON.parse(legacyStateChange(S272, 'save-vendor').split('DB.vendors[V00009]').join('DB.vendors[V00002]'));
  expect(kept['DB.vendors[V00002].code']).toEqual(['V00002', 'V00009']);
  delete kept['DB.vendors[V00002].code'];
  await app.settle();
  expect(JSON.parse(formatDiff(stateDiff(before, await app.state()))), 'data change save-vendor').toEqual(kept);

  await ven('บริษัท ออโต้พาร์ทดีโป้ จำกัด (มหาชน)').getByRole('button', { name: 'ลบ', exact: true }).click();
  await golden.step('กดลบผู้ขาย บริษัท ออโต้พาร์ทดีโป้ ระบบถามยืนยัน');
  before = await app.state();
  await confirm('ลบผู้ขาย', 'ลบ');
  await expect(ven('บริษัท ออโต้พาร์ทดีโป้ จำกัด (มหาชน)')).toHaveCount(0);
  await golden.step('ลบผู้ขายแล้ว');
  await golden.stateChange('delete-vendor', before);

  // 02 customers: delete C00028 บุญมี แสงทอง (no documents).
  await page.getByRole('button', { name: /^02 ข้อมูลลูกค้า/ }).click();
  const cust = page.getByRole('row').filter({ hasText: 'C00028' }).filter({ visible: true });
  await expect(cust).toContainText('บุญมี แสงทอง');
  await golden.step('รายชื่อลูกค้า');
  await cust.getByRole('button', { name: 'ลบ', exact: true }).click();
  await golden.step('กดลบลูกค้า บุญมี แสงทอง ระบบถามยืนยัน');
  before = await app.state();
  await confirm('ลบลูกค้า', 'ลบ');
  await expect(cust).toHaveCount(0);
  await golden.step('ลบลูกค้าแล้ว');
  await golden.stateChange('delete-customer', before);

  // 07 stock: delete MS-995 from its window.
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await search.fill('MS-995');
  await search.press('Enter');
  const item = page.getByRole('row').filter({ hasText: 'น้ำยาล้างระบบเชื้อเพลิง' }).filter({ visible: true });
  await item.getByText('MS-995', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'ลบสินค้า' })).toBeVisible();
  await golden.step('เปิดหน้าต่างสินค้า MS-995');
  await page.getByRole('button', { name: 'ลบสินค้า' }).click();
  await golden.step('กดลบสินค้า ระบบถามยืนยัน');
  before = await app.state();
  await confirm('ลบสินค้า', 'ลบ');
  await expect(item).toHaveCount(0);
  await golden.step('ลบสินค้า MS-995 แล้ว');
  await golden.stateChange('delete-stock', before);

  // Stock settings: a new category typed and entered with Enter.
  await page.getByRole('button', { name: 'ตั้งค่าสินค้าและอะไหล่' }).click();
  const newCat = page.getByPlaceholder('เช่น อะไหล่ระบบไฮบริด');
  await expect(newCat).toBeVisible();
  before = await app.state();
  await newCat.fill('อุปกรณ์ตกแต่งรถ');
  await newCat.press('Enter');
  await expect(page.getByRole('row').filter({ hasText: 'อุปกรณ์ตกแต่งรถ' }).filter({ visible: true }).first()).toBeVisible();
  await golden.step('พิมพ์หมวดใหม่ "อุปกรณ์ตกแต่งรถ" แล้วกด Enter');
  await golden.stateChange('add-category-enter', before);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // 01 CRM: a new appointment from "+ บันทึกนัดหมาย".
  await page.getByRole('button', { name: /01 ลูกค้าสัมพันธ์/ }).click();
  await page.getByRole('button', { name: '+ บันทึกนัดหมาย' }).click();
  await expect(page.getByRole('button', { name: 'บันทึกนัดหมาย', exact: true })).toBeVisible();
  await page.getByRole('textbox').filter({ visible: true }).last().fill('โทรนัดตรวจเช็กแอร์ก่อนสงกรานต์');
  await golden.step('กรอกนัดหมายตรวจเช็กตามระยะรับประกัน');
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึกนัดหมาย', exact: true }).click();
  await expect(page.getByRole('button', { name: 'บันทึกนัดหมาย', exact: true })).toBeHidden();
  await golden.step('บันทึกนัดหมายแล้ว');
  await golden.stateChange('save-appointment', before);
  golden.done();

  // A customer edited and saved keeps its code too (C00027 สุนีย์ ทวีทรัพย์).
  await page.getByRole('button', { name: /^02 ข้อมูลลูกค้า/ }).click();
  const sunee = page.getByRole('row').filter({ hasText: 'สุนีย์ ทวีทรัพย์' }).filter({ visible: true });
  await expect(sunee).toContainText('C00027');
  await sunee.getByRole('button', { name: 'แก้ไข', exact: true }).click();
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลลูกค้าแล้ว').filter({ visible: true }).first()).toBeVisible();
  await app.settle();
  const after = await app.state() as any;
  expect(after.DB.cust.find((c: any) => c.name === 'สุนีย์ ทวีทรัพย์').code).toBe('C00027');
  expect(Object.keys(stateDiff(before, after)).filter(k => /\.code$/.test(k))).toEqual([]);
  await expect(sunee).toContainText('C00027');
});
