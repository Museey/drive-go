import { test, expect } from '../support/test';

test('S74 สร้างจุดสำรองในเครื่อง ล้างข้อมูลทั้งหมด แล้วกู้คืนจากจุดสำรอง ข้อมูลกลับมาครบ', async ({ app, page, golden }) => {
  test.slow(); // many steps; each one waits for the saved data to settle
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const backups = page.getByLabel('จุดสำรองอัตโนมัติในเครื่อง (เก็บ 5 วันล่าสุด)');
  await backups.scrollIntoViewIfNeeded();
  await expect(page.getByText('ระบบกำลังเก็บข้อมูลไว้ที่ ฐานข้อมูลในเครื่อง (IndexedDB)', { exact: false })).toBeVisible();
  await golden.step('เมนู 10 ส่วนที่เก็บข้อมูลและการสำรองข้อมูล');

  let before = await app.state();
  await page.getByRole('button', { name: 'สร้างจุดสำรองเดี๋ยวนี้' }).click();
  await expect(backups.getByRole('option')).toHaveText(['13/10/2569']);
  await golden.step('กดสร้างจุดสำรองเดี๋ยวนี้');
  // The backup is kept beside the shop data, not in it: the data itself does not change.
  await golden.stateChange('backup-now', before);

  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeVisible();
  await golden.step('กดล้างข้อมูลทั้งหมด ระบบถามยืนยัน');
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await golden.step('ล้างข้อมูลแล้ว');
  await golden.counts('after-wipe');

  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await golden.step('หน้าแรกหลังล้างข้อมูล');
  await golden.screen('home-after-wipe');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await backups.scrollIntoViewIfNeeded();
  await expect(backups).toHaveValue(/2026-10-13/);
  await page.getByRole('button', { name: 'กู้คืนข้อมูลจากจุดสำรองที่เลือก' }).click();
  await expect(page.getByText('กู้คืนข้อมูลจากจุดสำรอง 13/10/2569 ?', { exact: false })).toBeVisible();
  await golden.step('เลือกจุดสำรอง 13/10/2569 แล้วกดกู้คืน ระบบถามยืนยัน');
  await page.getByRole('button', { name: 'กู้คืน', exact: true }).click();
  await expect(backups.getByRole('option')).toHaveCount(2);
  await golden.step('กู้คืนข้อมูลแล้ว');
  await golden.counts('after-restore');
  await backups.scrollIntoViewIfNeeded();
  await golden.screen('backup-list-after-restore');
  await expect(backups.getByRole('option')).toHaveText(['before-restore', '13/10/2569']);

  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await golden.step('หน้าแรกหลังกู้คืน');
  await golden.screen('home-after-restore');
});
