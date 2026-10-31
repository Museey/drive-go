import { test, expect } from '../support/test';
import { recordedErrors } from '../support/new-shop.mjs';

// New behaviour (LAUNCH-CHECKLIST stage 1 "แจ้งเตือนเมื่อระบบมีปัญหา", 2026-10-31): an error a page did not catch
// (server/client/errors.ts → /api/errors) and a request the server failed on (server/instrumentation.ts) are recorded
// with the shop and the signed-in person, for staff (tools/errors.mjs) and the hourly alert (tools/watch.mjs).
// The person using the page sees nothing of it; the same error is sent at most twice.
test('S261 ระบบใหม่: ข้อผิดพลาดที่หน้าจอไม่ได้จับ และคำขอที่ server ล้ม ถูกบันทึกพร้อมร้านและคนที่เข้าระบบ ให้ทีมงานดูและแจ้งเตือน', async ({ app, page }) => {
  await app.loginAsOwner();
  const path = new URL(page.url()).pathname;

  // A script of the app throws and nothing catches it — three times: recorded twice.
  for (let i = 0; i < 3; i++) await page.addScriptTag({ content: "throw new Error('S261 หน้าจอพัง');" });
  await expect.poll(async () => (await recordedErrors(page)).length).toBe(2);
  const browser = await recordedErrors(page);
  for (const e of browser) {
    expect(e).toMatchObject({ source: 'browser', path });
    expect(e.message).toMatch(/S261 หน้าจอพัง/);
    expect(e.user_id).toBeTruthy();
    expect(e.agent).toMatch(/Chrome/);
  }
  // Nothing shows on the page.
  await expect(page.getByText('S261 หน้าจอพัง')).toHaveCount(0);

  // The server fails on a request of this session (from the page: its own cookie): recorded with the shop too.
  expect(await page.evaluate(async () => (await fetch('/api/test-error?q=private', { cache: 'no-store' })).status)).toBe(500);
  await expect.poll(async () => (await recordedErrors(page)).length).toBe(3);
  const [server] = (await recordedErrors(page)).slice(2);
  expect(server).toMatchObject({ source: 'server', path: '/api/test-error' });   // without the query string
  expect(server.message).toBe('GET /api/test-error: a request the server failed on (test)');
  expect(server.detail).toMatch(/^Error: a request the server failed on \(test\)\n\s+at /);
  expect(server.user_id).toBe(browser[0].user_id);
});
