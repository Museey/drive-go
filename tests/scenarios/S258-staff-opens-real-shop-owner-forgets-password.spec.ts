import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { openRealTestShop, readTestShop, resetTestPassword } from '../support/new-shop.mjs';

// New behaviour (LAUNCH-CHECKLIST stage 2, decision P3: staff open shops, there is no sign-up page): DriveGo's staff
// open a real garage with tools/shop-admin.mjs new — an empty shop (no sample data) with its owner's account and a
// temporary password. On the owner's first entry the registration typed by the staff goes into menu 10, as the legacy
// sign-up form did (05.js dgbSignup). The owner forgets the password: staff give a new one with tools/shop-admin.mjs
// password; the old one no longer works.
test('S258 ระบบใหม่: ทีมงานเปิดร้านจริง (ร้านว่าง) เจ้าของเข้าระบบด้วยรหัสชั่วคราว ข้อมูลจดทะเบียนอยู่ในตั้งค่าองค์กร ลืมรหัสแล้วทีมงานตั้งรหัสใหม่ให้', async ({ page }) => {
  test.slow();
  const shop = await openRealTestShop({ pkg: 'biz', name: 'อู่ช่างแดง', owner: 'แดง ใจดี', taxId: '0105545001234',
    addr: '12 ถ.พหลโยธิน อ.เมือง ลำปาง', zip: '52000', tel: '081-234-5678', email: 'daeng@example.com' });
  expect(shop.user).toBe(shop.code.replace(/-/g, ''));
  const real = legacyApp(page, { dataset: 'biz-trial', url: `${LEGACY_ORIGIN}/${shop.code}/`, restore: async () => {} });

  // The owner's first entry: welcomed by name, an empty shop.
  await real.open();
  await real.login(shop.user, shop.password);
  await expect(page.getByText('ยินดีต้อนรับ แดง ใจดี — เจ้าของร้าน อู่ช่างแดง', { exact: true }).filter({ visible: true })).toBeVisible();
  await real.settle();
  const data = await readTestShop(shop.code);
  for (const list of ['cust', 'stock', 'quotes', 'receipts', 'stockCuts', 'purchases', 'expenses', 'emp']) expect(data[list], list).toEqual([]);
  // The registration is in menu 10, once (the mark is gone).
  expect(data.shop).toMatchObject({ name: 'อู่ช่างแดง', person: 'แดง ใจดี', tax: '0105545001234', tel: '081-234-5678',
    email: 'daeng@example.com', addr: '12 ถ.พหลโยธิน อ.เมือง ลำปาง 52000' });
  expect((await real.state() as any).DGB.shop.fillSettings).toBeUndefined();
  await page.getByRole('button', { name: /^10 ตั้งค่าองค์กร/ }).click();
  await expect(page.getByLabel('ชื่อร้าน / ชื่ออู่')).toHaveValue('อู่ช่างแดง');
  // A Biz shop signs out at once (S101).
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();

  // Forgotten: staff give a new password; the old one is refused, the new one signs in.
  const reset = await resetTestPassword(shop.code);
  expect(reset.user).toBe(shop.user);
  expect(await real.loginRefused(shop.user, shop.password)).toBe('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
  await real.login(shop.user, reset.password);
  await expect(page.getByText('ยินดีต้อนรับ แดง ใจดี — เจ้าของร้าน อู่ช่างแดง', { exact: true }).filter({ visible: true })).toBeVisible();
});
