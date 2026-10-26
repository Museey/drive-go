import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';
import { HILUX, RANGSIT, bookingRow, jobWithSale, ledgerOf } from '../support/prox-online';

test.use({ dataset: 'prox-trial' });

// Replaces S124 in the new system (tests/intentional-changes.json, task 3.12, decisions R18 = ข, F8 = ก and the
// owner's answers 12.1–12.4 of 2026-10-26, finding 63). The legacy app billed a chain booking with an amount typed
// by hand (whole baht) and recorded nothing in the shop. Here the booking's job is a sale of the shop: "ออกใบเสร็จ"
// sends that sale's outstanding amount (1,840.40, satang kept), "รับชำระ" takes the money with the shop's normal
// payment step and gives the shop's own receipt MA-RE261000004, which keeps the chain's RC-201 as its reference
// (window and print); the chain gives the Coins and the shop's own Coins scan does not give them again.
// Disconnecting is checked against S124's golden.
const S124 = 'S124-prox-online-bill-pay-coins-disconnect.spec.ts';

test('S200 ระบบใหม่: ProX ออนไลน์ งานจากคิวเครือ ออกใบเสร็จด้วยยอดของใบตัดสต็อก รับชำระได้ใบเสร็จของร้านอ้างอิงเลขเครือ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S124, { app, page, testInfo });
  const chain = await chainServer(page, {
    accounts: [RANGSIT],
    queue: [
      { id: 201, status: 'wait', ...HILUX },
      { id: 202, status: 'paid', plate: 'กข 1234', car: 'Toyota Yaris', owner: 'คุณสมชาย ใจดี', service: 'เช็กระยะ 10,000 กม.', created_at: '2026-10-12T14:10:00', rc_no: 'RC-202', amount: 3200 },
    ],
  });
  await app.loginAsOwner();
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await connectToChain(page, 'rangsit', '1234');
  await stockSynced(page);
  // S124's first step, with one booking more waiting (#201): the menu's badge counts it.
  expect(await app.signature()).toEqual({ page: ['P1 DriveGo ProX · Ecosystem 3', 'คิวจองจาก BOOK'], popups: [],
    messages: ['ยินดีต้อนรับ เจ้าของร้านทดสอบ — เจ้าของร้าน ร้านทดสอบ DriveGoProX',
      '🌐 เชื่อมเครือสำเร็จ — สาขารังสิต · คิวจริงจากมือถือลูกค้าจะไหลเข้าตารางสด',
      '📤 ซิงก์สต๊อกขึ้นเซิร์ฟเวอร์แล้ว 52 รายการ — HQ เห็นยอดคงเหลือสาขานี้สด'] });
  golden.skip('เชื่อมเครือสำเร็จ');

  // The job: the booked car's quotation, cut into a sale waiting for payment.
  await jobWithSale(page, app, 201, 'MA-QT261000005', 'MA-SA261000015');
  const row = bookingRow(page, 201);

  // ออกใบเสร็จ: nothing to type, the sale's amount goes to the chain.
  await expect(row.getByRole('spinbutton')).toHaveCount(0);
  await app.signature();
  await row.getByRole('button', { name: '🧾 ออกใบเสร็จ' }).click();
  await expect(row.getByRole('button', { name: '💵 รับชำระ → Coins เครือ' })).toBeVisible();
  await expect(row).toContainText('RC-201 · 1,840.40');
  expect(chain.state.queue[0]).toMatchObject({ status: 'billed', amount: 1840.4, rc_no: 'RC-201' });
  golden.skip('กดออกใบเสร็จโดยยังไม่กรอกยอด');
  golden.skip('ออกใบเสร็จ 1,890 บาท');
  await app.settle();
  let state = await app.state();
  expect(state.DB.audit.at(-1)).toMatchObject({ kind: 'stockcut', no: 'MA-SA261000015', act: 'save',
    note: 'ออกใบเสร็จผ่านเครือ DriveGo · RC-201 · ใบจอง #201 · ยอด 1,840.40 บาท' });
  expect(ledgerOf(state, 'MA-SA261000015').payments).toEqual([]);

  // รับชำระ: the shop's own payment step, the receipt at once, then the chain.
  await row.getByRole('button', { name: '💵 รับชำระ → Coins เครือ' }).click();
  await expect(page.getByText('MA-SA261000015 · ค้าง 1,840.40 บาท')).toBeVisible();
  await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await expect(page.getByText('💰 รับชำระแล้ว → +18 DriveGo Coins เข้าเครือ (ยอดสะสมทะเบียนนี้ 18) — เด้งบนมือถือลูกค้าทันที')).toBeVisible();
  await app.settle();
  expect(chain.state.coins).toEqual({ 'ธร 1085': 18 });
  expect(chain.calls.filter(c => c.startsWith('POST /api/pay/'))).toEqual(['POST /api/pay/201']);
  const rcpt = page.locator('#mSaleRcpt');
  await expect(rcpt.getByText('เลขอ้างอิงของเครือ DriveGo', { exact: true })).toBeVisible();
  await expect(rcpt.getByText('RC-201', { exact: true })).toBeVisible();
  expect(await app.signature()).toEqual({ page: ['P1 DriveGo ProX · Ecosystem 2', 'คิวจองจาก BOOK'],
    popups: ['ใบตัดสต็อกขายสินค้า MA-SA261000015', 'ใบเสร็จรับเงิน MA-RE261000004'],
    messages: ['🧾 ออกใบเสร็จ RC-201 — ลูกค้าเห็นยอดรอชำระบนมือถือ', 'รับชำระ 1,840.40 บาท · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว',
      '💰 รับชำระแล้ว → +18 DriveGo Coins เข้าเครือ (ยอดสะสมทะเบียนนี้ 18) — เด้งบนมือถือลูกค้าทันที'] });
  golden.skip('รับชำระแล้ว ได้ Coins เครือ');

  state = await app.state();
  const led = ledgerOf(state, 'MA-SA261000015');
  expect(led.paid).toBe(true);
  expect(led.payments).toEqual([expect.objectContaining({ amt: 1840.4, method: 'cash', reNo: 'MA-RE261000004', src: 'chain',
    chainRc: 'RC-201', chainBooking: 201, chainCoins: 18 })]);
  expect(state.DB.seq['MA-RE2610']).toBe(4);
  expect(state.DB.px.coined[led.id]).toBe(true);
  expect(state.DB.audit.slice(-3).map((a: any) => [a.no, a.act, a.note])).toEqual([
    ['MA-SA261000015', 'pay', 'รับชำระ 1,840.40 บาท (เงินสด) · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว'],
    ['MA-SA261000015', 'pay', 'รับชำระผ่านเครือ DriveGo · RC-201 · ใบจอง #201 · ใบเสร็จ MA-RE261000004'],
    ['MA-SA261000015', 'pay', 'แจ้งเครือ DriveGo แล้ว · RC-201 · ใบเสร็จ MA-RE261000004 · +18 Coins'],
  ]);

  // The printed receipt (original and copy) carries the chain's number as a reference.
  await rcpt.getByRole('button', { name: 'พิมพ์ใบเสร็จ (A4)' }).click();
  await page.emulateMedia({ media: 'print' });
  for (const t of ['เลขอ้างอิงของเครือ DriveGo', 'RC-201'])
    await expect(page.locator('#printStage').getByText(t, { exact: true })).toHaveCount(2);
  await page.emulateMedia({ media: 'screen' });
  await rcpt.getByRole('button', { name: 'ปิด', exact: true }).last().click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await expect(row).toContainText('RC-201 · +18 Coins');
  await expect(row).toContainText('ใบเสร็จ MA-RE261000004');

  // The shop's own Coins scan (menu P1 "DriveGo Coins") gives this sale none: the chain gave them.
  await page.getByRole('button', { name: 'DriveGo Coins' }).click();
  await page.getByRole('button', { name: '⟳ สแกนใบเสร็จชำระแล้ว → ออก Coins' }).click();
  await app.settle();
  state = await app.state();
  expect(state.DB.px.coins.filter((c: any) => c.rcNo === 'MA-SA261000015' || c.plate === 'ธร 1085')).toEqual([]);

  await page.getByRole('button', { name: 'คิวจองจาก BOOK' }).click();
  await app.settle();
  await app.signature();
  await page.getByRole('button', { name: '🔌 ตัดการเชื่อมต่อ' }).click();
  await expect(page.getByText('ออฟไลน์ — โหมดเดโมในเครื่อง', { exact: true })).toBeVisible();
  await golden.step('ตัดการเชื่อมต่อ กลับโหมดเดโมในเครื่อง');
  golden.done();
});
