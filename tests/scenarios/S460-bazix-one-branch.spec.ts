import { test, expect } from '../support/test';

// New behaviour (the owner's decision of 2026-11-17, docs/NOTES.md "BaziX ได้สาขาเดียว"): DriveGo BaziX (the Biz
// package) has one branch. Menu 11.4 still edits it, but saving a new branch only tells that BaziX has one branch;
// the server refuses a second branch whatever sends it (here a save made round the screen), and the screen says why.
// ProX and Franchise are not limited. Replaces, on the new system, the Biz scenarios that add a branch (their flows
// run on ProX shops instead: tests/intentional-changes.json).
const ONE = 'DriveGo BaziX ใช้ได้ 1 สาขา — ถ้าต้องการหลายสาขา ติดต่อทีมงานเพื่อเปลี่ยนเป็น DriveGo ProX';

test('S460 ระบบใหม่: ร้าน DriveGo BaziX มีได้สาขาเดียว เมนู 11.4 เพิ่มสาขาใหม่ไม่ได้และบอกเหตุผล แก้สาขาเดิมได้ server ปฏิเสธสาขาที่ 2 ที่ส่งมาทางอื่น', async ({ app, page }) => {
  await app.loginAsOwner();
  const branches = async () => ((await app.serverDB()) as { branches: { code: string; name: string; tel?: string }[] }).branches;
  expect((await branches()).map(b => b.code)).toEqual(['MA']);

  // Menu 11.4: a new branch is not added, the message says why.
  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.locator('#toast')).toHaveText(ONE);
  await app.settle();
  expect((await branches()).map(b => b.code)).toEqual(['MA']);
  await expect(page.locator('#pkgSsetBranch tbody tr')).toHaveCount(1);

  // The one branch is still edited as before.
  await page.getByRole('link', { name: 'สาขาหลัก', exact: true }).click();
  await page.getByLabel('โทรศัพท์').filter({ visible: true }).fill('02-111-2233');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  expect(await branches()).toEqual([expect.objectContaining({ code: 'MA', tel: '02-111-2233' })]);

  // A second branch sent round the screen: the server refuses it, the screen says why and reads the data again.
  // (DB and save() are the app's own globals: a string runs in the page's global scope. A refused save never ends, the
  // page reloads instead: not waited for.)
  await page.evaluate(`DB.branches.push({ id: 'b-round', code: 'RS', name: 'คลังรังสิต', main: false, active: true, bill: true,
    keeper: '', tel: '', addr: '' }); void save(); 0`);
  await expect(page.getByText('บันทึกไม่สำเร็จ — DriveGo BaziX ใช้ได้ 1 สาขา ถ้าต้องการหลายสาขา ติดต่อทีมงานเพื่อเปลี่ยนเป็น DriveGo ProX กดตกลงเพื่อโหลดข้อมูลล่าสุด')).toBeVisible();
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click()]);
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
  expect((await branches()).map(b => b.code)).toEqual(['MA']);
});
