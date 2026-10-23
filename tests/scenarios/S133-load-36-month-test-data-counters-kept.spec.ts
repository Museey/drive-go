import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { auditNote, confirmWithShopName } from '../support/whole-data';

// Replaces S76 in the new system (tests/intentional-changes.json, task 3.2,
// decisions A7, F1): the shop's 8 document counters stay through the wipe and
// the 36 months of test data (whose own counters are kept as they come), so
// there are 3,266 counters where S76 had 3,258. Every step, the screen and
// every other record count is still S76's. Wiping and loading the test data
// ask for the shop's name, keep a copy of the data first and are written in
// the audit log (F1); the test data starts its own audit log, so the loading is its last entry.
const S76 = 'S76-load-36-month-test-data.spec.ts';
// Audit entries of S76's test data (after-36-months-counts.json).
const TEST_DATA_AUDIT = 1268;

test('S133 ระบบใหม่: ล้างข้อมูลแล้วโหลดข้อมูลทดสอบ 36 เดือน ตัวนับเลขที่เดิมของร้านยังอยู่', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S76, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');
  const start = (await app.state()).DB, counters = start.seq, shopName = start.shop.name;

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await confirmWithShopName(page, shopName, 'ล้างข้อมูล');
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await golden.step('เมนู 10 ล้างข้อมูลทั้งหมด');

  await page.getByRole('button', { name: 'โหลดข้อมูลทดสอบ 36 เดือน' }).click();
  await confirmWithShopName(page, shopName, 'โหลดข้อมูล');
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible();
  await golden.step('กดโหลดข้อมูลทดสอบ 36 เดือน');
  await golden.counts('after-36-months', { 'DB.audit': TEST_DATA_AUDIT + 1, 'DB.seq': '{3266 keys}' });
  const data = (await app.state()).DB, seq = data.seq;
  expect(data.audit.at(-1)).toMatchObject({ kind: 'data', act: 'demo', note: auditNote('โหลดข้อมูลทดสอบ 36 เดือน') });
  for (const [base, last] of Object.entries(counters)) expect(seq[base], base).toBeGreaterThanOrEqual(last as number);
  await golden.screen('home-36-months');
  golden.done();
});
