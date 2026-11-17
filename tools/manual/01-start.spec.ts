import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 1: signing in, the home page, the menus.
test('01 เริ่มต้นใช้งาน', async ({ app, page }) => {
  await app.open();
  // The system's own pages: the landing page and the central sign-in page (S297).
  const at = new URL(page.url()), code = at.pathname.split('/')[1];
  await page.goto(`${at.origin}/`);
  await page.evaluate(() => document.fonts.ready);
  await shot(page, '01-landing', { mark: [page.getByRole('link', { name: 'เข้าสู่ระบบ' }).nth(1)], scroll: false });
  await page.goto(`${at.origin}/login`);
  await page.getByLabel('รหัสร้าน').fill(code);
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill('dg1688');
  await page.getByLabel('รหัสผ่าน').fill('123456');
  await shot(page, '01-signin', { mark: [[page.getByLabel('รหัสร้าน'), '2'], [page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร'), '3'], [page.getByLabel('รหัสผ่าน'), '3']], scroll: false });
  await app.open();
  const studio = page.locator('#drivego-studio');
  await studio.getByPlaceholder(/ชื่อผู้ใช้/).fill('dg1688');
  await studio.getByPlaceholder('กรอกรหัสผ่าน').fill('123456');
  await shot(page, '01-login', { mark: [studio.getByPlaceholder(/ชื่อผู้ใช้/), studio.getByPlaceholder('กรอกรหัสผ่าน'), studio.locator('[type="submit"]:visible')] });
  await studio.locator('[type="submit"]:visible').click();
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
  await shot(page, '01-home');
  await shot(page, '01-home-parts', { scroll: false, mark: [
    [page.getByRole('button', { name: /^00 Mr\.DriveGo/ }), '1'],
    [page.getByRole('combobox', { name: 'สาขาที่กำลังทำงาน' }), '2'],
    [page.getByText(/Expired Date/).filter({ visible: true }).first(), '3'],
    [page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }), '4'],
  ] });
});
