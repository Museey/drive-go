import { test, expect } from '../support/test';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';
import { legacyGolden, type Numbers } from '../support/legacy-golden';

test.use({ dataset: 'prox-trial' });

// Replaces S123 in the new system (tests/intentional-changes.json, task 3.2):
// quotations opened from the chain's bookings take their numbers from the
// shop's quotation counter (MA-QT261000005, MA-QT261000006), not from their
// own count of the day (QO.69-10-13-01, -02). Every step, message, data
// change and screen is still S123's with those numbers; the counter moves as well.
const S123 = 'S123-prox-online-accept-chain-bookings.spec.ts';
const NUMBERS: Numbers = [['QO.69-10-13-01', 'MA-QT261000005'], ['QO.69-10-13-02', 'MA-QT261000006']];

test('S130 ระบบใหม่: ProX ออนไลน์ รับคิวจองจากมือถือลูกค้า ใบเสนอราคาได้เลขที่แบบเดียวกับใบเสนอราคาอื่น (MA-QT)', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S123, { app, page, testInfo }, { numbers: NUMBERS });
  const chain = await chainServer(page, {
    accounts: [{ username: 'rangsit', password: '1234', display: 'สาขารังสิต', branch: 'สาขารังสิต' }],
    queue: [
      { id: 101, status: 'wait', plate: 'กข 1234', car: 'Toyota Yaris', owner: 'คุณสมชาย ใจดี', service: 'เช็กระยะ 10,000 กม.', created_at: '2026-10-13T08:30:00' },
      { id: 102, status: 'wait', plate: 'ธร 1085', car: 'Toyota Hilux Revo 2.4', owner: 'ฝ่ายจัดซื้อ คุณวราภรณ์', service: 'เปลี่ยนผ้าเบรกหน้า', created_at: '2026-10-13T08:45:00' },
    ],
  });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await golden.step('เมนู P1 คิวจองจาก BOOK');

  await connectToChain(page, 'rangsit', '0000');
  await expect(page.getByText('✗ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', { exact: true })).toBeVisible();
  await golden.step('เชื่อมต่อด้วยรหัสผ่านผิด');

  let before = await app.state();
  await connectToChain(page, 'rangsit', '1234');
  await expect(page.getByText('🟢 ออนไลน์ · สาขารังสิต', { exact: true })).toBeVisible();
  await stockSynced(page);
  await golden.step('เชื่อมเครือสำเร็จ เห็นคิวจองจากมือถือลูกค้า');
  await golden.stateChange('connect', before);
  await golden.screen('online-queue');

  const newCustomer = page.getByRole('row').filter({ hasText: '#101' });
  before = await app.state();
  await newCustomer.getByRole('button', { name: 'รับเข้าระบบ → เปิดใบเสนอราคา' }).click();
  await expect(newCustomer.getByText('รับแล้ว', { exact: true })).toBeVisible();
  await golden.step('รับคิว #101 ของลูกค้าใหม่');
  await golden.stateChange('accept-new-customer', before, { 'DB.seq.MA-QT2610': [4, 5] });

  const existing = page.getByRole('row').filter({ hasText: '#102' });
  before = await app.state();
  await existing.getByRole('button', { name: 'รับเข้าระบบ → เปิดใบเสนอราคา' }).click();
  await expect(existing.getByText('รับแล้ว', { exact: true })).toBeVisible();
  await golden.step('รับคิว #102 ของลูกค้าเดิม');
  await golden.stateChange('accept-existing-customer', before, { 'DB.seq.MA-QT2610': [5, 6] });
  await golden.screen('queue-after-accept');
  expect(chain.calls.filter(c => c.startsWith('POST /api/accept/'))).toEqual(['POST /api/accept/101', 'POST /api/accept/102']);

  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await golden.step('เมนู 03 ใบเสนอราคา');
  await page.getByText('MA-QT261000006', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบเสนอราคาของคิว #102');
  const badge = page.getByText('เลขที่ MA-QT261000006 · ร่าง', { exact: true });
  await expect(badge).toBeVisible();
  await golden.screen('quotation-for-existing-customer', { mask: [badge] });
  golden.done();
});
