import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';

test.use({ dataset: 'prox-trial' });

// Replaces S125 in the new system (tests/intentional-changes.json, task 3.6, decision R11 = ก,
// finding 64): taking in the shipment from the chain's central warehouse records a stock move
// and a FIFO lot for each item at the register cost — EN-501 12 at 95 (the shop's register
// cost), the new DC-OF21 6 at 105 (the chain's cost it is created with). The legacy app only
// added the quantity. Since accountant review 4.2 the receiver confirms each cost first (the request's filled in):
// DC-OF21 is confirmed at 108, which its move, its lot and its register cost take. Every step, screen and other data change is S125's (and, task 3.12, the request's audit line).
const S125 = 'S125-prox-online-central-stock-request-receive.spec.ts';

test('S162 ระบบใหม่: ProX ออนไลน์รับของจากคลังกลางของเครือเข้าสต๊อก คนรับยืนยันทุน ได้ล็อต FIFO และรายการเคลื่อนไหวตามทุนที่ยืนยัน', async ({ app, page }, testInfo) => {
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
  // Task 3.12 (answer 12.8): the request has an audit line (the legacy app recorded nothing in the shop).
  await golden.stateChange('request', before, { 'DB.audit': { added: [{ id: '@DB.audit[DC-502]', ts: '2026-10-13T02:00:00.000Z', user: '',
    userName: 'เจ้าของกิจการ / ผู้ดูแลระบบ', kind: 'stock', docId: '', no: 'DC-502', act: 'save',
    note: 'ขอเติมสต๊อกจากคลังกลาง ProX · คำขอ #502 · DC-OF21 × 10 ชิ้น' }] } });

  before = await app.state();
  // "ยังไม่รับ": nothing is received, here or at the chain.
  await page.getByRole('button', { name: '📦 รับของเข้าสต๊อก (07)' }).click();
  await page.locator('#mAsk').getByRole('button', { name: 'ยังไม่รับ' }).click();
  await app.settle();
  expect(JSON.parse(formatDiff(stateDiff(before, await app.state())))).toEqual({});
  expect(chain.state.requests.find(r => r.id === 501)?.status).toBe('shipped');
  await page.getByRole('button', { name: '📦 รับของเข้าสต๊อก (07)' }).click();
  // Accountant review 4.2 (the owner's decision of 2026-10-29): until there is a real chain server the receiver
  // confirms each item's cost, the request's cost filled in; DC-OF21 is confirmed at 108.
  const ask = page.locator('#mAsk');
  await expect(ask.getByText('ยืนยันทุนของที่รับจากคลังกลาง · คำขอ #501', { exact: true })).toBeVisible();
  await expect(ask.getByRole('row').nth(1).getByRole('cell')).toHaveText(['EN-501', 'กรองน้ำมันเครื่อง Toyota', '12 ชิ้น', '']);
  await expect(ask.getByRole('spinbutton', { name: 'ทุนต่อหน่วย EN-501' })).toHaveValue('95');
  await expect(ask.getByRole('spinbutton', { name: 'ทุนต่อหน่วย DC-OF21' })).toHaveValue('105');
  await ask.getByRole('spinbutton', { name: 'ทุนต่อหน่วย DC-OF21' }).fill('108');
  await ask.getByRole('button', { name: 'รับของเข้าสต๊อก' }).click();
  await stockSynced(page);
  await expect(page.getByText('✓ รับเข้าสต๊อกแล้ว').first()).toBeVisible();
  await golden.step('รับของคำขอ #501 เข้าสต๊อก');
  const move = (code: string, qty: number, cost: number) => ({ id: expect.stringMatching(/^@DB\.moves\[/), stockId: `@DB.stock[${code}]`, type: 'in', qty,
    date: '2026-10-13', ref: 'รับของจากคลังกลาง ProX · คำขอ #501', refNo: 'DC-501', vendorId: '', cost, br: '@DB.branches[MA]' });
  const lot = (code: string, qty: number, cost: number) => ({ id: expect.stringMatching(/^@DB\.fifo\.lots\[/), seq: expect.any(Number), br: '@DB.branches[MA]',
    stockId: `@DB.stock[${code}]`, date: '2026-10-13', ref: 'รับของจากคลังกลาง ProX · คำขอ #501', refNo: 'DC-501', vendorId: '', src: 'in',
    cost, qty, left: qty, exp: '', mfg: '', expSrc: '', lotNo: '' });
  // S125's data change with the costs confirmed (the new item is created at 108 too) and the history of the confirmation.
  const legacy = JSON.parse(legacyStateChange(S125, 'receive'));
  const stock = legacy['DB.stock'];
  stock.added[0].cost = 108;
  const audit = legacy['DB.audit'];
  audit.added.unshift({ id: '@DB.audit[DC-501]', ts: '2026-10-13T02:00:00.000Z', user: '', userName: 'เจ้าของกิจการ / ผู้ดูแลระบบ', kind: 'stock',
    docId: '', no: 'DC-501', act: 'save', note: 'ยืนยันทุนรับของจากคลังกลาง ProX · คำขอ #501 · EN-501 × 12 ทุน 95.00, DC-OF21 × 6 ทุน 108.00' });
  await golden.stateChange('receive', before, {
    'DB.moves': { added: [move('EN-501', 12, 95), move('DC-OF21', 6, 108)] },
    'DB.fifo.lots': { added: [lot('EN-501', 12, 95), lot('DC-OF21', 6, 108)] },
    'DB.stock': stock, 'DB.audit': audit,
  });
  await golden.screen('after-receive');
  expect(chain.state.requests.map(r => [r.id, r.status])).toEqual([[502, 'requested'], [501, 'received'], [500, 'received']]);

  // "ดูยอดที่เมนู 07 แท็บแรก", as the message says.
  await page.getByRole('button', { name: '└ ทะเบียนอะไหล่', exact: true }).click();
  await golden.step('แท็บทะเบียนอะไหล่');
  // The register's total cost is 6 × 3 more than S125's (937,180.00): checked here, masked in the screen.
  const total = page.locator('#invSum').getByText('มูลค่ารวมสินค้าคงคลัง (ราคาทุน)', { exact: true }).locator('xpath=following-sibling::div[1]');
  await expect(total).toHaveText('937,198.00 บาท');
  await golden.screen('stock-after-receive', { mask: [total] });
  golden.done();
});
