import { test, expect } from '../support/test';
import { LEGACY_URL } from '../support/config.mjs';

// The very first open of the program in a browser that never had it (no starting data written in first, unlike every
// other scenario): the address without a package shows the page that asks which program, and the program creates its
// local database then (the only time its "upgradeneeded" handler runs, docs/BEHAVIORS.md). Choosing Biz opens Biz's
// own sign-in page, which after preparing opens the program by itself as the owner, without a password. (The
// sample data is still being written in the background for a while after that, so no record counts are taken.)
// The new system has no package-choosing page (S260, owner's decision of 2026-10-30) and no local database.
test('S309 เปิดโปรแกรมครั้งแรกบนเบราว์เซอร์ใหม่: หน้าเลือกโปรแกรม เลือก Biz แล้วโปรแกรมเปิดเข้าในนามเจ้าของร้านเองโดยไม่ถามรหัสผ่าน', async ({ app, page, golden }) => {
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
  // Biz's sign-in page shows "กำลังเตรียมโปรแกรม…" for a moment (how long depends on the machine, so no step is
  // recorded there); on a browser that never had the program it then opens by itself as the owner, no password asked.
  await expect(page.getByRole('button', { name: /00 Mr\.DriveGo/ })).toBeVisible({ timeout: 120_000 });
  await app.settle();
  await golden.step('เลือก Biz โปรแกรมเปิดเข้าหน้าแรกในนามเจ้าของร้านเอง');
});
