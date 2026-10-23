import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S76 in the new system (tests/intentional-changes.json, task 3.2,
// decisions A7, F1): the shop's 8 document counters stay through the wipe and
// the 36 months of test data (whose own counters are kept as they come), so
// there are 3,266 counters where S76 had 3,258. Every step, the screen and
// every other record count is still S76's.
const S76 = 'S76-load-36-month-test-data.spec.ts';

test('S133 ระบบใหม่: ล้างข้อมูลแล้วโหลดข้อมูลทดสอบ 36 เดือน ตัวนับเลขที่เดิมของร้านยังอยู่', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S76, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');
  const counters = (await app.state()).DB.seq;

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await golden.step('เมนู 10 ล้างข้อมูลทั้งหมด');

  await page.getByRole('button', { name: 'โหลดข้อมูลทดสอบ 36 เดือน' }).click();
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible();
  await golden.step('กดโหลดข้อมูลทดสอบ 36 เดือน');
  await golden.counts('after-36-months', { 'DB.seq': '{3266 keys}' });
  const seq = (await app.state()).DB.seq;
  for (const [base, last] of Object.entries(counters)) expect(seq[base], base).toBeGreaterThanOrEqual(last as number);
  await golden.screen('home-36-months');
  golden.done();
});
