import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';
import { closeTestShop } from '../support/new-shop.mjs';

// New behaviour (task 3.15, decisions 15.1 and 15.3): the owner gives the cashier (EMP008) a sign-in while the shop
// still runs. Then DriveGo's staff close the shop (tools/shop-admin.mjs close, last day 12/10/2569): the owner's
// page, still open, is refused its next save at once and reloads expired. Every account still signs in and views:
// the cashier opens their menus. The owner may still suspend an employee's account (and the server refuses the
// cashier's sign-in), but not turn it on again.
const EXPIRED = 'บันทึกไม่สำเร็จ — โปรแกรมหมดอายุการใช้งานแล้ว ยังเปิดดู พิมพ์ และส่งออกข้อมูลได้ แต่สร้างหรือแก้ไขข้อมูลไม่ได้จนกว่าจะต่ออายุ (โทร. 082-1087000) กดตกลงเพื่อโหลดข้อมูลล่าสุด';
const line = (page: Page) => page.getByText(/^⚠? ?Expired Date/).filter({ visible: true });

async function refusedThenReload(page: Page) {
  await expect(page.getByText(EXPIRED, { exact: true })).toBeVisible();
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await reloaded;
}

test('S234 ระบบใหม่: ทีมงานปิดร้าน หน้าที่เปิดอยู่บันทึกไม่ได้ทันที พนักงานยังเข้าระบบและดูได้ เจ้าของระงับบัญชีพนักงานได้แต่เปิดใช้คืนไม่ได้', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const cashier = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashier.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('88888888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashier).toContainText('ใช้งานได้');
  await app.settle();

  // Staff close the shop while the page is open: its next save is refused.
  await closeTestShop(page, '2026-10-12');
  await page.getByLabel('เว็บไซต์ / เพจ (ถ้ามี)', { exact: true }).filter({ visible: true }).fill('facebook.com/drivegoservice');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await refusedThenReload(page);
  await expect(line(page)).toHaveText('⚠ Expired Date 12/10/2569 · หมดอายุการใช้งานแล้ว 1 วัน');
  expect((await app.serverDB()).shop.web).not.toBe('facebook.com/drivegoservice');

  // The cashier signs in and views.
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-333-4455', '88888888');
  await expect(line(page)).toHaveText('⚠ Expired Date 12/10/2569 · หมดอายุการใช้งานแล้ว 1 วัน');
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: /4\.3 ใบเสร็จรับเงิน/ }).click();
  await app.settle();
  expect(await page.evaluate(() => (window as any).storage.problems.slice())).toEqual([]);

  // The owner suspends the cashier's account: allowed, and the server refuses the cashier's sign-in.
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await cashier.getByRole('button', { name: '⏸ ระงับ' }).click();
  await expect(cashier.getByRole('button', { name: '▶ เปิดใช้' })).toBeVisible();
  await app.settle();
  expect((await app.serverDB()).emp.find((e: any) => e.code === 'EMP008').dgbActive).toBe(false);
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ชื่อผู้ใช้ อีเมล หรือเบอร์โทร').fill('092-333-4455');
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill('88888888');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByText('บัญชีนี้ถูกระงับการใช้งาน — ติดต่อเจ้าของร้าน').filter({ visible: true })).toBeVisible();

  // Turning it on again is a change like any other.
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await cashier.getByRole('button', { name: '▶ เปิดใช้' }).click();
  await refusedThenReload(page);
  expect((await app.serverDB()).emp.find((e: any) => e.code === 'EMP008').dgbActive).toBe(false);
});
