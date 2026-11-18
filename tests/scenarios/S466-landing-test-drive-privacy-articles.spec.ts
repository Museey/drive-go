import { test, expect } from '../support/test';

// New behaviour (owner 2026-11-18, docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง"): the landing page's own pages from the
// team's design. Test Drive shows the system's screens step by step, and what the system does not do yet carries the
// "เร็ว ๆ นี้" tag (DriveGo BOOK, DriveGo Admin and the ProX online steps), as on the landing page. The privacy policy is
// there in full, and the articles for garage owners, with filters. Thai and English (S297: the landing page itself).
test('S466 ระบบใหม่: จากหน้าแรกเปิด Test Drive ดูหน้าจอทีละขั้น ข้อที่ระบบยังไม่มีติดป้ายเร็ว ๆ นี้ เปิดนโยบายความเป็นส่วนตัวฉบับเต็ม และบทความน่ารู้', async ({ app, page }) => {
  await app.open();
  const origin = new URL(page.url()).origin;
  await page.goto(`${origin}/`);
  const main = page.getByRole('navigation', { name: 'Main' });

  // Test Drive, from the landing page's menu.
  await main.getByRole('link', { name: 'Test Drive', exact: true }).click();
  await expect(page).toHaveURL(`${origin}/testdrive`);
  await expect(page).toHaveTitle('DriveGo X Test Drive');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ลองขับระบบ ทุกหน้าจอ ก่อนตัดสินใจ');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  await expect(tabs.nth(0)).toContainText('DriveGo ProX / BaziXสำหรับอู่และศูนย์บริการ · 42');
  await expect(tabs.nth(1)).toContainText('DriveGo BOOK เร็ว ๆ นี้');
  await expect(tabs.nth(2)).toContainText('DriveGo Admin เร็ว ๆ นี้');
  const h2 = page.getByRole('heading', { level: 2 });
  await expect(h2).toHaveText('ตั้งค่าองค์กร');
  await expect(page.getByText('ขั้นที่ 1 จาก 42')).toBeVisible();
  // The step's picture is there (served by the system, not by the design's site).
  const picture = page.getByRole('button', { name: 'ตั้งค่าองค์กร' }).locator('img');
  await expect.poll(() => picture.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBe(1440);
  await page.getByRole('link', { name: 'ถัดไป' }).click();
  await expect(page).toHaveURL(`${origin}/testdrive#x-home`);
  await expect(h2).toHaveText('หน้าแรก Mr.DriveGo');
  // A step the system does not do yet, from the list of steps.
  await page.getByRole('navigation', { name: 'Steps' }).getByRole('link', { name: /คิวจองจากแอป DriveGo BOOK/ }).click();
  await expect(h2).toHaveText('คิวจองจากแอป DriveGo BOOK เร็ว ๆ นี้');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(h2).toHaveText('Bookings from DriveGo BOOK Coming soon');
  await page.getByRole('button', { name: 'TH', exact: true }).click();
  await expect(h2).toHaveText('คิวจองจากแอป DriveGo BOOK เร็ว ๆ นี้');

  // The privacy policy in full, from the footer.
  await page.getByRole('contentinfo').getByRole('link', { name: 'นโยบายความเป็นส่วนตัว' }).click();
  await expect(page).toHaveURL(`${origin}/privacy`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('นโยบายความเป็นส่วนตัว');
  await expect(page.getByText('ปรับปรุงล่าสุด 17 พฤศจิกายน 2569')).toBeVisible();
  await expect(h2).toHaveCount(10);
  await expect(h2.first()).toContainText('ขอบเขตของนโยบาย');
  await expect(h2.last()).toContainText('การปรับปรุงนโยบาย');
  await expect(page.locator('#s9').getByRole('link', { name: 'sales@drivegox.com' })).toHaveAttribute('href', 'mailto:sales@drivegox.com');

  // The articles, from the menu: all of them, one category, one article and back.
  await main.getByRole('link', { name: 'บทความน่ารู้', exact: true }).click();
  await expect(page).toHaveURL(`${origin}/articles`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('เรื่องที่เจ้าของอู่ควรรู้');
  await expect(h2).toHaveCount(9);
  await page.getByRole('button', { name: 'ภาษี', exact: true }).click();
  await expect(h2).toHaveText(['VAT สำหรับอู่ซ่อมรถ จดเมื่อไร ยื่นอะไร คุ้มหรือไม่', 'ภาษีหัก ณ ที่จ่าย อู่เกี่ยวข้องอย่างไร']);
  await page.getByRole('link', { name: /VAT สำหรับอู่ซ่อมรถ/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('VAT สำหรับอู่ซ่อมรถ จดเมื่อไร ยื่นอะไร คุ้มหรือไม่');
  await page.getByRole('link', { name: 'บทความทั้งหมด' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('เรื่องที่เจ้าของอู่ควรรู้');

  // Home again from the logo; the sub-pages' sign-in goes to the central sign-in page.
  await page.getByRole('banner').getByRole('link', { name: 'DriveGo X' }).click();
  await expect(page).toHaveURL(`${origin}/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ข้อมูลเพื่อการจัดการที่ดี นำสู่ความสำเร็จ');
  // Back to the test's shop (the test's own checks read the shop's page).
  await app.open();
});
