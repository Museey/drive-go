import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { allPasswordCells, hiddenPasswords, hqOwnData } from '../support/hq-own-data';
import type { Page } from '@playwright/test';

test.use({ dataset: 'franchise-trial' });

// Replaces S95 in the new system (tests/intentional-changes.json, decisions
// Q3 and A3): HQ works on its own data set, so HQ's screens show the chain's
// name, its own licence line and its own badges (tests/support/hq-own-data.ts),
// and the branch register shows ******** instead of passwords. The sign-in
// screen has no demo account line (A1, A3), so its screenshot is checked by
// its content instead. Every step, data change, branch screen and the rest of
// every HQ screen are still S95's.
const S95 = 'S95-hq-suspends-branch-and-limits-menus.spec.ts';

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

// A sign-in that the app refuses: the message shows under the form and the workspace stays locked.
async function refusedLogin(page: Page, user: string, pass: string, message: string) {
  const studio = page.locator('#drivego-studio');
  await studio.getByPlaceholder(/ชื่อผู้ใช้/).fill(user);
  await studio.getByPlaceholder('กรอกรหัสผ่าน').fill(pass);
  await studio.locator('[type="submit"]:visible').click();
  await expect(studio.getByText(message, { exact: true })).toBeVisible();
}

const branchCard = (page: Page, name: string) =>
  page.locator('.permbox').filter({ hasText: name }).filter({ visible: true });

test('S117 ระบบใหม่: สำนักงานใหญ่ (ข้อมูลของ HQ เอง) ระงับสาขา ระงับบัญชีพนักงาน และปิดเมนูของสาขา แล้วตรวจว่าแต่ละบัญชีเข้าได้แค่ไหน', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S95, { app, page, testInfo });
  await app.loginAsOwner();
  await page.getByRole('button', { name: '🏬 สาขา · รหัสผู้ใช้ · สิทธิ' }).click();
  await golden.step('HQ เปิดทะเบียนสาขา');
  const before = await app.state();

  await branchCard(page, 'B002 · สาขาบางนา').getByRole('button', { name: '⏸ ระงับสาขา' }).click();
  await expect(branchCard(page, 'B002 · สาขาบางนา')).toContainText('ระงับชั่วคราว');
  await golden.step('ระงับสาขา B002');

  const b001 = branchCard(page, 'B001 · สาขาหลัก รังสิต');
  await b001.getByRole('row').filter({ hasText: 'ศักดิ์ชัย มั่นคง' }).getByRole('button', { name: '⏸ ระงับ' }).click();
  await expect(b001.getByRole('row').filter({ hasText: 'ศักดิ์ชัย มั่นคง' })).toContainText('ระงับ');
  await golden.step('ระงับบัญชีพนักงาน staff001 ของ B001');

  await b001.getByLabel('08 · บัญชี - การเงิน').uncheck();
  await b001.getByLabel('09 · งานบุคคล').uncheck();
  await golden.step('ปิดสิทธิเมนู 08 และ 09 ของสาขา B001');
  await b001.getByLabel('08 · บัญชี - การเงิน').scrollIntoViewIfNeeded();
  await golden.screen('b001-menu-permissions', { mask: [...await hqOwnData(page), await hiddenPasswords(b001, 2), allPasswordCells(page)] });
  await golden.stateChange('hq-controls', before);

  await signOut(page);
  await refusedLogin(page, 'b002', '1234', 'สาขานี้ถูกระงับการใช้งานโดย HQ');
  await golden.step('หัวหน้าสาขา B002 เข้าระบบไม่ได้');
  // The sign-in screen has no demo account line or way in without a password
  // (A1, A3), so S95's screenshot of it cannot match; what it shows is checked here.
  await expect(page.getByText('บัญชีทดสอบ', { exact: false })).toHaveCount(0);
  await expect(page.getByText('กำลังเตรียมโปรแกรม…')).toBeHidden();
  await refusedLogin(page, 'staff001', '5678', 'บัญชีนี้ถูกระงับการใช้งาน — ติดต่อหัวหน้าสาขา');
  await golden.step('พนักงาน staff001 เข้าระบบไม่ได้');

  await app.login('b001', '1234');
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button /00 Mr\\.DriveGo/
      - button /01 ลูกค้าสัมพันธ์/
      - button /P1 DriveGo ProX · Ecosystem/
      - button /02 ข้อมูลลูกค้า/
      - button /03 ใบเสนอราคา \\/ อนุมัติซ่อม/
      - button /04 ใบเสร็จรับเงิน \\/ ใบกำกับภาษี/
      - button /05 ข้อมูลผู้ขาย/
      - button /06 รายจ่าย \\/ ซื้อสินค้า/
      - button /07 สต๊อกอะไหล่/
      - button /P2 ห้องข้อมูลเทคนิค/
      - button /10 ตั้งค่าองค์กร/
      - button /11 ตั้งค่าเพิ่มเติม/
  `);
  await golden.step('หัวหน้าสาขา B001 เข้าระบบ ไม่เห็นเมนู 08 และ 09');
  await golden.screen('b001-limited-menus');

  // Legacy behaviour reported to the owner: the home shortcut to employees still opens
  // (menu 09 is off) and shows an empty page with no message.
  await page.getByRole('button', { name: 'จัดการข้อมูลพนักงาน' }).click();
  await golden.step('กดทางลัดจัดการข้อมูลพนักงานในหน้าแรก ได้หน้าว่าง');
  await golden.screen('b001-employee-shortcut');

  await signOut(page);
  await app.login('hq', '1234');
  await page.getByRole('button', { name: '🏬 สาขา · รหัสผู้ใช้ · สิทธิ' }).click();
  const beforeReopen = await app.state();
  await branchCard(page, 'B002 · สาขาบางนา').getByRole('button', { name: '▶ เปิดใช้งานสาขา' }).click();
  await expect(branchCard(page, 'B002 · สาขาบางนา')).toContainText('เปิดใช้งาน');
  await golden.step('HQ เปิดใช้งานสาขา B002 อีกครั้ง');
  await branchCard(page, 'B001 · สาขาหลัก รังสิต').getByRole('row').filter({ hasText: 'ศักดิ์ชัย มั่นคง' })
    .getByRole('button', { name: '▶ เปิดใช้' }).click();
  await golden.step('HQ เปิดใช้บัญชี staff001 อีกครั้ง');
  await golden.stateChange('hq-reopen', beforeReopen);

  await signOut(page);
  await app.login('b002', '1234');
  await golden.step('หัวหน้าสาขา B002 เข้าระบบได้อีกครั้ง');
  golden.done();
});
