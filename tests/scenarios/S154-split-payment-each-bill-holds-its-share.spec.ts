import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S21 in the new system (tests/intentional-changes.json, task 3.5,
// decisions R2, R8-ข and the owner's answers of 2026-10-25): one receiving of
// cash 5,000.00 + transfer 5,368.30 for two bills still has ONE receipt
// (MA-RE261000004), but each bill's payment keeps only its own share of the
// money — oldest bill first, methods in the order entered: MA-SA261000014
// (310.30) cash 310.30; MA-SA261000004 (10,058.00) cash 4,689.70 + transfer
// 5,368.30 — so the daily report counts cash 5,000.00 and transfer 5,368.30
// once (the legacy app copied the whole receiving onto both bills). The audit
// line of each bill names its receipt. Every other step, screen and data change
// is S21's.
const S21 = 'S21-pay-two-bills-split-cash-transfer.spec.ts';
const BBL = 'ธนาคารกรุงเทพ 789-0-12345-6 (หจก.เอกหม้อน้ำ)';

test('S154 ระบบใหม่: รับชำระ 2 บิลแบ่งจ่ายเงินสดและเงินโอน ใบเสร็จใบเดียว แต่ละบิลเก็บเฉพาะเงินส่วนของตัวเอง รายงานประจำวันไม่นับซ้ำ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S21, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('บัญชี - การเงิน', { exact: true }).filter({ visible: true }).click();
  await page.getByText('ลูกหนี้ (ค้างรับ)', { exact: true }).filter({ visible: true }).click();
  await golden.step('ทะเบียนลูกหนี้');

  await page.getByRole('button', { name: '+ รับชำระเงิน' }).click();
  await golden.step('ป๊อปอัพรับชำระเงินลูกหนี้');

  await page.getByPlaceholder('พิมพ์ชื่อลูกค้า').filter({ visible: true }).fill('วิภา');
  await page.getByRole('button', { name: /^วิภา ศรีสมบูรณ์/ }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-SA261000004' }).waitFor();
  await golden.step('เลือกลูกค้า วิภา ศรีสมบูรณ์');

  await page.getByRole('checkbox', { name: 'เลือก MA-SA261000004' }).check();
  await page.getByRole('checkbox', { name: 'เลือก MA-SA261000014' }).check();
  await page.getByRole('button', { name: 'เงินสด แตะเพื่อเพิ่ม' }).filter({ visible: true }).click();
  await page.getByRole('textbox', { name: 'จำนวนเงินที่รับจริง เงินสด' }).fill('5000');
  await page.getByRole('button', { name: 'โอน แตะเพื่อเพิ่ม' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'บัญชีร้านที่รับโอน' }).selectOption({ label: BBL });
  await page.getByRole('textbox', { name: 'จำนวนเงินที่โอน รายการที่ 1' }).fill('5368.30');
  await page.getByRole('textbox', { name: 'เลขอ้างอิง / เลขที่สลิป' }).fill('BBL-240913');
  await page.getByText('รับชำระ ฿10,368.30 · ตัดครบ 2 ใบ').filter({ visible: true }).waitFor();
  await golden.step('ติ๊ก 2 บิล แบ่งจ่ายเงินสด 5,000 + โอน 5,368.30');
  await golden.screen('split-two-bills');

  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  const confirm = page.getByRole('button', { name: 'ยืนยันบันทึกรับชำระ ฿10,368.30' });
  await confirm.waitFor();
  await golden.step('ตรวจก่อนบันทึก');
  await golden.screen('confirm');

  const before = await app.state();
  await confirm.click();
  await expect(confirm).toBeHidden();
  await golden.step('หลังยืนยันบันทึกรับชำระ');
  const legacy = JSON.parse(legacyStateChange(S21, 'pay-two-bills-split'));
  const big = legacy['DB.receipts[MA-SA261000004].payments'], small = legacy['DB.receipts[MA-SA261000014].payments'];
  Object.assign(big.added[0], { methods: [{ k: 'cash', amt: 4689.7 }, { k: 'trans', amt: 5368.3, lines: 1 }] });
  Object.assign(small.added[0], { method: 'cash', bank: '', ref: '', methods: [{ k: 'cash', amt: 310.3 }], transLines: [] });
  const [a14, a04] = legacy['DB.audit'].added;
  a14.note = 'รับชำระ 310.30 บาท (เงินสด) · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว';
  a04.note = 'รับชำระ 10,058.00 บาท (เงินสด + เงินโอน) · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว';
  await golden.stateChange('pay-two-bills-split', before, {
    'DB.receipts[MA-SA261000004].payments': big, 'DB.receipts[MA-SA261000014].payments': small, 'DB.audit': legacy['DB.audit'],
    'DB.stockCuts[MA-SA261000004].pay': [null, { method: 'trans', methods: ['trans', 'cash'], amount: 10058, received: 4689.7, change: 0 }],
    'DB.stockCuts[MA-SA261000014-R1].pay': [null, { method: 'cash', methods: ['cash'], amount: 310.3, received: 310.3, change: 0 }] });
  golden.done();

  // The shared receipt shows the whole receiving: cash 5,000.00 and the transfer 5,368.30.
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.3 ใบเสร็จรับเงิน' }).click();
  await page.getByText('MA-RE261000004', { exact: true }).filter({ visible: true }).first().click();
  const rcpt = page.locator('#mSaleRcpt');
  await expect(rcpt.getByRole('row', { name: /^เงินสด/ })).toContainText('5,000.00');
  await expect(rcpt.getByRole('row', { name: /^เงินโอน/ })).toContainText('5,368.30');
  await expect(rcpt.getByRole('row', { name: /^ยอดรับครั้งนี้/ })).toContainText('10,368.30');
  await rcpt.getByRole('button', { name: 'ปิด', exact: true }).last().click();

  // The daily report counts each method once. The fixture's own receiving of the day (MA-RE261000003: cash 3,864.80 for two bills,
  // recorded the legacy way on both) is counted once too.
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: 'รายงานประจำวัน' }).click();
  const fig = (label: string) => page.locator('#sdSum2 > div').filter({ has: page.getByText(label, { exact: true }) });
  await expect(fig('รับเงินรวม')).toContainText('14,233.10');
  await expect(fig('เงินสด')).toContainText('8,864.80');
  await expect(fig('เงินโอน')).toContainText('5,368.30');
});
