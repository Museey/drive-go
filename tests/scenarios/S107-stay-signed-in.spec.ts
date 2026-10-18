import { test, expect } from '../support/test';

// New behaviour (decision Q2): a browser that signed in stays signed in until
// the person signs out (30 days). The test copy signed everyone out whenever
// the page was opened again.
test('S107 ระบบใหม่: เข้าระบบแล้วเปิดหน้าใหม่ยังอยู่ในระบบ ออกจากระบบแล้วเปิดหน้าใหม่ต้องเข้าระบบอีกครั้ง', async ({ app, page }) => {
  await app.loginAsOwner();
  await expect(page.getByText('ยินดีต้อนรับ เจ้าของร้านทดสอบ', { exact: false }).first()).toBeAttached();

  await app.open();
  expect(await page.evaluate(() => document.documentElement.classList.contains('pkg-open'))).toBe(true);
  await expect(page.getByPlaceholder('กรอกรหัสผ่าน')).toBeHidden();
  const s = await app.state();
  expect(s.DGB.session).toEqual({ who: 'owner' });
  expect(s.DB.receipts.length).toBeGreaterThan(0);

  // A Biz shop signs out without asking (app.logout() answers Franchise's confirmation).
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.settle();
  await app.open();
  expect(await page.evaluate(() => document.documentElement.classList.contains('pkg-open'))).toBe(false);
  await expect(page.getByPlaceholder('กรอกรหัสผ่าน')).toBeVisible();
  expect((await app.state()).DB.receipts).toEqual([]);
});
