import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { addTestStaff, appCode, openRealTestShop } from '../support/new-shop.mjs';

// New behaviour (owner 2026-11-09, docs/NOTES.md "หน้าเว็บของทีมงาน"): on the staff web page, what
// tools/shop-admin.mjs password / renew / contact / close / postpone / told do, each written to the shop's log with
// the staff account (web:<login>). The owner signs in with the password the page gave; the old one is refused. The
// shop's page opened in the staff page's tab removes the staff sign-in (owner's choice of 2026-11-11: /ops of the same
// app, signed in per tab): back on /ops the staff signs in again.
test('S285 ระบบใหม่: ทีมงานตั้งรหัสใหม่ให้เจ้าของร้าน ต่ออายุ แก้ช่องทางติดต่อ ปิดร้าน และเลื่อนวันลบข้อมูลผ่านหน้าเว็บทีมงาน ทุกอย่างอยู่ในประวัติของร้าน', async ({ page }) => {
  test.slow();
  const shop = await openRealTestShop({ pkg: 'biz', name: 'อู่ช่างขาว', owner: 'ขาว ใจเย็น', from: '2026-09-01' });
  const staff = await addTestStaff({ ready: true });
  await page.goto(`${LEGACY_ORIGIN}/ops/`);
  await page.getByLabel('ชื่อผู้ใช้').fill(staff.login);
  await page.getByLabel('รหัสผ่าน').fill(staff.password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.getByLabel('รหัส 6 หลัก').fill(appCode(staff.secret));
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
  await page.getByRole('searchbox', { name: 'ค้นหา' }).fill(shop.code);
  await page.getByRole('row').filter({ hasText: shop.code }).click();
  await expect(page.getByRole('heading', { name: /อู่ช่างขาว/ })).toContainText('ใกล้หมดอายุ');
  const info = page.locator('dl.info');
  await expect(info).toContainText('ทดลองใช้');
  await expect(info).toContainText('31/10/2569 (18 วัน)');

  // The owner forgot the password: only after calling back.
  await page.getByRole('button', { name: 'ตั้งรหัสผ่านใหม่ให้เจ้าของร้าน' }).click();
  const panel = page.locator('.panel');
  await expect(panel).toContainText('โทรกลับไปที่เบอร์ที่ร้านให้ไว้');
  await panel.getByRole('checkbox', { name: 'โทรกลับและยืนยันตัวตนเจ้าของร้านแล้ว' }).check();
  await panel.getByRole('button', { name: 'ตั้งรหัสผ่านใหม่ให้เจ้าของร้าน' }).click();
  await expect(page.getByText('ตั้งรหัสผ่านใหม่แล้ว รหัสเดิมใช้ไม่ได้ทันที')).toBeVisible();
  const card = page.getByRole('status').filter({ hasText: 'รหัสผ่านชั่วคราว' });
  expect(await card.locator('dd').first().textContent()).toBe(shop.user);
  const password = (await card.locator('dd').nth(1).textContent())!;
  expect(password).not.toBe(shop.password);

  // The owner: the old password is refused, the new one signs in.
  const owner = legacyApp(page, { dataset: 'biz-trial', url: `${LEGACY_ORIGIN}/${shop.code}/`, restore: async () => {} });
  await owner.open();
  expect(await owner.loginRefused(shop.user, shop.password)).toBe('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
  await owner.login(shop.user, password);
  await expect(page.getByText('ยินดีต้อนรับ ขาว ใจเย็น — เจ้าของร้าน อู่ช่างขาว', { exact: true }).filter({ visible: true })).toBeVisible();
  await owner.settle();

  // Back on the staff page in the same tab: the shop's page removed the staff sign-in, so it is asked again.
  await page.goto(`${LEGACY_ORIGIN}/ops/#/shop/${shop.code}`);
  await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบทีมงาน DriveGo' })).toBeVisible();
  await page.getByLabel('ชื่อผู้ใช้').fill(staff.login);
  await page.getByLabel('รหัสผ่าน').fill(staff.password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.getByLabel('รหัส 6 หลัก').fill(appCode(staff.secret, 1));
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.getByRole('heading', { name: /อู่ช่างขาว/ })).toBeVisible();

  // Paid for a year: from the last day, which still runs.
  await page.getByRole('button', { name: 'ต่ออายุ (ร้านจ่ายเงินแล้ว)' }).click();
  await panel.getByLabel('หมายเหตุ').fill('โอนเข้าบัญชี 13/10');
  await panel.getByRole('button', { name: 'ต่ออายุ (ร้านจ่ายเงินแล้ว)' }).click();
  await expect(page.getByText('ต่ออายุแล้ว', { exact: true })).toBeVisible();
  await expect(info).toContainText('จ่ายแล้ว');
  await expect(info).toContainText('31/10/2570 (383 วัน)');

  await page.getByRole('button', { name: 'แก้ช่องทางติดต่อ' }).click();
  await panel.getByLabel('ช่องทางติดต่อ').fill('คุณขาว 081-111-2222');
  await panel.getByRole('button', { name: 'แก้ช่องทางติดต่อ' }).click();
  await expect(page.getByText('บันทึกช่องทางติดต่อแล้ว')).toBeVisible();
  await expect(info).toContainText('คุณขาว 081-111-2222');

  // The shop stops: yesterday was its last day; its data goes 90 days later, then 15 days later still.
  await page.getByRole('button', { name: 'ปิดร้าน' }).click();
  await expect(panel.getByLabel('วันสุดท้ายที่ใช้งาน')).toHaveValue('2026-10-12');
  await panel.getByLabel('หมายเหตุ').fill('ร้านขอยกเลิก');
  await panel.getByRole('button', { name: 'ปิดร้าน' }).click();
  await expect(page.getByText('ปิดร้านแล้ว', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /อู่ช่างขาว/ })).toContainText('หมดอายุ (อ่านอย่างเดียว)');
  await expect(info).toContainText('12/10/2569 (หมดแล้ว)');
  await expect(info).toContainText('10/01/2570');
  await page.getByRole('button', { name: 'เลื่อนวันลบข้อมูล' }).click();
  await panel.getByLabel('หรือเลื่อนออกไป (วัน)').fill('15');
  await panel.getByRole('button', { name: 'เลื่อนวันลบข้อมูล' }).click();
  await expect(page.getByText('เลื่อนวันลบข้อมูลแล้ว')).toBeVisible();
  await expect(info).toContainText('25/01/2570');
  // Too early to tell the shop: said in Thai, nothing changes.
  await page.getByRole('button', { name: 'จดว่าโทรแจ้งร้านแล้ว' }).click();
  await panel.getByRole('button', { name: 'จดว่าโทรแจ้งร้านแล้ว' }).click();
  await expect(panel.getByRole('alert')).toHaveText('ยังไม่ถึงเวลาโทรแจ้ง (เริ่มได้วันที่ 26/12/2569)');

  // The shop's log: newest first, every action by this staff account.
  const log = page.locator('table').last().locator('tbody tr');
  await expect(log.locator('td:nth-child(3)')).toHaveText(['เลื่อนวันลบข้อมูล', 'ปิดร้าน', 'แก้ช่องทางติดต่อ', 'ต่ออายุ', 'ตั้งรหัสผ่านใหม่', 'เปิดร้าน']);
  await expect(log.locator('td:nth-child(2)')).toHaveText([...Array(5).fill(`web:${staff.login}`), 'test']);
  await expect(log.nth(3)).toContainText('1 ปี จ่ายวันที่ 13/10/2569 · หมายเหตุ: โอนเข้าบัญชี 13/10');
});
