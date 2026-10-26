import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S57 in the new system (tests/intentional-changes.json, task 3.7, the owner's answer of
// 2026-10-25 "เฉพาะงวดที่บันทึก"): the chart's balances no longer hold the payroll estimated from the
// staff list — cash 1010 is 935,644 (legacy 1,598,856 on the other side), 6010 / 6011 / 2060 are
// empty until a payroll period is recorded. Those balances are left out of the screens and checked
// here; every step, the rest of each screen and every data change are S57's.
const S57 = 'S57-chart-of-accounts-delete-reset.spec.ts';

test('S170 ระบบใหม่: ผังบัญชี ลบบัญชี 6032 แล้วคืนค่าผังบัญชีมาตรฐาน ยอดคงเหลือไม่มีเงินเดือนประมาณการ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S57, { app, page, testInfo });
  const bal = (code: string) => page.getByRole('row').filter({ has: page.getByRole('cell', { name: code, exact: true }) }).getByRole('cell').nth(3);
  // Task 3.13 (R17, answers 13.1, 13.7): depreciation by the day moves the accumulated depreciation (1221–1281) and
  // the year's 6130; the input VAT of the asset bought in 2569 (the POS computer, 2,240.00) is in 1050.
  const ASSETS: [string, string][] = [['1050', '2,240.00'], ['1221', '274,187.82'], ['1231', '58,569.84'], ['1261', '19,553.63'],
    ['1271', '7,714.83'], ['1281', '41,187.98'], ['6130', '164,913.43']];
  const payroll = () => ['1010', '2060', '6010', '6011', ...ASSETS.map(([c]) => c)].map(bal);
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
  await expect(bal('1010')).toContainText('935,644');
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
