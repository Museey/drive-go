import { test, expect } from '../support/test';

test('S55 ตั้งค่าองค์กร: แก้เบอร์โทรและเพจร้าน กดต่ออายุ +1 ปี บันทึกการตั้งค่า แล้วอัปโหลดและลบโลโก้', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const tel = field('เบอร์โทรศัพท์'), web = field('เว็บไซต์ / เพจ (ถ้ามี)');
  await expect(tel).toHaveValue('02-555-1234, 081-555-1234');
  await expect(field('วันที่สิ้นสุดการใช้งาน (Expired Date)')).toHaveValue('2027-02-10');
  await expect(field('อายุการใช้งานคงเหลือ')).toHaveValue('120 วัน');
  await page.getByText('ตั้งค่าองค์กร · ข้อมูลผู้ใช้งานที่แสดงบนหัวเอกสาร').scrollIntoViewIfNeeded();
  await golden.step('หน้าตั้งค่าองค์กร');
  await golden.screen('settings-before');

  await tel.fill('02-555-1234, 081-555-1234, 095-123-4567');
  await web.fill('facebook.com/drivegoservice');
  let before = await app.state();
  await page.getByRole('button', { name: 'ต่ออายุ +1 ปี' }).click();
  await expect(field('วันที่สิ้นสุดการใช้งาน (Expired Date)')).toHaveValue('2028-02-10');
  await expect(field('อายุการใช้งานคงเหลือ')).toHaveValue('485 วัน');
  // Legacy behaviour reported to the owner: the button saves at once and refills the whole form from the
  // saved data, so the phone number and page typed just before are gone.
  await expect(tel).toHaveValue('02-555-1234, 081-555-1234');
  await expect(web).toHaveValue('');
  await golden.step('พิมพ์เบอร์และเพจ แล้วกดต่ออายุ +1 ปี ช่องที่พิมพ์ไว้กลับเป็นค่าเดิม');
  await golden.stateChange('extend-license', before);

  await tel.fill('02-555-1234, 081-555-1234, 095-123-4567');
  await web.fill('facebook.com/drivegoservice');
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await expect(web).toHaveValue('facebook.com/drivegoservice');
  await golden.step('พิมพ์ใหม่แล้วกดบันทึกการตั้งค่า');
  await golden.stateChange('save-setting', before);

  const logoBox = page.getByText('โลโก้กิจการ', { exact: true }).locator('..');
  before = await app.state();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'เลือกไฟล์โลโก้' }).click();
  await (await chooser).setFiles('tests/assets/S55-shop-logo.png');
  await expect(logoBox.getByRole('img')).toBeVisible();
  await logoBox.scrollIntoViewIfNeeded();
  await golden.step('เลือกไฟล์โลโก้ ระบบบันทึกทันที');
  await golden.stateChange('upload-logo', before);
  await golden.screen('logo-uploaded');

  await page.getByRole('button', { name: 'ลบโลโก้' }).click();
  await expect(page.getByText('ลบโลโก้ออกจากระบบ?')).toBeVisible();
  await golden.step('กดลบโลโก้ ระบบถามยืนยัน');
  before = await app.state();
  // The bank rows on this page have "ลบ" buttons too: press the one on the confirm card.
  const card = page.locator('div').filter({ hasText: 'ลบโลโก้ออกจากระบบ?' }).filter({ has: page.getByRole('button', { name: 'ไม่ลบ' }) }).last();
  await card.getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(logoBox.getByText('ยังไม่มีโลโก้')).toBeVisible();
  await golden.step('หลังยืนยันลบโลโก้');
  await golden.stateChange('clear-logo', before);
  await golden.screen('logo-cleared');
});
