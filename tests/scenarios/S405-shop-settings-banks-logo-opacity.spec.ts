import { test, expect } from '../support/test';

// 10 ตั้งค่าองค์กร: the person / company switch (the company fields dim and come back), a file that is not a picture
// chosen as the logo (refused with a message), the watermark strength slider, a bank account added and another
// removed, saved.
test('S405 ตั้งค่าองค์กร เพิ่มบัญชีธนาคารใหม่ ลบบัญชีเดิม ปรับความเข้มลายน้ำ และเลือกไฟล์โลโก้ที่ไม่ใช่รูปภาพจะถูกเตือน', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await golden.step('ตั้งค่าองค์กร');

  await page.getByRole('button', { name: 'บุคคลธรรมดา', exact: true }).filter({ visible: true }).click();
  await golden.step('กดบุคคลธรรมดา ช่องนิติบุคคลจางลง');
  await page.getByRole('button', { name: 'นิติบุคคล', exact: true }).filter({ visible: true }).click();
  await golden.step('กลับเป็นนิติบุคคล');

  // Not a picture: refused, no logo.
  let before = await app.state();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'เลือกไฟล์โลโก้' }).click();
  await (await chooser).setFiles('tests/assets/S405-broken-logo.png');
  await expect(page.getByText('อ่านไฟล์ภาพไม่ได้ ลองไฟล์ PNG หรือ JPG อีกครั้ง')).toBeVisible();
  await golden.step('เลือกไฟล์โลโก้ที่ไม่ใช่รูปภาพ');
  await golden.stateChange('broken-logo', before);

  const slider = page.getByRole('slider');
  await slider.fill('15');
  await expect(page.getByText('15%', { exact: true })).toBeVisible();
  await golden.step('ปรับความเข้มลายน้ำเป็น 15%');

  // Banks: a new Krungthai account, the Bangkok Bank one removed.
  await page.getByRole('button', { name: '+ เพิ่มบัญชีธนาคาร' }).click();
  const rows = page.locator('.bankrow');
  await expect(rows).toHaveCount(4);
  const added = rows.last();
  await added.getByRole('combobox').selectOption('ธนาคารกรุงไทย');
  await added.getByPlaceholder('เลขที่บัญชี').fill('987-6-54321-0');
  await added.getByPlaceholder('ชื่อบัญชี').fill('หจก.เอกหม้อน้ำ');
  await golden.step('เพิ่มบัญชีธนาคารกรุงไทย 987-6-54321-0');
  await rows.filter({ has: page.getByPlaceholder('เลขที่บัญชี').and(page.locator('[value="789-0-12345-6"]')) })
    .getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(rows).toHaveCount(3);
  await golden.step('ลบบัญชีธนาคารกรุงเทพ 789-0-12345-6');
  await golden.screen('banks-edited');

  before = await app.state();
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).click();
  await app.settle();
  await golden.step('บันทึกการตั้งค่า');
  await golden.stateChange('save-settings', before);
});
