import { test, expect } from '../support/test';
import { LEGACY_URL } from '../support/config.mjs';

// The very first open of the program in a browser that never had it (no starting data written in first, unlike every
// other scenario): the address without a package shows the page that asks which program, and the program creates its
// local database then (the only time its "upgradeneeded" handler runs, docs/BEHAVIORS.md). Choosing Biz opens Biz's
// own sign-in; the owner signs in and gets the "พร้อมทดลอง" data the fixtures were made from.
// The new system has no package-choosing page (S260, owner's decision of 2026-10-30) and no local database.
test('S309 เปิดโปรแกรมครั้งแรกบนเบราว์เซอร์ใหม่: หน้าเลือกโปรแกรม เลือก Biz แล้วเจ้าของร้านเข้าสู่ระบบ ได้ข้อมูลพร้อมทดลอง', async ({ app, page, golden }) => {
  test.slow(); // the package-choosing page builds its own sample data on first open
  await page.goto(LEGACY_URL, { waitUntil: 'commit' });
  const chooseBiz = page.getByRole('button', { name: 'เข้าสู่ระบบ Biz' });
  await expect(chooseBiz).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ ProX' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ Franchise' })).toBeVisible();
  await app.settle();
  await golden.step('เปิดที่อยู่โปรแกรมครั้งแรก เห็นหน้าเลือกโปรแกรม');
  await golden.screen('choose-program');

  await chooseBiz.click();
  await expect(page.getByText('เข้าสู่ DriveGoBiz', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true })).toBeEnabled({ timeout: 90_000 });
  await golden.step('เลือก Biz เห็นหน้าเข้าสู่ระบบของ DriveGoBiz');

  await app.login('dg1688', '123456');
  await expect(page.getByRole('button', { name: /00 Mr\.DriveGo/ })).toBeVisible();
  await golden.step('เจ้าของร้านเข้าสู่ระบบครั้งแรก');
  await golden.counts('first-sign-in');
});
