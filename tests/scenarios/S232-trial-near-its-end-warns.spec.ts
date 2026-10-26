import { test, expect } from '../support/test';

// New behaviour (task 3.15, decisions 15.2 and 15.4): a shop staff opened for a 60-day trial on 30/08/2569 has
// 16 days left on 13/10/2569. The legacy warnings show from 30 days before, now from the server's licence: the
// top bar line with its warning sign, the home banner, menu 10's dates and days left, and the owner panel's tag
// counting the trial to its last day. Until then the shop works as usual: saving the settings is kept.
test.use({ licence: { kind: 'trial', start: '2026-08-30', end: '2026-10-29' } });

test('S232 ระบบใหม่: ร้านทดลองใช้ 60 วันเหลือ 16 วัน ขึ้นแถบเตือนเหมือนระบบเดิม ป้ายบอกวันทดลองที่เหลือ และยังบันทึกได้ตามปกติ', async ({ app, page }) => {
  await app.loginAsOwner();
  await expect(page.getByText(/^⚠?Expired Date/).filter({ visible: true })).toHaveText('⚠Expired Date 29/10/2569 · เหลืออายุการใช้งาน 16 วัน');
  await expect(page.getByText('⚠ โปรแกรมจะหมดอายุในอีก 16 วัน (Expired Date 29/10/2569)', { exact: true })).toBeVisible();
  await expect(page.getByText(/^กรุณาต่ออายุการใช้งานรายปีก่อนวันหมดอายุ ติดต่อ Drivebiz Mecalyze Solution Co\.,Ltd\..* โทร\. 082-1087000$/)).toBeVisible();

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(page.getByText('ทดลองใช้ เหลือ 16 วัน', { exact: true })).toBeVisible();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await expect(field('วันที่เริ่มใช้ระบบ')).toHaveValue('2026-08-30');
  await expect(field('วันที่สิ้นสุดการใช้งาน (Expired Date)')).toHaveValue('2026-10-29');
  await expect(field('อายุการใช้งานคงเหลือ')).toHaveValue('16 วัน');

  await field('เว็บไซต์ / เพจ (ถ้ามี)').fill('facebook.com/drivegoservice');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await app.settle();
  const shop = (await app.serverDB()).shop;
  expect([shop.web, shop.licStart, shop.licEnd]).toEqual(['facebook.com/drivegoservice', '2026-08-30', '2026-10-29']);
});
