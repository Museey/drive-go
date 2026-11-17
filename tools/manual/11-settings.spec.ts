import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 11: the shop's own settings, backups, all attachments as a .zip, signing out.
test('11 ตั้งค่าองค์กรและสำรองข้อมูล', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await app.settle();
  await shot(page, '11-org', { mark: [page.getByRole('button', { name: /เปลี่ยนรหัสผ่าน/ }).filter({ visible: true }).first()], scroll: false });
  const backupNow = page.getByRole('button', { name: 'สร้างจุดสำรองเดี๋ยวนี้' });
  const backups = page.getByLabel('จุดสำรองอัตโนมัติในเครื่อง (เก็บ 5 วันล่าสุด)');
  await shot(page, '11-backup', { mark: [[backupNow, '1'], [backups, '2'], [page.getByRole('button', { name: 'กู้คืนข้อมูลจากจุดสำรองที่เลือก' }), '3']] });
  const zip = page.getByRole('button', { name: 'ดาวน์โหลดไฟล์แนบทั้งหมด (.zip)' });
  if (await zip.count()) await shot(page, '11-zip', { mark: [zip] });
  // A sign-in account for an employee (here the cashier EMP008)
  const cashier = page.getByRole('row').filter({ hasText: 'EMP008' });
  const issue = cashier.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' });
  await shot(page, '11-account', { mark: [issue] });
  await issue.click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('88888888');
  await shot(page, '11-account-pass', { mark: [page.locator('input:focus')], scroll: false });
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await app.settle();
  await shot(page, '11-account-done', { mark: [cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' })], keepToast: true });
});
