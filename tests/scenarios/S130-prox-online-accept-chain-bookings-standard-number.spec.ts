import { test, expect } from '../support/test';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';
import { legacyGolden, legacyStateChange, type Numbers } from '../support/legacy-golden';

test.use({ dataset: 'prox-trial' });

// Replaces S123 in the new system (tests/intentional-changes.json, task 3.2):
// quotations opened from the chain's bookings take their numbers from the
// shop's quotation counter (MA-QT261000005, MA-QT261000006), not from their
// own count of the day (QO.69-10-13-01, -02). Every step, message, data
// change and screen is still S123's with those numbers; the counter moves as well.
// Task 3.12 (R18 = ข, finding 62): the quotation of booking #102 is for the booked car, the customer's second one
// (ธร 1085 Hilux Revo, vehIdx 1; the legacy app took the first, ษร 1022) — the car fields are left out of its screen
// and checked here; an accepted booking shows the amount of its job's sale (none yet: "ยังไม่ตัดสต็อก") in the box
// that took a typed amount (answer 12.1) — that box is left out of the queue's screen and checked here.
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
  const legacy = JSON.parse(legacyStateChange(S123, 'accept-existing-customer', NUMBERS));
  legacy['DB.quotes'].added[0].vehIdx = 1;
  await golden.stateChange('accept-existing-customer', before, { 'DB.seq.MA-QT2610': [5, 6], 'DB.quotes': legacy['DB.quotes'] });
  const actions = [newCustomer, existing].map(r => r.getByRole('textbox'));
  for (const r of [newCustomer, existing]) await expect(r.getByRole('spinbutton')).toHaveCount(0);
  for (const a of actions) {
    await expect(a).toHaveAccessibleName('ยอดที่จะส่งเครือ');
    await expect(a).toHaveAttribute('placeholder', 'ยังไม่ตัดสต็อก');
    await expect(a).not.toBeEditable();
  }
  await golden.screen('queue-after-accept', { mask: actions });
  expect(chain.calls.filter(c => c.startsWith('POST /api/accept/'))).toEqual(['POST /api/accept/101', 'POST /api/accept/102']);

  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await golden.step('เมนู 03 ใบเสนอราคา');
  await page.getByText('MA-QT261000006', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบเสนอราคาของคิว #102');
  const badge = page.getByText('เลขที่ MA-QT261000006 · ร่าง', { exact: true });
  await expect(badge).toBeVisible();
  const car = page.getByRole('combobox', { name: 'รถที่รับซ่อม' });
  await expect(car.locator('option:checked')).toContainText('Hilux Revo');
  const carLine = page.getByText(/^ยี่ห้อ .* · ทะเบียน ธร 1085/).filter({ visible: true });
  await expect(carLine).toBeVisible();
  const mile = page.getByRole('textbox', { name: 'เลขไมล์' }).or(page.getByRole('spinbutton', { name: 'เลขไมล์' })).filter({ visible: true });
  await golden.screen('quotation-for-existing-customer', { mask: [badge, car, carLine, mile] });
  golden.done();
});
