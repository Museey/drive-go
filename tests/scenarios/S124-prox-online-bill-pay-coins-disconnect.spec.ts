import { test, expect } from '../support/test';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';

test.use({ dataset: 'prox-trial' });

// ProX online mode with the chain server stood in for (task T13, decision Q4):
// a booking the branch has accepted is billed and paid through the chain,
// which gives the car's plate DriveGo Coins. The garage's own data does not
// change: the receipt number and the payment live on the chain server only.
test('S124 ProX ออนไลน์: ออกใบเสร็จและรับชำระงานจากเครือ (จำลอง) ได้ Coins แล้วตัดการเชื่อมต่อกลับโหมดเดโม', async ({ app, page, golden }) => {
  const chain = await chainServer(page, {
    accounts: [{ username: 'rangsit', password: '1234', display: 'สาขารังสิต', branch: 'สาขารังสิต' }],
    queue: [
      { id: 201, status: 'accepted', plate: 'กข 1234', car: 'Toyota Yaris', owner: 'คุณสมชาย ใจดี', service: 'เช็กระยะ 10,000 กม.', created_at: '2026-10-13T08:30:00' },
      { id: 202, status: 'paid', plate: 'ธร 1085', car: 'Toyota Hilux Revo 2.4', owner: 'ฝ่ายจัดซื้อ คุณวราภรณ์', service: 'เปลี่ยนผ้าเบรกหน้า', created_at: '2026-10-12T14:10:00', rc_no: 'RC-202', amount: 3200 },
    ],
  });
  await app.loginAsOwner();
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await connectToChain(page, 'rangsit', '1234');
  await stockSynced(page);
  await golden.step('เชื่อมเครือสำเร็จ');

  const job = page.getByRole('row').filter({ hasText: '#201' });
  await job.getByRole('button', { name: '🧾 ออกใบเสร็จ' }).click();
  await golden.step('กดออกใบเสร็จโดยยังไม่กรอกยอด');

  const before = await app.state();
  await chain.nextPoll('/api/queue');
  await job.getByPlaceholder('฿ ยอดสุทธิ').fill('1890');
  await job.getByRole('button', { name: '🧾 ออกใบเสร็จ' }).click();
  await expect(job.getByRole('button', { name: '💵 รับชำระ → Coins เครือ' })).toBeVisible();
  await golden.step('ออกใบเสร็จ 1,890 บาท');
  await golden.screen('billed');

  await job.getByRole('button', { name: '💵 รับชำระ → Coins เครือ' }).click();
  await expect(job.getByText('✓ จบงาน', { exact: true })).toBeVisible();
  await golden.step('รับชำระแล้ว ได้ Coins เครือ');
  await golden.stateChange('bill-and-pay', before);
  await golden.screen('paid');
  expect(chain.state.coins).toEqual({ 'กข 1234': 18 });

  await page.getByRole('button', { name: '🔌 ตัดการเชื่อมต่อ' }).click();
  await expect(page.getByText('ออฟไลน์ — โหมดเดโมในเครื่อง', { exact: true })).toBeVisible();
  await golden.step('ตัดการเชื่อมต่อ กลับโหมดเดโมในเครื่อง');
  await golden.screen('offline-again');
});
