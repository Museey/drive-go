import { test, expect } from '../support/test';
import { legacySteps, sameScreen } from '../support/legacy-golden';

// Replaces S00 in the new system (tests/intentional-changes.json): the sign-in
// screen no longer shows the test copy's demo account and password (A3) nor its
// way in without a password (A1), and before signing in the browser holds no
// shop data (design 4.6). Signing in and the home screen are still S00's.
const S00 = 'S00-login.spec.ts';

test('S103 ระบบใหม่: หน้าเข้าระบบไม่มีบัญชีทดสอบและทางเข้าโดยไม่กรอกรหัส ก่อนเข้าระบบไม่มีข้อมูลร้าน แล้วเข้าระบบเห็นหน้าแรกเหมือน S00', async ({ app, page }, testInfo) => {
  const steps = legacySteps(S00, app);
  await app.open();
  await expect(page.getByPlaceholder('กรอกรหัสผ่าน')).toBeVisible();
  await expect(page.getByText('บัญชีทดสอบ', { exact: false })).toHaveCount(0);
  await expect(page.getByText('dg1688 / 123456', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /โดยไม่กรอกรหัส/ })).toHaveCount(0);
  const before = await app.state();
  for (const list of ['receipts', 'quotes', 'cust', 'stock', 'emp', 'vendors'])
    expect(before.DB[list], `DB.${list} before signing in`).toEqual([]);
  expect(before.DGB.shop).not.toHaveProperty('pass');
  expect(before.DGB.shop).not.toHaveProperty('ownerUser');
  expect(before.DGB.shop).not.toHaveProperty('email');
  await steps.same('หน้าเข้าสู่ระบบ');

  await app.login('dg1688', '123456');
  await steps.same('หลังเข้าสู่ระบบ');
  await sameScreen(page, app, testInfo, S00, 'home');
  const after = await app.state();
  expect(after.DGB.session).toEqual({ who: 'owner' });
  // A3: the browser never gets the password itself.
  expect(after.DGB.shop.pass).toBe('********');
  expect(JSON.stringify(after)).not.toContain('123456');
  steps.done();
});
