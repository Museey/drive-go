import { test, expect } from '../support/test';
import { renewTestShop } from '../support/new-shop.mjs';

// New behaviour (task 3.15, decisions 15.1 and 15.2): the shop's licence ended on 01/10/2569; its save is refused.
// It pays on 13/10/2569 and DriveGo's staff renew it for a year (tools/shop-admin.mjs renew --years 1): after a
// lapse the year counts from the day it paid, so the new last day is 13/10/2570. The page, reloaded, shows the new
// date without the banner, the owner panel's tag reads "ใช้งานเต็ม ถึง 13/10/2570", and saving works again.
test.use({ licence: { kind: 'paid', start: '2025-10-01', end: '2026-10-01' } });

const EXPIRED = 'บันทึกไม่สำเร็จ — โปรแกรมหมดอายุการใช้งานแล้ว ยังเปิดดู พิมพ์ และส่งออกข้อมูลได้ แต่สร้างหรือแก้ไขข้อมูลไม่ได้จนกว่าจะต่ออายุ (โทร. 082-1087000) กดตกลงเพื่อโหลดข้อมูลล่าสุด';

test('S236 ระบบใหม่: ร้านหมดอายุบันทึกไม่ได้ ทีมงานต่ออายุ 1 ปีนับจากวันที่จ่าย แล้วร้านบันทึกได้อีก', async ({ app, page }) => {
  test.slow();
  const line = page.getByText(/^⚠? ?Expired Date/).filter({ visible: true });
  const web = page.getByLabel('เว็บไซต์ / เพจ (ถ้ามี)', { exact: true }).filter({ visible: true });
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await web.fill('facebook.com/drivegoservice');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await expect(page.getByText(EXPIRED, { exact: true })).toBeVisible();

  const l = await renewTestShop(page, 1, '2026-10-13');
  expect([l.kind, l.end]).toEqual(['paid', '2027-10-13']);
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await reloaded;
  await expect(line).toHaveText('Expired Date 13/10/2570 · เหลืออายุการใช้งาน 365 วัน');
  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  await expect(page.getByText(/^⚠ โปรแกรม/)).toHaveCount(0);

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(page.getByText('ใช้งานเต็ม ถึง 13/10/2570', { exact: true })).toBeVisible();
  await expect(page.getByLabel('วันที่สิ้นสุดการใช้งาน (Expired Date)', { exact: true }).filter({ visible: true })).toHaveValue('2027-10-13');
  await web.fill('facebook.com/drivegoservice');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await app.settle();
  await expect(page.getByText(EXPIRED)).toHaveCount(0);
  const shop = (await app.serverDB()).shop;
  expect([shop.web, shop.licStart, shop.licEnd]).toEqual(['facebook.com/drivegoservice', '2025-10-01', '2027-10-13']);
});
