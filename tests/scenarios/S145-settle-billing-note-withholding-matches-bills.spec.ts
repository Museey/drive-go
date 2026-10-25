import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S25 in the new system (tests/intentional-changes.json, task 3.4,
// decision R7 "แก้ข้อ 4"): in the settle window the withholding table's
// "คงค้าง" of MA-SA261000008 is the bill table's (2,683.50 after the 45.00
// withheld; the legacy app showed 2,728.50 there), and the audit line of that
// payment names the withholding. Since task 3.5 the audit lines also name the
// receipts and each bill's payment holds only its own share of the cash. Every
// other step, message, screen and data change is S25's.
const S25 = 'S25-settle-billing-note-with-withholding.spec.ts';

test('S145 ระบบใหม่: รับชำระตามใบวางบิลด้วยเงินสด ลูกค้าหัก ณ ที่จ่าย ตารางหัก ณ ที่จ่ายแสดงยอดคงค้างเท่ากับตารางบิล และบันทึกการแก้ไขบอกยอดหัก', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S25, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('ใบเสร็จรับเงิน / ใบกำกับภาษี', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: '4.5 ใบวางบิล' }).click();
  await golden.step('4.5 ใบวางบิล');

  await page.getByRole('row').filter({ hasText: 'MA-BL261000001' }).filter({ visible: true })
    .getByRole('button', { name: 'ไปหน้าตัดชำระลูกหนี้' }).click();
  await page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000008' }).waitFor();
  await golden.step('หน้าตัดชำระลูกหนี้ของใบวางบิล MA-BL261000001');

  await page.getByRole('button', { name: 'เงินสดเต็มจำนวน' }).filter({ visible: true }).click();
  await page.getByRole('radio', { name: 'แยกใบเสร็จตามบิล' }).check();
  await page.getByText('รับชำระ ฿3,304.10 · ตัดครบ 2 ใบ').filter({ visible: true }).waitFor();
  await page.getByRole('button', { name: 'ยังไม่ได้รับ — ตามทีหลัง' }).scrollIntoViewIfNeeded();
  await golden.step('เงินสดเต็มจำนวน 3,304.10 แยกใบเสร็จตามบิล');
  // The withholding table's "คงค้าง" is what the bill table shows.
  const whtRow = page.getByRole('row').filter({ has: page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000008' }) });
  await expect(whtRow.getByRole('cell').nth(1)).toHaveText('2,683.50');
  await expect(page.getByRole('row').filter({ hasText: 'MA-SA261000008' }).filter({ hasText: '07/11/2569' })).toContainText('2,683.50');
  await expect(page.getByRole('row').filter({ has: page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000007' }) })
    .getByRole('cell').nth(1)).toHaveText('620.60');
  await golden.screen('settle-billing', { mask: [whtRow.getByRole('cell').nth(1)] });

  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  const confirm = page.getByRole('button', { name: 'ยืนยันบันทึกรับชำระ ฿3,304.10' });
  await confirm.waitFor();
  await golden.step('ตรวจก่อนบันทึก');

  const before = await app.state();
  await confirm.click();
  await expect(confirm).toBeHidden();
  await golden.step('หลังยืนยันบันทึกรับชำระ');
  const legacy = JSON.parse(legacyStateChange(S25, 'settle-billing-note'));
  expect(legacy['DB.audit'].added[1].no).toBe('MA-SA261000008');
  legacy['DB.audit'].added[1].note = 'รับชำระ 2,683.50 บาท (เงินสด) · ลูกค้าหัก ณ ที่จ่าย 45.00 บาท · ใบเสร็จ MA-RE261000005 · ชำระครบแล้ว';
  // Task 3.5 (R2, R8-ข): each audit line names its receipt, and with separate receipts each bill's payment holds only its own
  // share of the cash (the legacy app put the whole 3,304.10 on both, so each receipt printed "เงินสด 3,304.10").
  legacy['DB.audit'].added[0].note = 'รับชำระ 620.60 บาท (เงินสด) · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว';
  const p7 = legacy['DB.receipts[MA-SA261000007].payments'], p8 = legacy['DB.receipts[MA-SA261000008].payments'];
  p7.added[0].methods = [{ k: 'cash', amt: 620.6 }];
  p8.added[0].methods = [{ k: 'cash', amt: 2683.5 }];
  await golden.stateChange('settle-billing-note', before, { 'DB.audit': legacy['DB.audit'],
    'DB.receipts[MA-SA261000007].payments': p7, 'DB.receipts[MA-SA261000008].payments': p8,
    'DB.stockCuts[MA-SA261000007].pay.received': [null, 620.6], 'DB.stockCuts[MA-SA261000008].pay.received': [null, 2683.5] });

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('row').filter({ hasText: 'MA-BL261000001' }).filter({ visible: true })
    .getByText('รับชำระแล้ว').waitFor();
  await golden.step('กลับรายการใบวางบิล');
  await golden.screen('billing-list-paid');
  golden.done();
});
