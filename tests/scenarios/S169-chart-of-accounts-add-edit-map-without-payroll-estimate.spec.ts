import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S56 in the new system (tests/intentional-changes.json, task 3.7, the owner's answer of
// 2026-10-25 "เฉพาะงวดที่บันทึก"): the chart's balances no longer hold the payroll estimated from the
// staff list — cash 1010 is 935,644 (legacy 1,598,856 on the other side), 6010 / 6011 / 2060 are
// empty until a payroll period is recorded. Those balances are left out of the screens and checked
// here; every step, the rest of each screen and every data change are S56's.
const S56 = 'S56-chart-of-accounts-add-edit-map.spec.ts';

test('S169 ระบบใหม่: ผังบัญชี เพิ่มบัญชี 6140 แก้ชื่อ แล้วผูกหมวดค่าโทรศัพท์ ยอดคงเหลือไม่มีเงินเดือนประมาณการ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S56, { app, page, testInfo });
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
  await golden.step('หน้าผังบัญชี 56 บัญชี');

  // The app asks with its own pop-up and a text box under the question (instead of the browser's prompt).
  const answer = (question: string) => page.getByText(question, { exact: true }).locator('..').getByRole('textbox');
  let before = await app.state();
  await page.getByRole('button', { name: '+ เพิ่มบัญชี' }).click();
  await answer('รหัสบัญชีใหม่ (เช่น 6140)').fill('6140');
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  await answer('ชื่อบัญชี').fill('ค่าบริการซอฟต์แวร์');
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  // The last question wants the type typed in English; it starts as "expense".
  await expect(answer('หมวดบัญชี: asset / liab / equity / revenue / cogs / expense')).toHaveValue('expense');
  await golden.step('กด + เพิ่มบัญชี กรอกรหัส 6140 ชื่อบัญชี แล้วถึงคำถามหมวดบัญชี');
  await expect(bal('1010')).toContainText('935,644');
  for (const code of ['2060', '6010', '6011']) await expect(bal(code)).toHaveText('-');
  for (const [code, v] of ASSETS) await expect(bal(code)).toHaveText(v);
  await golden.screen('ask-account-type', { mask: payroll() });
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  const row = page.getByRole('row').filter({ hasText: '6140' }).filter({ visible: true });
  await expect(row).toContainText('ค่าบริการซอฟต์แวร์');
  await expect(page.getByText('57 บัญชี', { exact: true })).toBeVisible();
  await golden.step('หลังเพิ่มบัญชี 6140');
  await golden.stateChange('add-account', before);

  before = await app.state();
  await row.getByRole('button', { name: 'แก้ไข' }).click();
  const name = answer('ชื่อบัญชีของรหัส 6140');
  await expect(name).toHaveValue('ค่าบริการซอฟต์แวร์');
  await name.fill('ค่าบริการซอฟต์แวร์และระบบออนไลน์');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(row).toContainText('ค่าบริการซอฟต์แวร์และระบบออนไลน์');
  await golden.step('แก้ชื่อบัญชี 6140');
  await golden.stateChange('edit-account', before);

  // A select's accessible name also contains its options (account names), so it is matched by the start of the label.
  const phone = page.getByLabel(/^ค่าโทรศัพท์และอินเทอร์เน็ต/).filter({ visible: true });
  await phone.selectOption('6140');
  await phone.scrollIntoViewIfNeeded();
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึกการผูกบัญชี' }).click();
  await golden.step('ผูกหมวด "ค่าโทรศัพท์และอินเทอร์เน็ต" กับบัญชี 6140 แล้วกดบันทึกการผูกบัญชี');
  await golden.stateChange('save-mapping', before);
  await golden.screen('mapping-saved', { mask: payroll() });
  golden.done();
});
