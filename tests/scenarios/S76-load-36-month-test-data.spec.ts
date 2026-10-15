import { test, expect } from '../support/test';

test('S76 เจ้าของร้านล้างข้อมูลทั้งหมด แล้วกดโหลดข้อมูลทดสอบ 36 เดือน (ไม่มีถามยืนยันก่อนแทนที่ข้อมูล)', async ({ app, page, golden }) => {
  test.slow(); // about 15 MB of data is built, saved and read back
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // Counts are measured from an emptied shop: the order of the collections in the data the app
  // opened with depends on start-up timing, and the record-count referee keeps that order.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await golden.step('เมนู 10 ล้างข้อมูลทั้งหมด');

  await page.getByRole('button', { name: 'โหลดข้อมูลทดสอบ 36 เดือน' }).click();
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible(); // back on the home page
  await golden.step('กดโหลดข้อมูลทดสอบ 36 เดือน');
  await golden.counts('after-36-months');
  await golden.screen('home-36-months');
});
