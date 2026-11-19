import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 1: the landing page and the central sign-in page, a shop's own sign-in page, the home page, the parts of the
// screen. Numbers on a picture are the numbers of the steps they belong to.
test('01 เริ่มต้นใช้งาน', async ({ app, page }) => {
  await app.open();
  // The system's own pages (S297).
  const at = new URL(page.url());
  await page.goto(`${at.origin}/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ข้อมูลเพื่อการจัดการที่ดี นำสู่ความสำเร็จ');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);   // the page's own entrance animation
  await shot(page, '01-landing', { mark: [[page.getByRole('link', { name: 'เข้าระบบ', exact: true }).first(), '1']], scroll: false });
  await page.goto(`${at.origin}/login`);
  await page.evaluate(() => document.fonts.ready);
  // One card per package: the reader picks their shop's (S297, S459).
  const heading = page.getByRole('heading', { level: 1 }), plans = page.locator('#cards');
  await page.waitForTimeout(1500);   // the page's own entrance animation
  const pick = page.getByRole('button', { name: 'เข้าสู่ระบบ BaziX', exact: true });
  await shot(page, '01-plans', { scroll: false, mark: [[pick, '2']], area: [heading, plans], pad: 24 });
  await pick.click();
  // Example values in the picture: the shop code as the sample shop shows it in menu 10 (DG-1688), and a password of a
  // proper length (the sample shop's own is shorter than what a new password must be).
  await page.getByLabel('รหัสร้าน').fill('dg-1688');
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill('dg1688');
  await page.getByLabel('รหัสผ่าน').fill('Somchai#2569');
  await shot(page, '01-signin', { scroll: false, area: [heading, plans], pad: 24, mark: [
    [page.getByLabel('รหัสร้าน'), '3'], [page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร'), '4'], [page.getByLabel('รหัสผ่าน'), '4'],
    [page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }), '4']] });

  // A shop's own sign-in page.
  await app.open();
  const studio = page.locator('#drivego-studio');
  await studio.getByPlaceholder(/ชื่อผู้ใช้/).fill('dg1688');
  await studio.getByPlaceholder('กรอกรหัสผ่าน').fill('Somchai#2569');
  await shot(page, '01-login', { scroll: false, mark: [[studio.getByPlaceholder(/ชื่อผู้ใช้/), ''], [studio.getByPlaceholder('กรอกรหัสผ่าน'), ''], [studio.locator('[type="submit"]:visible'), '']] });
  await studio.getByPlaceholder('กรอกรหัสผ่าน').fill('123456');
  await studio.locator('[type="submit"]:visible').click();
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
  await shot(page, '01-home');
  // The left menu as a whole: the box around its items 00–11.
  const items = [page.getByRole('button', { name: /^00 Mr\.DriveGo/ }), page.getByRole('button', { name: /^11 ตั้งค่าเพิ่มเติม/ })];
  const [top, bottom] = await Promise.all(items.map(l => l.boundingBox()));
  await page.evaluate(([t, b]) => {
    const d = document.createElement('div');
    d.id = '__manual_menu';
    d.style.cssText = `position:fixed;left:${t!.x}px;top:${t!.y}px;width:${t!.width}px;height:${b!.y + b!.height - t!.y}px;pointer-events:none`;
    document.body.append(d);
  }, [top, bottom]);
  await shot(page, '01-home-parts', { scroll: false, mark: [
    [page.locator('#__manual_menu'), '1'],
    [page.getByRole('combobox', { name: 'สาขาที่กำลังทำงาน' }), '2'],
    [page.getByText(/Expired Date/).filter({ visible: true }).first(), '3'],
    [page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }), '4'],
  ] });
  await page.evaluate(() => document.getElementById('__manual_menu')?.remove());
});
