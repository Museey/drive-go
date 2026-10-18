import { test, expect } from '../support/test';
import { waitForLegacyBoot } from '../support/browser.mjs';

// Replaces S02 in the new system (tests/intentional-changes.json, decision A1):
// the test copy let anyone in as the owner without a password, with a button
// on the sign-in screen, or simply by opening the file without ?login=account.
test('S104 ระบบใหม่: เข้าเป็นเจ้าของร้านโดยไม่กรอกรหัสไม่ได้ ทั้งจากปุ่มบนหน้าเข้าระบบและการเปิดลิงก์ของร้านตรง ๆ', async ({ app, page }) => {
  await app.open();
  await expect(page.getByRole('button', { name: /โดยไม่กรอกรหัส/ })).toHaveCount(0);

  const shopLink = page.url().split('?')[0];
  await page.goto(shopLink);
  await waitForLegacyBoot(page);
  await app.settle();
  await expect(page.getByPlaceholder('กรอกรหัสผ่าน')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.classList.contains('pkg-open'))).toBe(false);
  await expect(page.getByLabel('ทดลองสลับบัญชี')).toBeHidden();
  const s = await app.state();
  expect(s.DGB.session).toEqual({ who: '' });
  expect(s.DB.receipts).toEqual([]);
});
