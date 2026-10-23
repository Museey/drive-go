import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';
import { legacyGolden, type Numbers } from '../support/legacy-golden';

test.use({ dataset: 'prox-trial' });

// Replaces S88 in the new system (tests/intentional-changes.json, task 3.2):
// the two quotations opened from the same booking take their numbers from the
// shop's quotation counter (MA-QT261000005, MA-QT261000006), not from their
// own count of the day (QO.69-10-13-01, -02). Every step, message, data
// change, screen and confirmation is still S88's with those numbers; the
// counter moves as well.
const S88 = 'S88-reset-prox-demo-data.spec.ts';
const NUMBERS: Numbers = [['QO.69-10-13-01', 'MA-QT261000005'], ['QO.69-10-13-02', 'MA-QT261000006']];

test('S129 ระบบใหม่: รีเซ็ตข้อมูลสาธิต ProX แล้วรับคิวเดิมซ้ำ ใบเสนอราคาทั้งสองใบได้เลขที่แบบเดียวกับใบเสนอราคาอื่น (MA-QT)', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S88, { app, page, testInfo }, { numbers: NUMBERS });
  const confirms: string[] = [];
  page.on('dialog', dialog => { confirms.push(`${dialog.type()}: ${dialog.message()}`); dialog.accept(); });

  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await golden.step('เมนู P1 คิวจองจาก BOOK');

  const row = page.getByRole('row', { name: /8กด 5219/ });
  const accept = row.getByRole('button', { name: 'รับเข้าระบบ → เปิดใบเสนอราคา' });
  let before = await app.state();
  await accept.click();
  await expect(accept).toBeHidden();
  await golden.step('หลังรับคิวจอง 8กด 5219 ครั้งแรก');
  await golden.stateChange('accept-first', before, { 'DB.seq.MA-QT2610': [4, 5] });

  await page.getByRole('button', { name: '▶ จำลอง SOS' }).click();
  await page.getByRole('button', { name: 'คิวจองจาก BOOK' }).click();
  await golden.step('จำลอง SOS เพิ่ม แล้วกลับแท็บคิวจอง');

  before = await app.state();
  await page.getByRole('button', { name: '⟳ รีเซ็ตข้อมูลสาธิต ProX' }).click();
  await expect(accept).toBeVisible();
  await golden.step('หลังกดรีเซ็ตข้อมูลสาธิต ProX และยืนยัน');
  await golden.stateChange('reset', before);
  await golden.screen('queue-after-reset');

  before = await app.state();
  await accept.click();
  await expect(accept).toBeHidden();
  await golden.step('หลังรับคิวจอง 8กด 5219 อีกครั้ง');
  await golden.stateChange('accept-again', before, { 'DB.seq.MA-QT2610': [5, 6] });
  const status = row.getByText('รับเข้าระบบ · MA-QT261000006', { exact: true });
  await expect(status).toBeVisible();
  await golden.screen('queue-after-second-accept', { mask: [status] });

  await row.getByRole('button', { name: 'ดูเมนู 03 ›' }).click();
  await page.getByText('MA-QT261000006', { exact: true }).filter({ visible: true }).scrollIntoViewIfNeeded();
  await golden.step('กดดูเมนู 03 (ใบเสนอราคา 2 ใบจากคิวเดียวกัน)');
  await golden.screen('quotation-list', {
    mask: [page.getByText(/^MA-QT26100000[56]$/).filter({ visible: true })],
  });
  golden.done();

  expect(confirms.join('\n') + '\n').toBe(readFileSync(new URL(`../golden/${S88}/confirm-dialogs.txt`, import.meta.url), 'utf8'));
});
