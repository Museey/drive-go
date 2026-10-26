import { test, expect } from '../support/test';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';
import { HILUX, RANGSIT, bookingRow, jobWithSale, ledgerOf } from '../support/prox-online';

test.use({ dataset: 'prox-trial' });

// Task 3.12 (answer 12.7): the chain cannot be reached when the money is taken. The shop's receipt is recorded first
// (the money is in the shop's hands), then "ยังไม่ได้แจ้งเครือ ลองใหม่"; the booking's row says the chain has not
// been told (taking only part of the money through the chain is refused). Pressing "รับชำระ" again once the chain is back only tells the chain: no second payment step, no
// second receipt, and the Coins go on the receipt already there.
test('S202 ระบบใหม่: ProX ออนไลน์ ติดต่อเครือไม่ได้ตอนรับชำระ ร้านได้ใบเสร็จก่อน แล้วแจ้งเครือใหม่ได้โดยไม่รับเงินซ้ำ', async ({ app, page }) => {
  const chain = await chainServer(page, { accounts: [RANGSIT], queue: [{ id: 201, status: 'wait', ...HILUX }] });
  await app.loginAsOwner();
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await connectToChain(page, 'rangsit', '1234');
  await stockSynced(page);
  await jobWithSale(page, app, 201, 'MA-QT261000005', 'MA-SA261000015');
  const row = bookingRow(page, 201);
  await row.getByRole('button', { name: '🧾 ออกใบเสร็จ' }).click();
  await expect(row.getByRole('button', { name: '💵 รับชำระ → Coins เครือ' })).toBeVisible();

  chain.state.down = true;
  await row.getByRole('button', { name: '💵 รับชำระ → Coins เครือ' }).click();
  // Part of the money only: the chain would be told the booking is paid, so it is refused.
  await page.getByRole('button', { name: 'โอน แตะเพื่อเพิ่ม' }).click();
  await page.getByLabel('จำนวนเงิน').filter({ visible: true }).fill('1000');
  await page.getByLabel('ธนาคาร / บัญชีที่รับโอน').filter({ visible: true }).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await expect(page.getByText('รับชำระผ่านเครือต้องรับเต็มยอดค้าง 1,840.40 บาท', { exact: true })).toBeVisible();
  await app.settle();
  expect(ledgerOf(await app.state(), 'MA-SA261000015').payments).toEqual([]);
  await page.getByLabel('จำนวนเงิน').filter({ visible: true }).fill('');
  await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await expect(page.getByText('ยังไม่ได้แจ้งเครือ ลองใหม่', { exact: true })).toBeVisible();
  await app.settle();
  let led = ledgerOf(await app.state(), 'MA-SA261000015');
  expect(led.paid).toBe(true);
  expect(led.payments).toEqual([expect.objectContaining({ reNo: 'MA-RE261000004', src: 'chain', chainRc: 'RC-201', chainBooking: 201 })]);
  expect(led.payments[0].chainCoins).toBeUndefined();
  expect(chain.state.coins).toEqual({});
  expect(chain.state.queue[0].status).toBe('billed');

  await page.locator('#mSaleRcpt').getByRole('button', { name: 'ปิด', exact: true }).last().click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await expect(row).toContainText('ใบเสร็จ MA-RE261000004 · ยังไม่ได้แจ้งเครือ');

  // The chain is back: the same button only tells it.
  chain.state.down = false;
  await row.getByRole('button', { name: '💵 รับชำระ → Coins เครือ' }).click();
  await expect(page.getByText('💰 รับชำระแล้ว → +18 DriveGo Coins เข้าเครือ (ยอดสะสมทะเบียนนี้ 18) — เด้งบนมือถือลูกค้าทันที')).toBeVisible();
  await expect(row).toContainText('RC-201 · +18 Coins');
  await expect(page.getByRole('button', { name: 'บันทึกรับชำระ' })).toBeHidden();
  await app.settle();
  const state = await app.state();
  led = ledgerOf(state, 'MA-SA261000015');
  expect(led.payments).toEqual([expect.objectContaining({ reNo: 'MA-RE261000004', chainRc: 'RC-201', chainCoins: 18 })]);
  expect(state.DB.seq['MA-RE2610']).toBe(4);
  expect(chain.state.coins).toEqual({ 'ธร 1085': 18 });
  expect(state.DB.audit.at(-1)).toMatchObject({ no: 'MA-SA261000015', act: 'pay', note: 'แจ้งเครือ DriveGo แล้ว · RC-201 · ใบเสร็จ MA-RE261000004 · +18 Coins' });
});
