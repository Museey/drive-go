import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 1: signing in, the home page, the menus.
test('01 เริ่มต้นใช้งาน', async ({ app, page }) => {
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
