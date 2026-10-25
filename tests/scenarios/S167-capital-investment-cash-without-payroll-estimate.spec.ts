import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S45 in the new system (tests/intentional-changes.json, task 3.7, the owner's answer of
// 2026-10-25 "เฉพาะงวดที่บันทึก"): cash and equity no longer take off the payroll estimated from the
// staff list (2,534,500 for Jan–Oct 2026, none of it recorded): cash 935,644 (legacy −1,598,856),
// equity 1,885,602, assets 2,325,602; after the investment 1,135,644 / 2,085,602 / 2,525,602.
// Those figures are left out of the screens and checked here; every step, the rest of each screen
// and the data change are S45's.
const S45 = 'S45-record-owner-capital-investment.spec.ts';

test('S167 ระบบใหม่: บันทึกเงินลงทุนเพิ่มโดยเจ้าของ 200,000 บาท เงินสดและส่วนของเจ้าของไม่มีเงินเดือนประมาณการ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S45, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ เงินลงทุน / เงินสด', exact: true }).click();
  await expect(page.getByText('25 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('หน้าเงินลงทุน / เงินสด');
  const figures = async (cash: string, equity: string, assets: string) => {
    const c = page.getByText(cash, { exact: true }).filter({ visible: true }), e = page.getByText(equity, { exact: true }).filter({ visible: true });
    const a = page.getByText(assets, { exact: true }).filter({ visible: true });
    await expect(c).toBeVisible(); await expect(e).toBeVisible(); await expect(a).toBeVisible();
    return [c, e, a.locator('..')];   /* "สินทรัพย์รวม … · หนี้สิน …": the liabilities move with the assets' width */
  };
  await golden.screen('capital-before', { mask: await figures('935,644', '1,885,602', '2,325,602') });

  await page.getByRole('button', { name: '+ บันทึกรายการ' }).click();
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await save.click();
  await golden.step('กดบันทึกโดยยังไม่กรอกจำนวนเงิน');

  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  // A select's accessible name also contains its chosen option, so selects are matched by the start of the label.
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await expect(field('วันที่ *')).toHaveValue('2026-10-13');
  await select('ประเภทรายการ *').selectOption('เงินลงทุนเพิ่มโดยเจ้าของ / ผู้ถือหุ้น');
  await field('จำนวนเงิน (บาท) *').fill('200000');
  await field('รายละเอียด').fill('เจ้าของเพิ่มทุนซื้อเครื่องวิเคราะห์แบตเตอรี่ EV');
  await golden.step('กรอกรายการเงินลงทุน');

  const before = await app.state();
  await save.click();
  await expect(page.getByText('26 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'เจ้าของเพิ่มทุนซื้อเครื่องวิเคราะห์แบตเตอรี่ EV' })).toContainText('200,000.00');
  await golden.step('หลังบันทึกเงินลงทุน');
  await golden.stateChange('owner-investment', before);
  await golden.screen('capital-after', { mask: await figures('1,135,644', '2,085,602', '2,525,602') });
  golden.done();
});
