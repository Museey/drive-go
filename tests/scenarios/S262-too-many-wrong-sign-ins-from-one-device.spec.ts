import { test, expect } from '../support/test';

// New behaviour (security review proposal 1, the owner's decision of 2026-10-31, docs/SECURITY-REVIEW.md): besides the
// lockout of one account (S108), one device that fails to sign in more than 30 times within 15 minutes — across
// accounts, here 30 different user names once each — must wait 15 minutes, even with a right password, with the same
// message. Another device still signs in. (The device is the address DigitalOcean's load balancer reports; each test
// is a device of its own.)
test('S262 ระบบใหม่: เครื่องเดียวกรอกผิด 30 ครั้งใน 15 นาที (หลายบัญชี ไม่มีบัญชีไหนผิดถึง 5 ครั้ง) ครั้งต่อไปแม้รหัสถูกก็ต้องรอ 15 นาที เครื่องอื่นยังเข้าได้', async ({ app, context }) => {
  test.slow();
  await app.open();
  for (let i = 1; i <= 30; i++)
    expect(await app.loginRefused(`nobody${i}`, 'wrong')).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  expect(await app.loginRefused('dg1688', '123456')).toBe('กรอกรหัสผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่');

  // Another device: the owner's account was never tried with a wrong password, it signs in.
  await context.setExtraHTTPHeaders({ 'x-forwarded-for': 'S262-another-device' });
  await app.login('dg1688', '123456');
});
