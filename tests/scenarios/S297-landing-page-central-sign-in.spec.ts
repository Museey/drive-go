import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (the owner's decisions of 2026-11-17, docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง"): the system's own
// address (/) is DriveGo's landing page, with a sign-in button and LINE; /login signs in with the shop code, user and
// password on one page, then opens that shop as that person, through the shop page's own sign-in. A wrong password gets
// the shop's own message; a user or a shop that does not exist gets one message that does not say which part was wrong.
// The device keeps the shop code for next time. A shop's own address works as before.
// Owner 2026-11-17 (sales): the page has one card per package (BaziX, ProX, Franchise) and the form opens in the card
// picked; right sign-in on another package's card is refused with the card to use (S459: ProX and Franchise shops).
// The landing page is the team's design (same day): Thai and English, what the system does not do yet tagged "เร็ว ๆ นี้",
// a demo request summed up for the visitor to send on LINE (nothing stored).
const signIn = async (page: Page, code: string, user: string, pass: string) => {
  await page.getByLabel('รหัสร้าน').fill(code);
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill(user);
  await page.getByLabel('รหัสผ่าน').fill(pass);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
};

test('S297 ระบบใหม่: หน้าแรกของเว็บมีปุ่มเข้าสู่ระบบ หน้าเข้าระบบกลางมีการ์ดของ 3 แพ็กเกจ เลือกการ์ด Biz แล้วกรอกรหัสร้าน ชื่อผู้ใช้ รหัสผ่าน เข้าร้านของตัวเองในนามเจ้าของร้าน รหัสผิดหรือผิดการ์ดถูกปฏิเสธ และเครื่องจำรหัสร้าน', async ({ app, page }) => {
  // The test's own shop and the system's address.
  await app.open();
  const at = new URL(page.url()), code = at.pathname.split('/')[1], origin = at.origin;

  // The landing page.
  await page.goto(`${origin}/`);
  await expect(page).toHaveTitle('DriveGo X · ระบบบริหารอู่และศูนย์บริการรถยนต์บน Cloud');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveText('ข้อมูลเพื่อการจัดการที่ดี นำสู่ความสำเร็จ');
  await expect(page.getByRole('link', { name: 'LINE Official' })).toHaveAttribute('href', 'https://lin.ee/tV7nV8x');
  // What the system does not do yet carries its tag (here the API row of the comparison table).
  await expect(page.getByRole('row', { name: /เชื่อมต่อระบบภายนอก \(API\) เร็ว ๆ นี้/ })).toBeAttached();
  // English, and back to Thai.
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(h1).toHaveText('Accurate information leads to successful management');
  await expect(page.getByRole('row', { name: /External system connection \(API\) Coming soon/ })).toBeAttached();
  await page.getByRole('button', { name: 'TH', exact: true }).click();
  await expect(h1).toHaveText('ข้อมูลเพื่อการจัดการที่ดี นำสู่ความสำเร็จ');
  // A demo request: missing details are asked for; then a summary, and the button to send it is LINE Official.
  await page.getByRole('button', { name: 'ขอนัด Demo' }).click();
  await expect(page.locator('#fErr')).toHaveText('กรอกชื่อ ชื่ออู่ และเบอร์โทรให้ครบก่อนส่ง');
  await page.getByLabel('ชื่อผู้ติดต่อ').fill('สมชาย ใจดี');
  await page.getByLabel('เบอร์โทร').fill('081-234-5678');
  await page.getByLabel('ชื่ออู่หรือศูนย์บริการ').fill('สมชายการช่าง');
  await page.getByRole('button', { name: 'ขอนัด Demo' }).click();
  await expect(page.getByText('สรุปคำขอพร้อมแล้ว')).toBeVisible();
  await expect(page.locator('#sum')).toHaveText(['ขอนัด Demo DriveGo ProX', 'ชื่อผู้ติดต่อ: สมชาย ใจดี', 'ชื่ออู่หรือศูนย์บริการ: สมชายการช่าง',
    'เบอร์โทร: 081-234-5678', 'จำนวนสาขา: 1 สาขา', 'โมดูลที่สนใจ: ทั้งระบบ'].join('\n'));
  await expect(page.getByRole('link', { name: 'คัดลอกแล้วส่งทาง LINE' })).toHaveAttribute('href', 'https://lin.ee/tV7nV8x');
  await page.getByRole('link', { name: 'เข้าระบบ', exact: true }).first().click();
  await expect(page).toHaveURL(`${origin}/login`);
  await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ', exact: true })).toBeVisible();
  await expect(page.getByText('เลือกแพ็กเกจที่ร้านของคุณใช้')).toBeVisible();
  for (const name of ['DriveGo BaziX', 'DriveGo ProX', 'DriveGo Franchise'])
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  // No form until a card is picked; picked, it opens in that card.
  await expect(page.getByLabel('รหัสร้าน')).toBeHidden();
  await page.getByRole('button', { name: 'เข้าสู่ระบบ DriveGo BaziX' }).click();
  const biz = page.getByRole('region', { name: 'DriveGo BaziX' });
  await expect(biz.getByLabel('รหัสร้าน')).toBeVisible();
  await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ DriveGo BaziX' })).toBeHidden();
  await expect(page.getByLabel('รหัสร้าน')).toHaveValue('');

  // Refused: an empty form, a wrong password, a shop that does not exist; the page stays.
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('กรุณากรอกรหัสร้าน ชื่อผู้ใช้ และรหัสผ่าน');
  await signIn(page, code, 'dg1688', 'not-the-password');
  await expect(page.getByRole('alert')).toHaveText('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');   // the shop's own message, as at its address
  await signIn(page, code, 'nobody', '123456');
  await expect(page.getByRole('alert')).toHaveText('รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
  await signIn(page, 'no-such-shop', 'dg1688', '123456');
  await expect(page.getByRole('alert')).toHaveText('รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
  await expect(page).toHaveURL(`${origin}/login`);

  // Right, but on the ProX card: refused, with the card to use; what was typed moves with the form.
  await page.getByRole('button', { name: 'เข้าสู่ระบบ DriveGo ProX' }).click();
  await expect(page.getByRole('region', { name: 'DriveGo ProX' }).getByLabel('รหัสร้าน')).toHaveValue('no-such-shop');
  await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ DriveGo BaziX' })).toBeVisible();
  await signIn(page, code, 'dg1688', '123456');
  await expect(page.getByRole('alert')).toHaveText('ร้านนี้ใช้แพ็กเกจ DriveGo BaziX — กรุณาเข้าสู่ระบบที่การ์ด DriveGo BaziX');
  await expect(page).toHaveURL(`${origin}/login`);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ DriveGo BaziX' }).click();
  await expect(page.getByRole('alert')).toBeHidden();

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
  await page.getByRole('button', { name: 'เข้าสู่ระบบ DriveGo BaziX' }).click();
  await expect(page.getByLabel('รหัสร้าน')).toHaveValue(code);
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill('dg1688');
  await page.getByLabel('รหัสผ่าน').fill('123456');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await page.waitForURL(u => u.pathname === `/${code}/`);
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
});
