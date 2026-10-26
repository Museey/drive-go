import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';

// New behaviour (task 3.15, decisions 15.3 and 15.7): a franchise chain has one licence; it ended on 01/10/2569.
// HQ and the branch head of B001 both sign in and see the legacy expiry line (the branch head the home banner too;
// HQ's own data set is opened for the first time, which a read-only chain still allows), open their menus, and are
// refused a change.
test.use({ dataset: 'franchise-trial', licence: { kind: 'paid', start: '2025-10-01', end: '2026-10-01' } });

const EXPIRED = 'บันทึกไม่สำเร็จ — โปรแกรมหมดอายุการใช้งานแล้ว ยังเปิดดู พิมพ์ และส่งออกข้อมูลได้ แต่สร้างหรือแก้ไขข้อมูลไม่ได้จนกว่าจะต่ออายุ (โทร. 082-1087000) กดตกลงเพื่อโหลดข้อมูลล่าสุด';

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}
async function settingsRefused(page: Page) {
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  await page.getByLabel('เว็บไซต์ / เพจ (ถ้ามี)', { exact: true }).filter({ visible: true }).fill('facebook.com/drivegoservice');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await expect(page.getByText(EXPIRED, { exact: true })).toBeVisible();
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await reloaded;
}

test('S235 ระบบใหม่: เครือแฟรนไชส์หมดอายุ สำนักงานใหญ่และหัวหน้าสาขาเข้าระบบและดูได้ แต่บันทึกไม่ได้', async ({ app, page }) => {
  test.slow();
  const line = page.getByText(/^⚠ ?Expired Date/).filter({ visible: true });
  const banner = page.getByText('⚠ โปรแกรมหมดอายุการใช้งานแล้วเมื่อวันที่ 01/10/2569', { exact: true });
  await app.loginAsOwner();
  await expect(line).toHaveText('⚠ Expired Date 01/10/2569 · หมดอายุการใช้งานแล้ว 12 วัน');
  await app.settle();
  expect(await page.evaluate(() => (window as any).storage.problems.slice())).toEqual([]);
  await settingsRefused(page);
  await expect(line).toHaveText('⚠ Expired Date 01/10/2569 · หมดอายุการใช้งานแล้ว 12 วัน');

  await signOut(page);
  await app.login('b001', '1234');
  await expect(line).toHaveText('⚠ Expired Date 01/10/2569 · หมดอายุการใช้งานแล้ว 12 วัน');
  await expect(banner).toBeVisible();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await app.settle();
  expect(await page.evaluate(() => (window as any).storage.problems.slice())).toEqual([]);
  const before = await app.serverDB().catch(() => null);
  await settingsRefused(page);
  await expect(line).toHaveText('⚠ Expired Date 01/10/2569 · หมดอายุการใช้งานแล้ว 12 วัน');
  if (before) expect((await app.serverDB()).shop).toEqual(before.shop);
});
