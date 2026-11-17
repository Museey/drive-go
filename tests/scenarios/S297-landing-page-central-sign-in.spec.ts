import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (the owner's decisions of 2026-11-17, docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง"): the system's own
// address (/) is DriveGo's landing page, with a sign-in button and LINE; /login signs in with the shop code, user and
// password on one page, then opens that shop as that person, through the shop page's own sign-in. A wrong password gets
// the shop's own message; a user or a shop that does not exist gets one message that does not say which part was wrong.
// The device keeps the shop code for next time. A shop's own address works as before.
const signIn = async (page: Page, code: string, user: string, pass: string) => {
  await page.getByLabel('รหัสร้าน').fill(code);
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill(user);
  await page.getByLabel('รหัสผ่าน').fill(pass);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
};

test('S297 ระบบใหม่: หน้าแรกของเว็บมีปุ่มเข้าสู่ระบบ หน้าเข้าระบบกลางกรอกรหัสร้าน ชื่อผู้ใช้ รหัสผ่าน แล้วเข้าร้านของตัวเองในนามเจ้าของร้าน รหัสผิดถูกปฏิเสธ และเครื่องจำรหัสร้าน', async ({ app, page }) => {
  // The test's own shop and the system's address.
  await app.open();
  const at = new URL(page.url()), code = at.pathname.split('/')[1], origin = at.origin;

  // The landing page.
  await page.goto(`${origin}/`);
  await expect(page).toHaveTitle('DriveGo · ระบบบริหารงานอู่ซ่อมรถ');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('งานซ่อม สต๊อก เงิน และบัญชีของอู่คุณ อยู่ในที่เดียว');
  await expect(page.getByRole('link', { name: 'สอบถามทาง LINE' })).toHaveAttribute('href', 'https://lin.ee/tV7nV8x');
  await expect(page.getByRole('link', { name: 'เพิ่มเพื่อนทาง LINE' })).toHaveAttribute('href', 'https://lin.ee/tV7nV8x');
  await page.getByRole('link', { name: 'เข้าสู่ระบบ' }).first().click();
  await expect(page).toHaveURL(`${origin}/login`);
  await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible();
  await expect(page.getByLabel('รหัสร้าน')).toHaveValue('');

  // Refused: an empty form, a wrong password, a shop that does not exist; the page stays.
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page.getByRole('alert')).toHaveText('กรุณากรอกรหัสร้าน ชื่อผู้ใช้ และรหัสผ่าน');
  await signIn(page, code, 'dg1688', 'not-the-password');
  await expect(page.getByRole('alert')).toHaveText('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');   // the shop's own message, as at its address
  await signIn(page, code, 'nobody', '123456');
  await expect(page.getByRole('alert')).toHaveText('รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
  await signIn(page, 'no-such-shop', 'dg1688', '123456');
  await expect(page.getByRole('alert')).toHaveText('รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
  await expect(page).toHaveURL(`${origin}/login`);

  // Right: the shop opens, signed in as its owner; what was handed over is gone.
  await signIn(page, code, 'dg1688', '123456');
  await page.waitForURL(u => u.pathname === `/${code}/`);
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
  await expect(page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^00 Mr\.DriveGo/ })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('dg_signin'))).toBeNull();

  // Signed out, the sign-in page has the shop code already; signing in again opens the shop.
  // (a Biz shop signs out at once, S101)
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.settle();
  await page.goto(`${origin}/login`);
  await expect(page.getByLabel('รหัสร้าน')).toHaveValue(code);
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill('dg1688');
  await page.getByLabel('รหัสผ่าน').fill('123456');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForURL(u => u.pathname === `/${code}/`);
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
});
