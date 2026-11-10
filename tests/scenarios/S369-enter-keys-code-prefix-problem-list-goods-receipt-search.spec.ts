import { test, expect } from '../support/test';

// Keys and boxes no other scenario used (docs/BEHAVIORS.md): Enter saves a new code prefix in the customer register's
// settings, Enter adds a new item in 11.2 ทะเบียนปัญหา, and the search box at the top of a goods receipt lists the
// goods receipts with their vendors.
test('S369 กด Enter บันทึกอักษรนำหน้ารหัส กด Enter เพิ่มรายการทะเบียนปัญหา และค้นหาใบรับสินค้าที่หัวหน้าต่าง', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();

  // 02: a new prefix saved with Enter.
  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await page.getByRole('button', { name: 'ตั้งค่าทะเบียนลูกค้า' }).click();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).click();
  await page.getByPlaceholder('ระบุสูงสุด 5 ตัวอักษร').fill('FL');
  let before = await app.state();
  await page.getByPlaceholder('ระบุสูงสุด 5 ตัวอักษร').press('Enter');
  await expect(page.getByRole('cell', { name: 'FL', exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('พิมพ์อักษรนำหน้า FL แล้วกด Enter บันทึกแล้ว');
  await golden.stateChange('add-prefix-enter', before);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // 11.2: a new problem added with Enter, then saved.
  await page.getByRole('button', { name: /^11 ตั้งค่าเพิ่มเติม/ }).click();
  await page.getByRole('button', { name: '11.2 ทะเบียนปัญหา' }).click();
  const add = page.getByPlaceholder('พิมพ์รายการใหม่ แล้วกด Enter หรือปุ่มเพิ่ม');
  await add.fill('กระจกไฟฟ้าไม่ทำงาน');
  await add.press('Enter');
  await expect(page.locator('input[type="text"]').filter({ visible: true }).and(page.locator('[data-e]')).last()).toHaveValue('กระจกไฟฟ้าไม่ทำงาน');
  await golden.step('11.2 พิมพ์ "กระจกไฟฟ้าไม่ทำงาน" แล้วกด Enter เพิ่มท้ายรายการ');
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('บันทึกทะเบียนปัญหา');
  await golden.stateChange('save-problem-list', before);

  // A goods receipt: the search box at the top lists goods receipts with their vendors.
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByText('MA-RC261000001', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบรับสินค้า' })).toBeVisible();
  const search = page.getByPlaceholder('ค้นหา เลขที่ / ผู้ขาย / ยอดเงิน').filter({ visible: true });
  await search.fill('MA-RC');
  await expect(page.getByText('MA-RC261000001 ·', { exact: false }).filter({ visible: true }).first()).toBeVisible();
  await golden.step('เปิดใบรับสินค้า MA-RC261000001 แล้วพิมพ์ MA-RC ในช่องค้นหาที่หัวหน้าต่าง');
  // No screenshot here: in CI the screen came out two ways run to run (75 pixels, P4 run 2026-11-10); the step checks it.
});
