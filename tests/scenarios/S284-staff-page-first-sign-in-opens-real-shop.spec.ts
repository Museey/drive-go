import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { addTestStaff, appCode, readTestShop } from '../support/new-shop.mjs';

// New behaviour (owner 2026-11-09: "ทำหน้าเว็บเลยครับ", docs/NOTES.md "หน้าเว็บของทีมงาน"): the staff web page at
// /staff/ (its own app on DigitalOcean). A staff account added with tools/shop-admin.mjs staff add signs in the first
// time with its temporary password, sets its own password and an authenticator app, then opens a real garage as
// tools/shop-admin.mjs new does (S258); the owner signs in with the temporary password the page showed once.
test('S284 ระบบใหม่: ทีมงานเข้าหน้าเว็บทีมงานครั้งแรก ตั้งรหัสใหม่และแอปยืนยันตัวตน เปิดร้านจริง แล้วเจ้าของร้านเข้าด้วยรหัสชั่วคราวที่หน้าเว็บแสดง', async ({ page }) => {
  test.slow();
  const staff = await addTestStaff();
  await page.goto(`${LEGACY_ORIGIN}/staff/`);
  await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบทีมงาน DriveGo' })).toBeVisible();
  await page.getByLabel('ชื่อผู้ใช้').fill(staff.login);
  await page.getByLabel('รหัสผ่าน').fill('not-the-password');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page.getByRole('alert')).toHaveText('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await page.getByLabel('รหัสผ่าน').fill(staff.password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

  // A temporary password: a new one first.
  await expect(page.getByRole('heading', { name: 'ตั้งรหัสผ่านใหม่' })).toBeVisible();
  await page.getByLabel('รหัสผ่านใหม่', { exact: true }).fill('ทีมงานดูแลอู่-2026');
  await page.getByLabel('พิมพ์รหัสผ่านใหม่อีกครั้ง').fill('ทีมงานดูแลอู่-2025');
  await page.getByRole('button', { name: 'บันทึกรหัสผ่าน' }).click();
  await expect(page.getByRole('alert')).toHaveText('รหัสผ่านสองช่องไม่ตรงกัน');
  await page.getByLabel('พิมพ์รหัสผ่านใหม่อีกครั้ง').fill('ทีมงานดูแลอู่-2026');
  await page.getByRole('button', { name: 'บันทึกรหัสผ่าน' }).click();

  // The authenticator app: a QR code and the same secret as text; a wrong code is refused.
  await expect(page.getByRole('heading', { name: 'ตั้งค่าแอปยืนยันตัวตน' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'QR สำหรับแอปยืนยันตัวตน' })).toBeVisible();
  const secret = (await page.locator('[data-secret]').textContent())!.replace(/\s/g, '');
  expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  await page.getByLabel('รหัส 6 หลัก').fill(appCode(secret, -5));
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.getByRole('alert')).toHaveText('รหัสไม่ถูกต้อง หรือหมดเวลาแล้ว ลองรหัสใหม่ที่แอปแสดง');
  await page.getByLabel('รหัส 6 หลัก').fill(appCode(secret));
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.getByRole('heading', { name: 'ร้านทั้งหมด' })).toBeVisible();
  await expect(page.getByText(`(${staff.login})`)).toBeVisible();

  // Opening a garage: a code that is taken or wrong is refused in Thai, then the shop opens.
  await page.getByRole('link', { name: 'เปิดร้านใหม่' }).click();
  const code = `real-${process.pid.toString(36)}-web`;
  const form = page.locator('form');
  await form.getByRole('textbox', { name: /^รหัสร้าน/ }).fill('staff');
  await form.getByLabel('แพ็กเกจ').selectOption('biz');
  await form.getByLabel('ประเภท').selectOption('pilot');
  await form.getByLabel('ชื่อร้าน / ชื่อเครือ').fill('อู่ช่างดำ');
  await form.getByLabel('ชื่อ-นามสกุลเจ้าของ').fill('ดำ ขยัน');
  await form.getByLabel('เลขประจำตัวผู้เสียภาษี').fill('0105545009876');
  await form.getByLabel('โทรศัพท์').fill('089-765-4321');
  await form.getByLabel('ช่องทางติดต่อ').fill('คุณดำ 089-765-4321');
  await form.getByRole('button', { name: 'เปิดร้าน' }).click();
  await expect(page.getByRole('alert')).toHaveText('รหัสร้านต้องเป็นตัวพิมพ์เล็ก ตัวเลข หรือขีด 3–32 ตัว และห้ามใช้ api, staff หรือรหัสร้านตัวอย่าง');
  await form.getByRole('textbox', { name: /^รหัสร้าน/ }).fill(code);
  await form.getByRole('button', { name: 'เปิดร้าน' }).click();
  const card = page.getByRole('status').filter({ hasText: 'รหัสผ่านชั่วคราว' });
  await expect(page.getByText(`เปิดร้าน ${code} แล้ว ใช้ได้ถึง 13/10/2570`)).toBeVisible();
  const user = await card.locator('dd').nth(1).textContent();
  const password = (await card.locator('dd').nth(2).textContent())!;
  expect(user).toBe(code.replace(/-/g, ''));
  expect(password).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{10}$/);

  // The list: the new pilot garage, found by its name.
  await page.getByRole('link', { name: 'ร้านทั้งหมด' }).click();
  await page.getByRole('searchbox', { name: 'ค้นหา' }).fill('ช่างดำ');
  const row = page.getByRole('row').filter({ hasText: code });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('อู่นำร่อง');
  await expect(row).toContainText('ใช้งานได้');
  await row.click();
  await expect(page.getByRole('heading', { name: /อู่ช่างดำ/ })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: `web:${staff.login}` })).toContainText('เปิดร้าน');

  // Signing out; the next sign-in is the password and the app's code.
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await page.getByLabel('ชื่อผู้ใช้').fill(staff.login);
  await page.getByLabel('รหัสผ่าน').fill('ทีมงานดูแลอู่-2026');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page.getByRole('heading', { name: 'รหัสยืนยันตัวตน' })).toBeVisible();
  await page.getByLabel('รหัส 6 หลัก').fill(appCode(secret, 1));
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.getByRole('heading', { name: 'ร้านทั้งหมด' })).toBeVisible();

  // The owner's first entry with the password the page showed: the registration typed on the page is in menu 10.
  const owner = legacyApp(page, { dataset: 'biz-trial', url: `${LEGACY_ORIGIN}/${code}/`, restore: async () => {} });
  await owner.open();
  await owner.login(user!, password);
  await expect(page.getByText('ยินดีต้อนรับ ดำ ขยัน — เจ้าของร้าน อู่ช่างดำ', { exact: true }).filter({ visible: true })).toBeVisible();
  await owner.settle();
  expect((await readTestShop(code)).shop).toMatchObject({ name: 'อู่ช่างดำ', person: 'ดำ ขยัน', tax: '0105545009876', tel: '089-765-4321' });
});
