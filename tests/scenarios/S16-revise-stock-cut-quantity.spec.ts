import { test, expect } from '../support/test';

test('S16 ทำฉบับแก้ไขใบตัดสต็อกที่รอชำระ เพิ่มจำนวนสินค้า 1 รายการ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  // MA-SA261000003 ปรีชา ทองสุข 9,913.55 บาท: AC-204 คอมเพรสเซอร์แอร์ 1 × 9,070 + AC-215 กรองแอร์ 1 × 195
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบตัดสต็อก MA-SA261000003');

  await page.getByRole('button', { name: 'ทำฉบับแก้ไข' }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'บันทึกฉบับแก้ไข' }).filter({ visible: true }).first()).toBeVisible();
  await golden.step('เริ่มทำฉบับแก้ไข');

  // แถว AC-215: ช่องตัวเลขช่องแรกคือประกัน (เดือน) ช่องที่ 2 คือจำนวน
  const row = page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ has: page.getByRole('spinbutton') });
  await row.getByRole('spinbutton').nth(1).fill('2');
  await row.getByRole('spinbutton').nth(1).press('Tab');
  await expect(page.getByText('10,122.20').filter({ visible: true }).first()).toBeVisible();
  await golden.step('แก้จำนวน AC-215 กรองแอร์ เป็น 2');
  await golden.screen('revision-form');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกฉบับแก้ไข' }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ทำฉบับแก้ไข' }).filter({ visible: true })).toBeVisible();
  await golden.step('หลังบันทึกฉบับแก้ไข MA-SA261000003-R1');
  await golden.stateChange('revise-stock-cut', before);

  await page.getByRole('button', { name: 'ปิดหน้าต่าง' }).filter({ visible: true }).click();
  const revised = page.getByRole('row').filter({ hasText: 'MA-SA261000003-R1' }).filter({ visible: true });
  await expect(revised).toContainText('10,122.20');
  await revised.scrollIntoViewIfNeeded();
  await golden.step('รายการรอชำระแสดงฉบับแก้ไขแทนฉบับเดิม');
  await golden.screen('unpaid-list-after-revision');
});
