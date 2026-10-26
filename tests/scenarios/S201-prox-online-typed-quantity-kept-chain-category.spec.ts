import { test, expect } from '../support/test';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';
import { RANGSIT } from '../support/prox-online';

test.use({ dataset: 'prox-trial' });

// Task 3.12 (answer 12.8, findings 64 and 65): while online the central warehouse's table is reloaded from the chain
// every 7 seconds (kept); a quantity being typed stays, in the box it was typed in and with the cursor still there
// (the legacy app emptied it). Asking for stock writes an audit line (the legacy app recorded nothing in the shop) and
// empties only the box of the item asked for. A new item received from the central warehouse gets the chain
// catalogue's category (the legacy app: always "ไส้กรอง").
test('S201 ระบบใหม่: ProX ออนไลน์ จำนวนที่กำลังพิมพ์ไม่หายเมื่อตารางคลังกลางโหลดใหม่ ขอเติมมีประวัติ สินค้าใหม่ได้หมวดตามเครือ', async ({ app, page }) => {
  const atf = { product_id: 31, code: 'DC-AT40', name: 'น้ำมันเกียร์อัตโนมัติ ATF 4 ลิตร', unit: 'แกลลอน', cost: 620 };
  const chain = await chainServer(page, {
    accounts: [RANGSIT],
    products: [
      { id: 11, code: 'EN-501', oem: '90915-YZZE1', name: 'กรองน้ำมันเครื่อง Toyota', cat: 'ไส้กรอง', unit: 'ชิ้น', cost: 95, price: 180, stock_hq: 240 },
      { id: 31, code: 'DC-AT40', oem: '08886-02305', name: atf.name, cat: 'น้ำมันหล่อลื่น', unit: 'แกลลอน', cost: 620, price: 890, stock_hq: 60 },
    ],
    requests: [{ id: 601, status: 'shipped', created_at: '2026-10-12T10:15:00', note: '', items: [{ ...atf, qty: 4 }] }],
  });
  await app.loginAsOwner();
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await connectToChain(page, 'rangsit', '1234');
  await stockSynced(page);
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: '★ คลังกลาง ProX' }).click();
  const row = (code: string) => page.getByRole('row').filter({ hasText: code }).filter({ has: page.getByRole('button', { name: '🚚 ขอเติม' }) });
  const qty = (code: string) => row(code).getByPlaceholder('จำนวน');

  // Typed, then the table is reloaded from the chain: both numbers stay, the cursor stays in the second box.
  await chain.nextPoll('/api/dc/requests');
  await qty('EN-501').fill('3');
  await qty('DC-AT40').fill('7');
  await expect(qty('DC-AT40')).toBeFocused();
  await chain.nextPoll('/api/dc/requests');
  await expect(qty('EN-501')).toHaveValue('3');
  await expect(qty('DC-AT40')).toHaveValue('7');
  await expect(qty('DC-AT40')).toBeFocused();
  await page.keyboard.type('0');
  await expect(qty('DC-AT40')).toHaveValue('70');

  await row('DC-AT40').getByRole('button', { name: '🚚 ขอเติม' }).click();
  await expect(page.getByText('#602', { exact: true })).toBeVisible();
  await expect(page.getByText('🚚 ส่งคำขอเติมสต๊อกถึงศูนย์กระจายสินค้า HQ แล้ว (#602) — รออนุมัติ/จัดส่ง')).toBeVisible();
  expect(chain.state.requests[0]).toMatchObject({ id: 602, status: 'requested', items: [{ code: 'DC-AT40', qty: 70 }] });
  await expect(qty('DC-AT40')).toHaveValue('');
  await expect(qty('EN-501')).toHaveValue('3');
  await app.settle();
  let state = await app.state();
  expect(state.DB.audit.at(-1)).toMatchObject({ kind: 'stock', docId: '', no: 'DC-602', act: 'save',
    note: 'ขอเติมสต๊อกจากคลังกลาง ProX · คำขอ #602 · DC-AT40 × 70 แกลลอน' });

  // The shipment of #601: DC-AT40 is new to the shop.
  await page.getByRole('button', { name: '📦 รับของเข้าสต๊อก (07)' }).click();
  await stockSynced(page);
  await app.settle();
  state = await app.state();
  expect(state.DB.stock.find((s: any) => s.code === 'DC-AT40')).toMatchObject({ name: atf.name, cat: 'น้ำมันหล่อลื่น', unit: 'แกลลอน', qty: 4, cost: 620 });
});
