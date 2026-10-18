import { test, expect } from '../support/test';

// New behaviour (decisions Q2, Q5): after 5 wrong passwords within 15 minutes
// the account must wait 15 minutes, even with the right password.
test('S108 ระบบใหม่: กรอกรหัสผิด 5 ครั้ง ครั้งต่อไปแม้รหัสถูกก็ต้องรอ 15 นาที บัญชีอื่นยังเข้าได้', async ({ app }) => {
  await app.open();
  for (let i = 1; i <= 5; i++)
    expect(await app.loginRefused('dg1688', `wrong${i}`)).toBe('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
  expect(await app.loginRefused('dg1688', '123456')).toBe('กรอกรหัสผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่');
  expect(await app.loginRefused('demo@example.com', '123456')).toBe('กรอกรหัสผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่');
});
