import { test, expect } from '../support/test';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';
import { HILUX, RANGSIT, bookingRow, jobWithSale, ledgerOf } from '../support/prox-online';

test.use({ dataset: 'prox-trial' });

// Task 3.12 (answers 12.3 and 12.6): the sale of a chain booking is paid at the counter before the chain hears of it.
// "ออกใบเสร็จ" then sends the sale's whole amount, and "รับชำระ" puts the chain's RC-201 on the shop's receipt already
// there (no second payment) and tells the chain. Cancelling that receipt asks for the reason and warns that the chain's
// paid status and Coins are not reversed with it.
test('S203 ระบบใหม่: ProX ออนไลน์ ชำระในร้านก่อน แล้วผูกเลขเครือกับใบเสร็จเดิม ยกเลิกใบเสร็จได้พร้อมคำเตือนเรื่องเครือ', async ({ app, page }) => {
  const chain = await chainServer(page, { accounts: [RANGSIT], queue: [{ id: 201, status: 'wait', ...HILUX }] });
  await app.loginAsOwner();
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await connectToChain(page, 'rangsit', '1234');
  await stockSynced(page);
  await jobWithSale(page, app, 201, 'MA-QT261000005', 'MA-SA261000015');

  // Paid at the counter (menu 04), as any sale.
  await page.getByRole('button', { name: /Mr\.DriveGo/ }).click();
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000015', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'รับชำระ', exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await page.locator('#mSaleRcpt').getByRole('button', { name: 'ปิด', exact: true }).last().click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  const row = bookingRow(page, 201);
  await expect(row.getByRole('textbox', { name: 'ยอดของใบตัดสต็อก MA-SA261000015' })).toHaveValue('1,840.40');
  await row.getByRole('button', { name: '🧾 ออกใบเสร็จ' }).click();
  await expect(row.getByRole('button', { name: '💵 รับชำระ → Coins เครือ' })).toBeVisible();
  expect(chain.state.queue[0]).toMatchObject({ status: 'billed', amount: 1840.4 });

  await row.getByRole('button', { name: '💵 รับชำระ → Coins เครือ' }).click();
  await expect(page.getByText('💰 รับชำระแล้ว → +18 DriveGo Coins เข้าเครือ (ยอดสะสมทะเบียนนี้ 18) — เด้งบนมือถือลูกค้าทันที')).toBeVisible();
  await expect(page.getByRole('button', { name: 'บันทึกรับชำระ' })).toBeHidden();
  await expect(row).toContainText('ใบเสร็จ MA-RE261000004');
  await app.settle();
  let state = await app.state();
  let led = ledgerOf(state, 'MA-SA261000015');
  expect(led.payments).toEqual([expect.objectContaining({ reNo: 'MA-RE261000004', src: 'sale', chainRc: 'RC-201', chainBooking: 201, chainCoins: 18 })]);
  expect(state.DB.px.coined[led.id]).toBe(true);
  expect(state.DB.audit.slice(-2).map((a: any) => a.note)).toEqual([
    'ผูกใบเสร็จ MA-RE261000004 กับใบเสร็จของเครือ DriveGo RC-201 · ใบจอง #201',
    'แจ้งเครือ DriveGo แล้ว · RC-201 · ใบเสร็จ MA-RE261000004 · +18 Coins',
  ]);

  // Cancelling the receipt: the reason is required, and the warning about the chain is shown.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.3 ใบเสร็จรับเงิน' }).click();
  await page.getByText('MA-RE261000004', { exact: true }).filter({ visible: true }).first().click();
  await page.locator('#mSaleRcpt').getByRole('button', { name: 'ยกเลิกการรับชำระ' }).click();
  const ask = page.locator('#mAsk');
  await expect(ask).toContainText('ใบเสร็จ MA-RE261000004 ของใบตัดสต็อก MA-SA261000015 รับผ่านเครือ DriveGo (RC-201) — สถานะจ่ายแล้วและ Coins ฝั่งเครือไม่ถูกยกเลิกตาม · ระบุเหตุผลที่ยกเลิก (จำเป็น)');
  await expect(ask.getByRole('button', { name: 'ยกเลิกการรับชำระ' })).toBeDisabled();
  await ask.getByRole('textbox').fill('ลูกค้าโอนเงินซ้ำ คืนเงินสด');
  await ask.getByRole('button', { name: 'ยกเลิกการรับชำระ' }).click();
  await app.settle();
  state = await app.state();
  led = ledgerOf(state, 'MA-SA261000015');
  expect(led.payments[0]).toMatchObject({ cancelled: true, cancelReason: 'ลูกค้าโอนเงินซ้ำ คืนเงินสด', chainRc: 'RC-201' });
  expect(led.paid).toBe(false);
  expect(chain.state.queue[0].status).toBe('paid');
  expect(chain.state.coins).toEqual({ 'ธร 1085': 18 });
});
