import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { addTestStaff, appCode } from '../support/new-shop.mjs';

// New behaviour (owner 2026-11-20, docs/NOTES.md "ลงทะเบียนทดลองใช้จากหน้าเว็บ"): the landing page's demo form became a
// sign-up for a trial. A garage fills it in (what is missing is asked for, the consent must be ticked); the request
// waits on the staff web page (/ops "คำขอลงทะเบียน"); staff open the shop from it with the fields of "เปิดร้านใหม่"
// already filled in. With e-mail set up the sign-in details go by e-mail (tests/db/signup.test.mjs); without it, as
// here, the page shows the temporary password for staff to tell on the phone. The owner then signs in with it.
test('S474 ระบบใหม่: อู่กรอกฟอร์มลงทะเบียนทดลองใช้ที่หน้าแรก คำขอขึ้นที่หน้าเว็บทีมงาน ทีมงานอนุมัติแล้วร้านเปิด เจ้าของร้านเข้าระบบได้', async ({ page }) => {
  test.slow();
  const tag = Date.now().toString(36).slice(-5);
  const name = `อู่ทดลอง ${tag}`, code = `trial-${tag}`;

  await page.goto(`${LEGACY_ORIGIN}/`);
  const contact = page.locator('#contact');
  await expect(contact.getByRole('heading', { name: 'ลงทะเบียนเพื่อทดลองใช้ DriveGo X' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'ลงทะเบียนทดลองใช้' })).toHaveAttribute('href', '#contact');
  // Missing details, then no consent: asked for, nothing sent.
  const send = contact.getByRole('button', { name: 'ลงทะเบียน', exact: true });
  await contact.getByLabel('ชื่ออู่หรือศูนย์บริการ').fill(name);
  await send.click();
  await expect(page.locator('#fErr')).toHaveText('กรอกชื่ออู่ ชื่อเจ้าของ เบอร์โทร และอีเมลให้ครบ แล้วติ๊กยินยอมก่อนส่ง');
  await contact.getByLabel('ชื่อ-นามสกุลเจ้าของ').fill('สมหญิง ทดลองดี');
  await contact.getByLabel('เบอร์โทร').fill('081-555-0101');
  await contact.getByLabel('อีเมล (สำหรับรับชื่อผู้ใช้และรหัสผ่าน)').fill(`owner-${tag}@example.com`);
  await contact.getByLabel('แพ็กเกจ').selectOption({ label: 'DriveGo ProX' });
  await contact.getByLabel('สิ่งที่อยากให้ระบบช่วย (ไม่บังคับ)').fill('อยากรู้ต้นทุนรายบิล');
  await send.click();
  await expect(page.locator('#fErr')).toHaveText('กรอกชื่ออู่ ชื่อเจ้าของ เบอร์โทร และอีเมลให้ครบ แล้วติ๊กยินยอมก่อนส่ง');
  await contact.getByRole('checkbox', { name: /^ยินยอมให้บริษัท ไดร์ฟบิซ เมคคาไลซ์ โซลูชั่น จำกัด เก็บและใช้ข้อมูลนี้/ }).check();
  await send.click();
  await expect(contact.getByText('ได้รับคำขอลงทะเบียนแล้ว')).toBeVisible();
  await expect(contact.getByText('ทีมงานจะตรวจข้อมูลแล้วส่งชื่อผู้ใช้และรหัสผ่านไปที่อีเมลของคุณ', { exact: false })).toBeVisible();

  // Staff: the request is on the staff page.
  const staff = await addTestStaff({ ready: true });
  await page.goto(`${LEGACY_ORIGIN}/ops/`);
  await page.getByLabel('ชื่อผู้ใช้').fill(staff.login);
  await page.getByLabel('รหัสผ่าน').fill(staff.password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.getByLabel('รหัส 6 หลัก').fill(appCode(staff.secret));
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
  await page.getByRole('link', { name: 'คำขอลงทะเบียน', exact: true }).click();
  await expect(page.getByText('ยังไม่ได้ตั้งค่าการส่งอีเมล', { exact: false }).first()).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: name });
  await expect(row).toContainText('ProX');
  await expect(row).toContainText('ใหม่');
  await row.click();
  const facts = page.locator('dl.facts');
  await expect(facts).toContainText('อยากรู้ต้นทุนรายบิล');
  await expect(facts).toContainText('ยินยอมให้บริษัท ไดร์ฟบิซ เมคคาไลซ์ โซลูชั่น จำกัด');
  // The fields of a new shop come from the request; staff choose the shop code.
  await expect(page.getByLabel('ชื่อร้าน / ชื่อเครือ')).toHaveValue(name);
  await expect(page.getByLabel('ชื่อ-นามสกุลเจ้าของ')).toHaveValue('สมหญิง ทดลองดี');
  await expect(page.getByLabel('แพ็กเกจ')).toHaveValue('prox');
  await expect(page.getByLabel('อีเมล', { exact: true })).toHaveValue(`owner-${tag}@example.com`);
  await page.getByRole('textbox', { name: /^รหัสร้าน/ }).fill(code);
  await page.getByRole('button', { name: 'อนุมัติและเปิดร้าน' }).click();
  await expect(page.getByText(`เปิดร้าน ${code} แล้ว`, { exact: false })).toContainText('ยังไม่ได้ตั้งค่าการส่งอีเมล');
  const card = page.getByRole('status').filter({ hasText: 'รหัสผ่านชั่วคราว' });
  const user = (await card.locator('dd').nth(1).textContent())!;
  const password = (await card.locator('dd').nth(2).textContent())!;
  expect(user).toBe(code.replace(/-/g, ''));

  // Decided: the list says so.
  await page.getByRole('link', { name: 'คำขอลงทะเบียน', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: name })).toContainText(`อนุมัติแล้ว · ${code}`);

  // The owner signs in with what staff told them.
  const owner = legacyApp(page, { dataset: 'prox-trial', url: `${LEGACY_ORIGIN}/${code}/`, restore: async () => {} });
  await owner.open();
  await owner.login(user, password);
  await expect(page.getByText(`ยินดีต้อนรับ สมหญิง ทดลองดี — เจ้าของร้าน ${name}`, { exact: true }).filter({ visible: true })).toBeVisible();
  await owner.settle();
});
