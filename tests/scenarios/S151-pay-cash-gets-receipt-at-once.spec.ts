import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S01 in the new system (tests/intentional-changes.json, task 3.5,
// decision R2 and the owner's answer of 2026-10-25): money received in the
// sale window has its receipt at once — MA-RE261000004 — and the receipt
// window opens to be printed (the legacy app left the payment without a
// receipt and showed "บันทึกข้อมูลสำเร็จ"). Every other step, screen and data
// change is S01's.
const S01 = 'S01-pay-stock-cut-cash.spec.ts';

test('S151 ระบบใหม่: รับชำระเงินสดเต็มจำนวนในหน้าต่างการขาย ได้ใบเสร็จรับเงิน MA-RE ทันทีและเปิดใบเสร็จให้พิมพ์', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S01, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await golden.step('รายการใบตัดสต็อกที่รอชำระ');
  await golden.screen('unpaid-list');

  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบตัดสต็อก MA-SA261000003');

  await page.getByRole('button', { name: 'รับชำระ', exact: true }).filter({ visible: true }).click();
  await golden.step('หน้ารับชำระ');
  await golden.screen('pay-panel');

  const before = await app.state();
  await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  // The receipt window instead of "บันทึกข้อมูลสำเร็จ".
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await app.settle();
  expect(await app.signature()).toEqual({ page: ['04 ใบเสร็จรับเงิน / ใบกำกับภาษี 1 ›', '4.1 ตัดสต็อกสินค้า'],
    popups: ['ใบตัดสต็อกขายสินค้า MA-SA261000003', 'ใบเสร็จรับเงิน MA-RE261000004'],
    messages: ['รับชำระ 9,913.55 บาท · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว'] });
  golden.skip('หลังบันทึกรับชำระ');
  const legacy = JSON.parse(legacyStateChange(S01, 'pay-cash'));
  const pays = legacy['DB.receipts[MA-SA261000003].payments'];
  pays.added[0].reNo = 'MA-RE261000004';
  legacy['DB.audit'].added[0].note = 'รับชำระ 9,913.55 บาท (เงินสด) · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว';
  await golden.stateChange('pay-cash', before, { 'DB.receipts[MA-SA261000003].payments': pays, 'DB.audit': legacy['DB.audit'], 'DB.seq.MA-RE2610': [3, 4] });
  const rcpt = page.locator('#mSaleRcpt');
  await expect(rcpt.getByRole('row').filter({ hasText: 'เงินสด' })).toContainText('9,913.55');
  await expect(rcpt.getByRole('button', { name: 'พิมพ์ใบเสร็จ (A4)' })).toBeVisible();
  golden.done();
});
