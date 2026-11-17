import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapters 2 and 11 of the manual: the owner's password, an employee's sign-in account, backups. Numbers on a picture
// are the numbers of the steps of its section.
test('11 ตั้งค่าองค์กรและสำรองข้อมูล', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await app.settle();
  await shot(page, '11-org', { mark: [[page.getByRole('button', { name: /เปลี่ยนรหัสผ่าน/ }).filter({ visible: true }).first(), '2']], scroll: false });
  // Backups: only the backup part of the page (the buttons beside it that replace all data are left out of the picture)
  const backupNow = page.getByRole('button', { name: 'สร้างจุดสำรองเดี๋ยวนี้' });
  const backups = page.getByLabel('จุดสำรองอัตโนมัติในเครื่อง (เก็บ 5 วันล่าสุด)');
  const restore = page.getByRole('button', { name: 'กู้คืนข้อมูลจากจุดสำรองที่เลือก' });
  await backupNow.evaluate(e => e.scrollIntoView({ block: 'center' }));
  const part = page.getByText(/^ที่เก็บข้อมูลและการสำรองข้อมูล/).filter({ visible: true });
  await shot(page, '11-backup', { mark: [[backupNow, '1'], [backups, '2'], [restore, '3']], scroll: false, area: [part, backupNow, backups, restore], pad: 20 });
  // A sign-in account for an employee (here the cashier EMP008)
  const cashier = page.getByRole('row').filter({ hasText: 'EMP008' });
  const issue = cashier.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' });
  await shot(page, '11-account', { mark: [[issue, '2']] });
  await issue.click();
  const input = page.locator('input:focus');
  await input.waitFor();
  await page.keyboard.type('Kaew#2569');
  const title = page.getByText(/^ตั้งรหัสผ่านให้/).filter({ visible: true });
  const ok = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true });
  await shot(page, '11-account-pass', { mark: [[input, '3'], [ok, '3']], scroll: false, area: [title, input, ok], pad: 20 });
  await ok.click();
  await expect(cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await app.settle();
  await shot(page, '11-account-done', { mark: [[cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' }), '4']], keepToast: true });
});
