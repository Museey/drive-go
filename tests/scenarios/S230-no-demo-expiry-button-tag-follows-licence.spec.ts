import { test, expect } from '../support/test';
import { legacySteps, sameScreen } from '../support/legacy-golden';

// Replaces S06 in the new system (tests/intentional-changes.json, task 3.15, decisions A1 and 15.1): the shop's
// licence is DriveGo's, on the server, so the demo button "เดโม: จำลองครบ 15 วัน" is gone (hidden where it was) and
// the owner panel's tag counts to the licence's last day — the test shop's licence is the fixture's, a trial to
// 10/02/2570, so the tag reads "ทดลองใช้ เหลือ 120 วัน" like the top bar's 120 days (the legacy tag counted 15 days
// from the cloud account's own trialStart). The steps that pressed the demo button cannot happen; signing in again
// and the rest of menu 10's screen are still S06's (the tag and the button's place are left out of the picture).
const S06 = 'S06-simulate-trial-expiry.spec.ts';

test('S230 ระบบใหม่: เมนู 10 ไม่มีปุ่มเดโม "จำลองครบ 15 วัน" ป้ายในแผงบัญชีผู้ซื้อระบบนับตามวันหมดอายุที่ server ออกจากระบบแล้วเข้าใหม่ได้ตามปกติ', async ({ app, page }, testInfo) => {
  const steps = legacySteps(S06, app);
  await app.loginAsOwner();
  await expect(page.getByText(/^Expired Date/).filter({ visible: true })).toHaveText('Expired Date 10/02/2570 · เหลืออายุการใช้งาน 120 วัน');
  await steps.same('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const tag = page.getByText('ทดลองใช้ เหลือ 120 วัน', { exact: true });
  await expect(tag).toBeVisible();
  await expect(page.getByText(/ทดลองใช้ เหลือ 15 วัน|หมดอายุทดลองใช้/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'เดโม: จำลองครบ 15 วัน' })).toHaveCount(0);
  steps.skip('เมนู 10 แสดงทดลองใช้เหลือ 15 วัน');   // the tag counts the licence (above)
  steps.skip('กดจำลองครบ 15 วัน');                 // no such button
  steps.skip('เมนู 10 แสดงหมดอายุทดลองใช้');
  await sameScreen(page, app, testInfo, S06, 'trial-expired-tag',
    { mask: [tag, page.locator('#dgbEmpWrap button[onclick^="dgbSimExpire"]')] });

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('dg1688', '123456');
  await steps.same('ออกจากระบบแล้วเข้าใหม่ ยังเข้าใช้งานได้ ไม่มีหน้าล็อก');
  steps.done();
});
