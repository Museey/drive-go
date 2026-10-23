import { test, expect } from '../support/test';
import { legacyGolden, type Numbers } from '../support/legacy-golden';

test.use({ dataset: 'prox-trial' });

// Replaces S80 in the new system (tests/intentional-changes.json, task 3.2):
// a quotation opened from a BOOK booking takes its number from the shop's
// quotation counter, like every other quotation (MA-QT261000005), not from its
// own count of the day (QO.69-10-13-01), so the server issues it. Every step,
// message, data change and screen is still S80's with that number; the
// counter moves as well.
const S80 = 'S80-accept-book-queue-to-quotation.spec.ts';
const NUMBERS: Numbers = [['QO.69-10-13-01', 'MA-QT261000005']];

test('S127 ระบบใหม่: รับคิวจองจากแอป BOOK แล้วใบเสนอราคาร่างได้เลขที่แบบเดียวกับใบเสนอราคาอื่น (MA-QT) จากตัวนับของร้าน', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S80, { app, page, testInfo }, { numbers: NUMBERS });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await golden.step('เมนู P1 คิวจองจาก BOOK');

  let before = await app.state();
  await page.getByRole('button', { name: '▶ จำลองลูกค้าจองผ่าน BOOK' }).click();
  const row = page.getByRole('row', { name: /3กท 1731/ });
  await row.waitFor();
  await golden.step('หลังกดจำลองลูกค้าจองผ่าน BOOK');
  await golden.stateChange('sim-book', before);
  await golden.screen('queue-with-new-booking');

  before = await app.state();
  await row.getByRole('button', { name: 'รับเข้าระบบ → เปิดใบเสนอราคา' }).click();
  await row.getByRole('button', { name: 'ดูเมนู 03 ›' }).waitFor();
  await golden.step('หลังกดรับเข้าระบบ → เปิดใบเสนอราคา');
  await golden.stateChange('accept-book', before, { 'DB.seq.MA-QT2610': [4, 5] });
  const status = row.getByText('รับเข้าระบบ · MA-QT261000005', { exact: true });
  await expect(status).toBeVisible();
  await golden.screen('queue-after-accept', { mask: [status] });

  await row.getByRole('button', { name: 'ดูเมนู 03 ›' }).click();
  await golden.step('กดดูเมนู 03');

  await page.getByText('MA-QT261000005', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบเสนอราคา MA-QT261000005');
  const badge = page.getByText('เลขที่ MA-QT261000005 · ร่าง', { exact: true });
  await expect(badge).toBeVisible();
  await golden.screen('quotation-from-booking', { mask: [badge] });
  golden.done();
});
