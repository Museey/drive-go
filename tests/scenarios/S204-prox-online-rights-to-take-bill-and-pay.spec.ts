import { test, expect } from '../support/test';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';
import { HILUX, RANGSIT, bookingRow, signInAsEmployee } from '../support/prox-online';

test.use({ dataset: 'prox-trial' });

// Task 3.12 (answer 12.5): EMP009 (ผู้ตรวจสอบภายใน: sees menu P1 and every number, may neither create quotations nor
// record payments) is online but may not take a booking (the right to create a quotation), bill it or take its money
// through the chain ("บันทึกรับชำระจากลูกหนี้"). Nothing reaches the chain and nothing changes in the shop.
test('S204 ระบบใหม่: ProX ออนไลน์ พนักงานที่ไม่มีสิทธิ์สร้างใบเสนอราคาและรับชำระ รับคิว ออกใบเสร็จ รับชำระผ่านเครือไม่ได้', async ({ app, page }) => {
  const chain = await chainServer(page, {
    accounts: [RANGSIT],
    queue: [
      { id: 301, status: 'wait', ...HILUX },
      { id: 302, status: 'accepted', plate: 'กข 1234', car: 'Toyota Yaris', owner: 'คุณสมชาย ใจดี', service: 'เช็กระยะ 10,000 กม.', created_at: '2026-10-13T08:40:00' },
      { id: 303, status: 'billed', plate: 'กข 5678', car: 'Honda City', owner: 'คุณมานี', service: 'เปลี่ยนน้ำมันเครื่อง', created_at: '2026-10-12T15:00:00', rc_no: 'RC-303', amount: 1200 },
    ],
  });
  await app.loginAsOwner();
  await signInAsEmployee(app, page, 'EMP009', '081-888-9900', '99999999');
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await connectToChain(page, 'rangsit', '1234');
  await stockSynced(page);
  await app.settle();
  const before = await app.state();
  const calls = chain.calls.length;

  await bookingRow(page, 301).getByRole('button', { name: 'รับเข้าระบบ → เปิดใบเสนอราคา' }).click();
  await expect(page.getByText(/^บัญชีนี้ไม่มีสิทธิ์ “.*” ใน .*ใบเสนอราคา/)).toBeVisible();
  await bookingRow(page, 302).getByRole('button', { name: '🧾 ออกใบเสร็จ' }).click();
  await expect(page.getByText('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ', { exact: true })).toBeVisible();
  await bookingRow(page, 303).getByRole('button', { name: '💵 รับชำระ → Coins เครือ' }).click();
  await expect(page.getByText('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'บันทึกรับชำระ' })).toBeHidden();

  await app.settle();
  expect(chain.calls.slice(calls).filter(c => !/^GET \/api\/(queue|dc\/)/.test(c) && c !== 'POST /api/stock/report')).toEqual([]);
  expect(chain.state.queue.map(b => b.status)).toEqual(['wait', 'accepted', 'billed']);
  const after = await app.state();
  expect(after.DB.quotes.length).toBe(before.DB.quotes.length);
  expect(after.DB.cust.length).toBe(before.DB.cust.length);
  expect(after.DB.audit.length).toBe(before.DB.audit.length);
});
