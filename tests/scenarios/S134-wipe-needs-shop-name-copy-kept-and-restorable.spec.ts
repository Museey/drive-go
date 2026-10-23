import { test, expect } from '../support/test';
import { auditNote } from '../support/whole-data';

// New behaviour (task 3.2, decision F1): replacing the whole shop's data is
// still allowed, but the owner types the shop's name to confirm, the system
// keeps a copy of the data first (90 days, listed with the backup points and
// restorable by the shop), and the audit log records it.
test('S134 ระบบใหม่: ล้างข้อมูลต้องพิมพ์ชื่อร้านให้ตรง ระบบสำรองข้อมูลไว้ก่อน ลงประวัติการใช้งาน และกู้คืนจากข้อมูลที่สำรองไว้ได้', async ({ app, page }) => {
  await app.loginAsOwner();
  const before = (await app.state()).DB;
  const shopName: string = before.shop.name;
  const box = page.getByPlaceholder(`พิมพ์ชื่อร้าน ${shopName} เพื่อยืนยัน`, { exact: true });
  const wipeButton = page.getByRole('button', { name: 'ล้างข้อมูล', exact: true });

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const backups = page.getByLabel('จุดสำรองอัตโนมัติในเครื่อง (เก็บ 5 วันล่าสุด)');
  await backups.scrollIntoViewIfNeeded();
  // The day's own backup point, made at the first save of the day.
  await expect(backups.getByRole('option')).toHaveText(['13/10/2569']);

  // A name that is not the shop's: the button stays off, Enter does nothing; then cancel.
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeVisible();
  await expect(wipeButton).toBeDisabled();
  await box.fill(shopName.slice(0, -1));
  await box.press('Enter');
  await expect(wipeButton).toBeDisabled();
  await page.getByRole('button', { name: 'ไม่ล้าง', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await app.settle();
  expect((await app.state()).DB).toEqual(before);
  // The day's own backup point, made at the first save of the day.
  await expect(backups.getByRole('option')).toHaveText(['13/10/2569']);

  // The shop's name, exactly: the data is wiped, after a copy was kept.
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await box.fill(shopName);
  await expect(wipeButton).toBeEnabled();
  await wipeButton.click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await app.settle();
  const wiped = (await app.state()).DB;
  expect(wiped.receipts).toEqual([]);
  expect(wiped.audit).toEqual([expect.objectContaining({
    kind: 'data', act: 'wipe', note: auditNote('ล้างข้อมูลทั้งหมด'), userName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' })]);

  // The copy is in the restore list, and restoring it brings the data back.
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await backups.scrollIntoViewIfNeeded();
  await expect(backups.getByRole('option')).toHaveText(['สำรองก่อนล้างข้อมูล 13/10/2569 09:00', '13/10/2569']);
  await backups.selectOption({ label: 'สำรองก่อนล้างข้อมูล 13/10/2569 09:00' });
  await page.getByRole('button', { name: 'กู้คืนข้อมูลจากจุดสำรองที่เลือก' }).click();
  await expect(page.getByText('กู้คืนข้อมูลจากจุดสำรอง สำรองก่อนล้างข้อมูล 13/10/2569 09:00 ?', { exact: false })).toBeVisible();
  await box.fill(shopName);
  await page.getByRole('button', { name: 'กู้คืน', exact: true }).click();
  await expect(backups.getByRole('option')).toHaveCount(4);
  await app.settle();
  const restored = (await app.state()).DB;
  expect(restored.audit.at(-1)).toMatchObject({
    kind: 'data', act: 'restore', note: auditNote('กู้คืนข้อมูลจากจุดสำรอง สำรองก่อนล้างข้อมูล 13/10/2569 09:00') });
  expect({ ...restored, audit: restored.audit.slice(0, -1) }).toEqual(before);
  await expect(backups.getByRole('option')).toHaveText(
    ['สำรองก่อนล้างข้อมูล 13/10/2569 09:00', 'สำรองก่อนกู้คืน 13/10/2569 09:00', 'before-restore', '13/10/2569']);

  // Nobody can remove a copy before its 90 days, not even the owner calling the API.
  const removed = await page.evaluate(async () => (await fetch(`/api/storage/${encodeURIComponent('garage.v22.bak.safety-2026-10-13T09-00-00-wipe')}`, { method: 'DELETE' })).status);
  expect(removed).toBe(403);
  await app.open();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(backups.getByRole('option')).toHaveText(
    ['สำรองก่อนล้างข้อมูล 13/10/2569 09:00', 'สำรองก่อนกู้คืน 13/10/2569 09:00', 'before-restore', '13/10/2569']);
});
