import { test, expect } from '../support/test';

test('S76 เจ้าของร้านกดโหลดข้อมูลทดสอบ 36 เดือน ข้อมูลเดิมถูกแทนที่ทันทีโดยไม่ถามยืนยัน', async ({ app, page, golden }) => {
  test.slow(); // about 15 MB of data is built, saved and read back
  await app.loginAsOwner();
  await golden.step('หน้าแรก');
  await golden.counts('before');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await golden.step('เมนู 10 ตั้งค่าองค์กร');
  await page.getByRole('button', { name: 'โหลดข้อมูลทดสอบ 36 เดือน' }).click();
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible(); // back on the home page
  await golden.step('กดโหลดข้อมูลทดสอบ 36 เดือน');
  await golden.counts('after-36-months');
  await golden.screen('home-36-months');
});
