import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S57 in the new system (tests/intentional-changes.json, task 3.7, the owner's answer of
// 2026-10-25 "เฉพาะงวดที่บันทึก"): the chart's balances no longer hold the payroll estimated from the
// staff list — cash 1010 has no payroll in it (legacy 1,598,856 on the other side), 6010 / 6011 / 2060 are
// empty until a payroll period is recorded. Those balances are left out of the screens and checked
// here; every step, the rest of each screen and every data change are S57's.
const S57 = 'S57-chart-of-accounts-delete-reset.spec.ts';

test('S170 ระบบใหม่: ผังบัญชี ลบบัญชี 6032 แล้วคืนค่าผังบัญชีมาตรฐาน ยอดคงเหลือไม่มีเงินเดือนประมาณการ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S57, { app, page, testInfo });
  const bal = (code: string) => page.getByRole('row').filter({ has: page.getByRole('cell', { name: code, exact: true }) }).getByRole('cell').nth(3);
  // Task 3.13 (R17, answers 13.1, 13.7): depreciation by the day moves the accumulated depreciation (1221–1281) and
  // the year's 6130.
  // Accountant review 7.2 (the owner's decision of 2026-10-28): the current year counts up to today (13/10/2569),
  // worked out apart from the app's code.
  // J28 (the owner's decisions of 2026-11-11 and 2026-11-12, S293): the capital menu's other income and expenses are in
  // the books — 4030 25,000.00 (scrap metal sold) and 6190 18,000.00 (car park improved).
  const ASSETS: [string, string][] = [['1221', '254,015.89'], ['1231', '49,782.53'], ['1261', '17,735.59'],
    ['1271', '5,406.23'], ['1281', '37,941.45'], ['6130', '128,581.02'], ['4030', '25,000.00'], ['6190', '18,000.00']];
  // The trial balance from the general ledger (the owner's decision of 2026-11-12): money received or paid by transfer, card
  // or cheque is on 1020 (cash 960,625.60; 1020 24,981.60 on the credit side, the trial data having no cash taken to the
  // bank), the VAT of each month that has ended is closed into its return (the POS computer's 2,240.00 is carried on 1055,
  // which the chart does not have, so 1050 is empty), the years before are in 3030 (236,300.67 of loss, on the debit
  // side) and the parts revenue is the sum of the bills (44,385.00; legacy 44,385.33 from the year's discount spread).
  const LEDGER: [string, string][] = [['1010', '960,625.60'], ['1020', '24,981.60'], ['1050', '-'], ['3030', '236,300.67'], ['4010', '44,385.00']];
  const payroll = () => ['2060', '6010', '6011', ...LEDGER.map(([c]) => c), ...ASSETS.map(([c]) => c)].map(bal);
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  await expect(page.getByText('56 บัญชี', { exact: true })).toBeVisible();
  // A select's accessible name also contains its options (account names), so it is matched by the start of the label.
  const phone = page.getByLabel(/^ค่าโทรศัพท์และอินเทอร์เน็ต/).filter({ visible: true });
  await expect(phone).toHaveValue('6032');
  await golden.step('หน้าผังบัญชี หมวดค่าโทรศัพท์และอินเทอร์เน็ตผูกกับบัญชี 6032');

  const row = page.getByRole('row').filter({ hasText: '6032' }).filter({ visible: true });
  await row.scrollIntoViewIfNeeded();
  await row.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('ลบบัญชี 6032 ออกจากผังบัญชี?')).toBeVisible();
  await golden.step('กดลบบัญชี 6032 ระบบถามยืนยัน (ไม่บอกว่ายังผูกกับหมวดค่าใช้จ่าย)');
  for (const [code, v] of LEDGER) await expect(bal(code)).toHaveText(v);
  for (const code of ['2060', '6010', '6011']) await expect(bal(code)).toHaveText('-');
  for (const [code, v] of ASSETS) await expect(bal(code)).toHaveText(v);
  await golden.screen('confirm-delete-account', { mask: payroll() });

  let before = await app.state();
  // The rows of the chart have "ลบ" buttons too: press the one on the confirm card.
  const card = page.locator('div').filter({ hasText: 'ลบบัญชี 6032 ออกจากผังบัญชี?' }).filter({ has: page.getByRole('button', { name: 'ไม่ลบ' }) }).last();
  await card.getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(row).toHaveCount(0);
  await expect(page.getByText('55 บัญชี', { exact: true })).toBeVisible();
  await golden.step('หลังลบบัญชี 6032');
  // Legacy behaviour reported to the owner: the saved mapping still points at the deleted account 6032,
  // while the mapping box can no longer show it.
  await golden.stateChange('delete-account', before);
  await phone.scrollIntoViewIfNeeded();
  await golden.screen('mapping-after-delete', { mask: payroll() });

  await page.getByRole('button', { name: 'คืนค่าผังบัญชีมาตรฐาน' }).click();
  await expect(page.getByText('คืนค่าผังบัญชีและการผูกบัญชีทั้งหมดกลับเป็นมาตรฐานกรมพัฒนาธุรกิจการค้า?')).toBeVisible();
  await golden.step('กดคืนค่าผังบัญชีมาตรฐาน ระบบถามยืนยัน');
  before = await app.state();
  await page.getByRole('button', { name: 'คืนค่า', exact: true }).click();
  await expect(page.getByText('56 บัญชี', { exact: true })).toBeVisible();
  await expect(phone).toHaveValue('6032');
  await golden.step('หลังคืนค่าผังบัญชีมาตรฐาน บัญชี 6032 กลับมา');
  await golden.stateChange('reset-chart', before);
  golden.done();
});
