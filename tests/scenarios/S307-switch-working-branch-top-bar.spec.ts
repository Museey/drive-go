import { test, expect } from '../support/test';

// The "สาขา" box on the top bar (the branch being worked in) can be changed once the shop has two branches.
// No legacy scenario changed it (docs/BEHAVIORS.md; S247 is the new system's own behaviour, answer 10.7).
const workingBranch = (page: import('@playwright/test').Page) => page.getByRole('combobox', { name: 'สาขาที่กำลังทำงาน' });

test('S307 เพิ่มสาขาบางนาแล้วเปลี่ยนสาขาที่กำลังทำงานที่แถบบน ทะเบียนอะไหล่แสดงยอดของสาขานั้น แล้วเปลี่ยนกลับ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await expect(workingBranch(page)).toBeDisabled();
  await golden.step('หน้าแรก มีสาขาเดียว ช่องสาขาบนแถบบนเลือกไม่ได้');

  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(workingBranch(page)).toBeEnabled();
  await app.settle();
  await golden.step('เพิ่มสาขา BN สาขาบางนา ช่องสาขาบนแถบบนเลือกได้');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  const register = page.getByRole('table').filter({ has: page.getByRole('cell', { name: /ชื่อสินค้า/ }) }).filter({ visible: true }).first();
  await expect(register.getByRole('row').nth(1)).toBeVisible();
  await golden.step('ทะเบียนอะไหล่ของสาขาหลัก');
  const mainRows = await register.innerText();

  let before = await app.state();
  await workingBranch(page).selectOption({ label: 'BN · สาขาบางนา' });
  await expect(workingBranch(page).locator('option:checked')).toHaveText('BN · สาขาบางนา');
  expect(await register.innerText()).not.toEqual(mainRows);
  await app.settle();
  await golden.step('เปลี่ยนสาขาที่กำลังทำงานเป็น BN สาขาบางนา');
  await golden.stateChange('to-bangna', before);
  await golden.screen('stock-in-bangna');

  before = await app.state();
  await workingBranch(page).selectOption({ label: 'MA · สาขาหลัก' });
  await expect.poll(() => register.innerText()).toEqual(mainRows);
  await app.settle();
  await golden.step('เปลี่ยนกลับเป็นสาขาหลัก');
  await golden.stateChange('back-to-main', before);
});
