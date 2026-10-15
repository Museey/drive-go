import { test, expect } from '../support/test';

test.use({ dataset: 'prox-trial' });

// test ต่ออินเทอร์เน็ตไม่ได้ จึงบันทึกได้เฉพาะกรณีเชื่อมเซิร์ฟเวอร์เครือไม่สำเร็จ
test('S89 กดเชื่อมต่อสาขากับเซิร์ฟเวอร์เครือ DriveGo: ไม่กรอก URL ถูกเตือน และเชื่อมไม่ได้ยังอยู่โหมดเดโมในเครื่อง', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await golden.step('เมนู P1 คิวจองจาก BOOK');

  const connect = page.getByRole('button', { name: '🔌 เชื่อมต่อสาขา' });
  await connect.click();
  await golden.step('กดเชื่อมต่อสาขาโดยยังไม่กรอก URL');

  await page.getByPlaceholder('URL เซิร์ฟเวอร์ เช่น https://drivegobiz.com').fill('https://drivegobiz.com/');
  await page.getByPlaceholder('ผู้ใช้สาขา (เช่น rangsit)').fill('rangsit');
  await page.getByPlaceholder('รหัสผ่าน').filter({ visible: true }).fill('1234');
  await golden.step('กรอก URL ผู้ใช้สาขา และรหัสผ่าน');

  const before = await app.state();
  await connect.click();
  await expect(page.getByText('✗ Failed to fetch', { exact: true })).toBeVisible();
  await golden.step('หลังกดเชื่อมต่อ (เซิร์ฟเวอร์ติดต่อไม่ได้)');
  await golden.stateChange('connect-failed', before);
  await golden.screen('connect-failed');
});
