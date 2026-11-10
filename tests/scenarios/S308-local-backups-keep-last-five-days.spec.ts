import { test, expect } from '../support/test';

// Settings (10) → "ที่เก็บข้อมูลและการสำรองข้อมูล": the browser keeps one restore point a day and only the last 5
// ("เก็บ 5 วันล่าสุด"). Pressing "สร้างจุดสำรองเดี๋ยวนี้" on six days in a row drops the oldest one, which is the
// only way the app deletes a key from its local database (docs/BEHAVIORS.md). The legacy app's own backups; the new
// system keeps its backups on the server (S100).
test('S308 กดสร้างจุดสำรองวันละครั้ง 6 วันติดกัน ระบบเก็บจุดสำรองไว้ 5 วันล่าสุด ลบวันที่เก่าที่สุดออก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const points = page.getByLabel('จุดสำรองอัตโนมัติในเครื่อง (เก็บ 5 วันล่าสุด)');
  await expect(points.getByRole('option')).toHaveText(['13/10/2569']);
  await golden.step('เมนู 10 มีจุดสำรองของวันนี้ 1 จุด');

  const backupNow = page.getByRole('button', { name: 'สร้างจุดสำรองเดี๋ยวนี้' });
  const days = ['14', '15', '16', '17'];
  for (const d of days) {
    await page.clock.setFixedTime(new Date(`2026-10-${d}T09:00:00+07:00`));
    await backupNow.click();
    await expect(points.getByRole('option').first()).toHaveText(`${d}/10/2569`);
    await golden.step(`วันที่ ${d}/10/2569 กดสร้างจุดสำรองเดี๋ยวนี้`);
  }
  await expect(points.getByRole('option')).toHaveText(['17/10/2569', '16/10/2569', '15/10/2569', '14/10/2569', '13/10/2569']);

  await page.clock.setFixedTime(new Date('2026-10-18T09:00:00+07:00'));
  await backupNow.click();
  await expect(points.getByRole('option')).toHaveText(['18/10/2569', '17/10/2569', '16/10/2569', '15/10/2569', '14/10/2569']);
  await golden.step('วันที่ 18/10/2569 กดสร้างจุดสำรองเดี๋ยวนี้ จุดสำรองวันที่ 13 ถูกลบออก เหลือ 5 วันล่าสุด');
  await golden.screen('five-restore-points');
});
