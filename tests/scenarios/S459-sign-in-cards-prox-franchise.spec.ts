import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (owner 2026-11-17, docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง"): the central sign-in page /login has one
// card per package. A ProX shop signs in on the ProX card and a Franchise network's head office on the Franchise card;
// each opens its own shop, as that person (S297: Biz, a wrong password, the wrong card). On another package's card the
// same right sign-in is refused, naming the card to use.
// The page follows the team's design since 2026-11-19: the cards are "DriveGo BaziX", "DriveGo ProX", "DriveGo-Franchise",
// each with its button "เข้าสู่ระบบ BaziX" ….
const CARD: Record<string, string> = { BaziX: 'DriveGo BaziX', ProX: 'DriveGo ProX', Franchise: 'DriveGo-Franchise' };
const signIn = async (page: Page, card: string, code: string, user: string, pass: string) => {
  await page.getByRole('button', { name: `เข้าสู่ระบบ ${card}`, exact: true }).click();
  const box = page.getByRole('region', { name: CARD[card], exact: true });
  await box.getByLabel('รหัสร้าน').fill(code);
  await box.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill(user);
  await box.getByLabel('รหัสผ่าน').fill(pass);
  await box.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
};
const opened = async (page: Page, code: string) => {
  await page.waitForURL(u => u.pathname === `/${code}/`);
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  expect(await page.evaluate(() => sessionStorage.getItem('dg_signin'))).toBeNull();
};

test.describe('ProX', () => {
  test.use({ dataset: 'prox-trial' });
  test('S459 ระบบใหม่: ร้าน ProX เข้าสู่ระบบที่การ์ด DriveGo ProX ของหน้าเข้าระบบกลาง ได้ร้านของตัวเอง ที่การ์ด BaziX ถูกปฏิเสธและบอกการ์ดที่ถูก', async ({ app, page }) => {
    await app.open();
    const at = new URL(page.url()), code = at.pathname.split('/')[1];
    await page.goto(`${at.origin}/login`);
    await signIn(page, 'BaziX', code, 'dg1688', '123456');
    await expect(page.getByRole('alert')).toHaveText('ร้านนี้ใช้แพ็กเกจ DriveGo ProX — กรุณาเข้าสู่ระบบที่การ์ด DriveGo ProX');
    await expect(page).toHaveURL(`${at.origin}/login`);
    await signIn(page, 'ProX', code, 'dg1688', '123456');
    await opened(page, code);
    await app.settle();
    await expect(page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  });
});

test.describe('Franchise', () => {
  test.use({ dataset: 'franchise-trial' });
  test('S459 ระบบใหม่: สำนักงานใหญ่ของเครือ Franchise เข้าสู่ระบบที่การ์ด DriveGo Franchise ได้ร้านของตัวเอง ที่การ์ด ProX ถูกปฏิเสธและบอกการ์ดที่ถูก', async ({ app, page }) => {
    await app.open();
    const at = new URL(page.url()), code = at.pathname.split('/')[1];
    await page.goto(`${at.origin}/login`);
    await signIn(page, 'ProX', code, 'hq', '1234');
    await expect(page.getByRole('alert')).toHaveText('ร้านนี้ใช้แพ็กเกจ DriveGo-Franchise — กรุณาเข้าสู่ระบบที่การ์ด DriveGo-Franchise');
    await signIn(page, 'Franchise', code, 'hq', '1234');
    await opened(page, code);
    await app.settle();
    await expect(page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  });
});
