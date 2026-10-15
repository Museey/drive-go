import { test, expect } from '../support/test';

test('S06 เจ้าของร้านกดปุ่มเดโม "จำลองครบ 15 วัน" ระบบบอกว่าจะล็อก แต่ยังใช้งานและเข้าระบบใหม่ได้ตามปกติ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(page.getByText('ทดลองใช้ เหลือ 15 วัน', { exact: true })).toBeVisible();
  await golden.step('เมนู 10 แสดงทดลองใช้เหลือ 15 วัน');

  const before = await app.state();
  await page.getByRole('button', { name: 'เดโม: จำลองครบ 15 วัน' }).click();
  await expect(page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' })).toBeVisible(); // back on the home page
  await golden.step('กดจำลองครบ 15 วัน');
  await golden.stateChange('simulate-expiry', before);
  await golden.screen('after-simulate-expiry');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(page.getByText('หมดอายุทดลองใช้', { exact: true })).toBeVisible();
  await golden.step('เมนู 10 แสดงหมดอายุทดลองใช้');
  await golden.screen('trial-expired-tag');

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('dg1688', '123456');
  await golden.step('ออกจากระบบแล้วเข้าใหม่ ยังเข้าใช้งานได้ ไม่มีหน้าล็อก');
});
