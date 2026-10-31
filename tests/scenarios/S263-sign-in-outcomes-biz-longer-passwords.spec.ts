import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { storageApi } from '../support/storage-api';

// Replaces S101 in the new system (tests/intentional-changes.json): a password set from now on has at least 8
// characters (security review proposal 2, the owner's decision of 2026-10-31), so EMP008's account is issued with
// 88888888 instead of 8888 — the message that tells it says so. Every other step and message is S101's.
const S101 = 'S101-sign-in-outcomes-biz.spec.ts';

test('S263 ระบบใหม่: ผลการเข้าระบบของร้าน Biz ทุกกรณีเหมือน S101 แต่รหัสผ่านที่ออกให้พนักงานยาว 8 ตัว', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S101, { app, page, testInfo }, { numbers: [['รหัสผ่าน 8888', 'รหัสผ่าน 88888888']] });
  const signOut = async () => {
    await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
    await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  };
  await app.open();

  expect(await app.loginRefused('dg1688', '111111')).toBe('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
  await golden.step('เจ้าของร้าน รหัสผิด');
  expect(await app.loginRefused('nobody', '123456')).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await golden.step('ไม่มีผู้ใช้นี้');
  expect(await app.loginRefused('092-333-4455', '88888888')).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await golden.step('เบอร์ของพนักงานที่ยังไม่มีบัญชี');

  await app.login('demo@example.com', '123456');
  await golden.step('เจ้าของร้านเข้าด้วยอีเมล');
  await signOut();
  await app.login('DG1688', '123456');
  await golden.step('เจ้าของร้านพิมพ์ชื่อผู้ใช้ตัวพิมพ์ใหญ่');
  // The server refuses a shorter password too, also when it is sent without the screens.
  const api = storageApi(page);
  const shop = (await api.read('dgb.v22')).data.shop;
  expect(await api.save('dgb.v22', 'DGB.shop', '', { ...shop, pass: '********' }, [{ unit: 'DGB.shop', key: '', field: 'pass', value: 'short12' }]))
    .toEqual({ status: 400, body: { error: 'password too short', min: 8 } });

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const cashier = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashier.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('88888888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await golden.step('ออกบัญชีให้ EMP008 รหัส 8888');   // S101's label; the password it gave is 88888888 here
  await signOut();

  expect(await app.loginRefused('092-333-4455', '99999999')).toBe('รหัสผ่านไม่ถูกต้อง');
  await golden.step('พนักงาน รหัสผิด');
  await app.login('0923334455', '88888888');
  await golden.step('พนักงานเข้าด้วยเบอร์ที่ไม่มีขีด');
  golden.done();
});
