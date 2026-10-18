import { test, expect } from '../support/test';

test.use({ dataset: 'franchise-trial' });

// Every way a sign-in at a franchise chain can end, recorded from the legacy
// app, so the new system's server-side sign-in (task T7) is held to the same
// results and messages. Suspended accounts and branches: S95, S99.
test('S102 ผลการเข้าระบบของเครือ Franchise ทุกกรณี: รหัสผิด ตัวพิมพ์ใหญ่ พนักงานสาขารหัสผิด และทางเข้าแบบรหัสสาขา.รหัสพนักงาน', async ({ app, page, golden }) => {
  test.slow(); // many steps; each one waits for the saved data to settle
  await app.open();

  expect(await app.loginRefused('hq', '9999')).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await golden.step('HQ รหัสผิด');
  expect(await app.loginRefused('nobody', '1234')).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await golden.step('ไม่มีผู้ใช้นี้');
  expect(await app.loginRefused('staff001', '1234')).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await golden.step('พนักงานสาขา รหัสผิด');
  expect(await app.loginRefused('b009.EMP001', '1234')).toBe('ไม่พบรหัสสาขา "b009" — ส่วนหน้าจุดต้องเป็นรหัสสาขา เช่น b001.EMP001');
  await golden.step('รหัสสาขา.รหัสพนักงาน ไม่มีสาขานี้');
  expect(await app.loginRefused('b001.EMP999', '1234')).toBe('ไม่พบรหัสพนักงาน "EMP999" ในสาขา B001 — ตรวจสอบรหัสในเมนู 10 ส่วนที่ 2');
  await golden.step('รหัสสาขา.รหัสพนักงาน ไม่มีพนักงานนี้');
  expect(await app.loginRefused('b001.EMP002', '1234')).toBe('พนักงานคนนี้ยังไม่ได้ตั้งรหัส PIN — ให้หัวหน้าสาขา (HB) ตั้งให้ในเมนู 10 ก่อน');
  await golden.step('รหัสสาขา.รหัสพนักงาน พนักงานยังไม่มี PIN');

  await app.login('HQ', '1234');
  await golden.step('HQ พิมพ์ชื่อผู้ใช้ตัวพิมพ์ใหญ่');
  await expect(page.getByRole('button', { name: /HQ/ }).first()).toBeVisible();
});
