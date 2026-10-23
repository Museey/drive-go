import { test, expect } from '../support/test';
import { legacyGolden, type Numbers } from '../support/legacy-golden';

test.use({ dataset: 'prox-trial' });

// Replaces S81 in the new system (tests/intentional-changes.json, task 3.2):
// quotations opened from reported symptoms take their numbers from the
// shop's quotation counter (MA-QT261000005, MA-QT261000006), not from their
// own count of the day (QO.69-10-13-01, -02). Every step, message, data
// change and screen is still S81's with those numbers; the counter moves as well.
const S81 = 'S81-quotation-from-symptom-report.spec.ts';
const NUMBERS: Numbers = [['QO.69-10-13-01', 'MA-QT261000005'], ['QO.69-10-13-02', 'MA-QT261000006']];

test('S128 ระบบใหม่: เปิดใบเสนอราคาอัตโนมัติจากอาการเสีย 2 ใบ ได้เลขที่แบบเดียวกับใบเสนอราคาอื่น (MA-QT) จากตัวนับของร้าน', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S81, { app, page, testInfo }, { numbers: NUMBERS });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await golden.step('เมนู P1 คิวจองจาก BOOK');

  let before = await app.state();
  await page.getByRole('button', { name: '▶ จำลองแจ้งอาการ' }).click();
  const simRow = page.getByRole('row', { name: /9กบ 1577/ });
  await simRow.waitFor();
  await golden.step('หลังกดจำลองแจ้งอาการ');
  await golden.stateChange('sim-inquiry', before);
  await golden.screen('inquiries-with-new-report');

  before = await app.state();
  await simRow.getByRole('button', { name: 'เปิดใบเสนอราคาอัตโนมัติ' }).click();
  await simRow.getByRole('button', { name: 'ดูเมนู 03 ›' }).waitFor();
  await golden.step('หลังเปิดใบเสนอราคาจากอาการของ 9กบ 1577');
  await golden.stateChange('quote-from-sim-inquiry', before, { 'DB.seq.MA-QT2610': [4, 5] });

  const fixtureRow = page.getByRole('row', { name: /2ขค 1846/ });
  before = await app.state();
  await fixtureRow.getByRole('button', { name: 'เปิดใบเสนอราคาอัตโนมัติ' }).click();
  await fixtureRow.getByRole('button', { name: 'ดูเมนู 03 ›' }).waitFor();
  await golden.step('หลังเปิดใบเสนอราคาจากอาการของ 2ขค 1846');
  await golden.stateChange('quote-from-fixture-inquiry', before, { 'DB.seq.MA-QT2610': [5, 6] });
  await expect(simRow.getByText('ออก MA-QT261000005', { exact: true })).toBeVisible();
  await expect(fixtureRow.getByText('ออก MA-QT261000006', { exact: true })).toBeVisible();
  await golden.screen('inquiries-after-quotes', { mask: [page.getByText(/^ออก MA-QT26100000[56]$/)] });

  await simRow.getByRole('button', { name: 'ดูเมนู 03 ›' }).click();
  await golden.step('กดดูเมนู 03');

  await page.getByText('MA-QT261000005', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบเสนอราคา MA-QT261000005');
  const badge = page.getByText('เลขที่ MA-QT261000005 · ร่าง', { exact: true });
  await expect(badge).toBeVisible();
  await golden.screen('quotation-from-inquiry', { mask: [badge] });
  golden.done();
});
