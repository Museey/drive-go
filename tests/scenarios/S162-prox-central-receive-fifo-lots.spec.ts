import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';

test.use({ dataset: 'prox-trial' });

// Replaces S125 in the new system (tests/intentional-changes.json, task 3.6, decision R11 = ก,
// finding 64): taking in the shipment from the chain's central warehouse records a stock move
// and a FIFO lot for each item at the register cost — EN-501 12 at 95 (the shop's register
// cost), the new DC-OF21 6 at 105 (the chain's cost it is created with). The legacy app only
// added the quantity. Every step, screen and other data change is S125's.
const S125 = 'S125-prox-online-central-stock-request-receive.spec.ts';

test('S162 ระบบใหม่: ProX ออนไลน์รับของจากคลังกลางของเครือเข้าสต๊อก ได้ล็อต FIFO และรายการเคลื่อนไหวตามทุนในทะเบียน', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S125, { app, page, testInfo });
  const toyota = { product_id: 11, code: 'EN-501', name: 'กรองน้ำมันเครื่อง Toyota', unit: 'ชิ้น', cost: 95 };
  const honda = { product_id: 12, code: 'DC-OF21', name: 'กรองน้ำมันเครื่อง Honda', unit: 'ชิ้น', cost: 105 };
  const chain = await chainServer(page, {
    accounts: [{ username: 'rangsit', password: '1234', display: 'สาขารังสิต', branch: 'สาขารังสิต' }],
    products: [
      { id: 11, code: 'EN-501', oem: '90915-YZZE1', name: 'กรองน้ำมันเครื่อง Toyota', cat: 'ไส้กรอง', unit: 'ชิ้น', cost: 95, price: 180, stock_hq: 240 },
      { id: 12, code: 'DC-OF21', oem: '15400-RTA-003', name: 'กรองน้ำมันเครื่อง Honda', cat: 'ไส้กรอง', unit: 'ชิ้น', cost: 105, price: 190, stock_hq: 120 },
    ],
    requests: [
      { id: 501, status: 'shipped', created_at: '2026-10-12T10:15:00', note: 'เติมกรองน้ำมันเครื่อง', items: [{ ...toyota, qty: 12 }, { ...honda, qty: 6 }] },
      { id: 500, status: 'received', created_at: '2026-10-05T09:00:00', note: '', items: [{ ...toyota, qty: 10 }] },
    ],
  });
  await app.loginAsOwner();
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await connectToChain(page, 'rangsit', '1234');
  await stockSynced(page);
  await golden.step('เชื่อมเครือสำเร็จ');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: '★ คลังกลาง ProX' }).click();
  await expect(page.getByRole('button', { name: '📦 รับของเข้าสต๊อก (07)' })).toBeVisible();
  await golden.step('แท็บคลังกลาง ProX ขณะออนไลน์');
  await golden.screen('central-stock-online');

  const hondaRow = page.getByRole('row').filter({ hasText: 'DC-OF21' }).filter({ has: page.getByRole('button', { name: '🚚 ขอเติม' }) });
  await hondaRow.getByRole('button', { name: '🚚 ขอเติม' }).click();
  await golden.step('กดขอเติมโดยยังไม่ใส่จำนวน');

  let before = await app.state();
  await chain.nextPoll('/api/dc/requests');
  await hondaRow.getByPlaceholder('จำนวน').fill('10');
  await hondaRow.getByRole('button', { name: '🚚 ขอเติม' }).click();
  await expect(page.getByText('#502', { exact: true })).toBeVisible();
  await golden.step('ส่งคำขอเติม DC-OF21 10 ชิ้น');
  await golden.stateChange('request', before);

  before = await app.state();
  await page.getByRole('button', { name: '📦 รับของเข้าสต๊อก (07)' }).click();
  await stockSynced(page);
  await expect(page.getByText('✓ รับเข้าสต๊อกแล้ว').first()).toBeVisible();
  await golden.step('รับของคำขอ #501 เข้าสต๊อก');
  const move = (code: string, qty: number, cost: number) => ({ id: expect.stringMatching(/^@DB\.moves\[/), stockId: `@DB.stock[${code}]`, type: 'in', qty,
    date: '2026-10-13', ref: 'รับของจากคลังกลาง ProX · คำขอ #501', refNo: 'DC-501', vendorId: '', cost, br: '@DB.branches[MA]' });
  const lot = (code: string, qty: number, cost: number) => ({ id: expect.stringMatching(/^@DB\.fifo\.lots\[/), seq: expect.any(Number), br: '@DB.branches[MA]',
    stockId: `@DB.stock[${code}]`, date: '2026-10-13', ref: 'รับของจากคลังกลาง ProX · คำขอ #501', refNo: 'DC-501', vendorId: '', src: 'in',
    cost, qty, left: qty, exp: '', mfg: '', expSrc: '', lotNo: '' });
  await golden.stateChange('receive', before, {
    'DB.moves': { added: [move('EN-501', 12, 95), move('DC-OF21', 6, 105)] },
    'DB.fifo.lots': { added: [lot('EN-501', 12, 95), lot('DC-OF21', 6, 105)] },
  });
  await golden.screen('after-receive');
  expect(chain.state.requests.map(r => [r.id, r.status])).toEqual([[502, 'requested'], [501, 'received'], [500, 'received']]);

  // "ดูยอดที่เมนู 07 แท็บแรก", as the message says.
  await page.getByRole('button', { name: '└ ทะเบียนอะไหล่', exact: true }).click();
  await golden.step('แท็บทะเบียนอะไหล่');
  await golden.screen('stock-after-receive');
  golden.done();
});
