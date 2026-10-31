import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S04 in the new system (tests/intentional-changes.json, task 3.9, finding 42 approved): the employee
// (EMP011, a technician without "ดูยอดเงินและมูลค่าในหน้าแรก") signs in on a home page whose card of sales waiting
// for payment keeps its count and no longer shows the amount (legacy: "รวม ฿36,462.45 · …"). Every step, data
// change and the rest of each screen are S04's.
const S04 = 'S04-change-employee-login-phone.spec.ts';

test('S180 ระบบใหม่: เจ้าของร้านแก้เบอร์โทรเข้าระบบของพนักงาน แล้วพนักงานเข้าระบบด้วยเบอร์ใหม่ หน้าแรกของพนักงานไม่แสดงยอดเงินรอชำระ', async ({ app, page }, testInfo) => {
  // A new password has at least 8 characters (security review proposal 2, the owner's decision of 2026-10-31): the
  // account gets a longer one than the legacy scenario's, and the message that tells it is swapped.
  const golden = legacyGolden(S04, { app, page, testInfo }, { numbers: [['รหัสผ่าน 2468', 'รหัสผ่าน 24682468']] });
  test.slow(); // many steps; each one waits for the saved data to settle
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const row = page.getByRole('row').filter({ hasText: 'EMP011' });
  await row.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  // The password box has no label; it takes the focus when the prompt opens.
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('24682468');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(row.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await golden.step('ออกบัญชีให้ EMP011 อดิศักดิ์ ไฟแรง (เบอร์ 092-999-3344)');

  // The phone box in the row has no label of its own: it is the only text box in the row.
  const phone = row.getByRole('textbox');
  await expect(phone).toHaveValue('092-999-3344');
  const before = await app.state();
  await phone.fill('092-888-1122'); // EMP010's number
  await phone.press('Tab');
  await expect(phone).toHaveValue('092-999-3344');
  await golden.step('แก้เป็นเบอร์ที่ซ้ำกับ EMP010 ถูกปฏิเสธ');
  await golden.stateChange('duplicate-phone-refused', before);

  await phone.fill('095-123-4567');
  await phone.press('Tab');
  await expect(phone).toHaveValue('095-123-4567');
  await golden.step('แก้เป็นเบอร์ใหม่ 095-123-4567');
  await golden.stateChange('change-phone', before);
  await row.scrollIntoViewIfNeeded();
  // The account's password in the table is the longer one (checked here, left out of the picture).
  const password = row.getByRole('cell', { name: '24682468', exact: true });
  await expect(password).toBeVisible();
  await golden.screen('account-panel-new-phone', { mask: [password] });

  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'EMP011' }).filter({ visible: true })).toContainText('095-123-4567');
  await golden.step('ทะเบียนพนักงานเมนู 09 แสดงเบอร์ใหม่');

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ชื่อผู้ใช้ อีเมล หรือเบอร์โทร').fill('092-999-3344');
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill('24682468');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByText('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('พนักงานเข้าด้วยเบอร์เดิม ถูกปฏิเสธ');

  await app.login('095-123-4567', '24682468');
  await golden.step('พนักงานเข้าด้วยเบอร์ใหม่ได้');
  const waiting = page.locator('#pkgSfHome');
  await expect(waiting).toContainText('ค้างข้ามวัน');
  await expect(waiting).not.toContainText('฿');
  await golden.screen('employee-home', { mask: [waiting] });
  golden.done();
});
