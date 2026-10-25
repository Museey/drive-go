import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S58 in the new system (tests/intentional-changes.json, task 3.7, the owner's answer of
// 2026-10-25 "เฉพาะงวดที่บันทึก"): cash no longer takes off the payroll estimated from the staff list
// (2,534,500, none of it recorded): 993,634 before deleting the scrap sale (legacy −1,540,866) and
// 968,634 after (legacy −1,565,866). The cash, equity and assets figures are left out of the screens;
// every step, the rest of each screen and every data change are S58's.
const S58 = 'S58-delete-expense-asset-capital.spec.ts';

test('S171 ระบบใหม่: ลบรายการบัญชีที่บันทึกผิด เงินสดคงเหลือไม่มีเงินเดือนประมาณการ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S58, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // Each table row has its own "ลบ" button too: press the one on the confirm card.
  const confirmDelete = (question: string) => page.locator('div').filter({ hasText: question })
    .filter({ has: page.getByRole('button', { name: 'ไม่ลบ' }) }).last()
    .getByRole('button', { name: 'ลบ', exact: true });

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ค่าใช้จ่ายกิจการ', exact: true }).click();
  const rent = page.getByRole('row').filter({ hasText: 'ค่าเช่าอาคารประจำเดือน' }).filter({ visible: true });
  await expect(rent).toContainText('MA-EX261000002');
  await golden.step('หน้าค่าใช้จ่ายกิจการ');
  await rent.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('ลบรายการค่าใช้จ่าย MA-EX261000002 ?')).toBeVisible();
  await golden.step('กดลบค่าเช่าอาคาร MA-EX261000002 ระบบถามยืนยัน');
  let before = await app.state();
  await confirmDelete('ลบรายการค่าใช้จ่าย MA-EX261000002 ?').click();
  await expect(rent).toHaveCount(0);
  await golden.step('หลังลบค่าใช้จ่าย');
  await golden.stateChange('delete-expense', before);

  await page.getByRole('button', { name: '└ ทะเบียนสินทรัพย์', exact: true }).click();
  const pos = page.getByRole('row').filter({ hasText: 'คอมพิวเตอร์ POS หน้าร้านพร้อมเครื่องพิมพ์' })
    .filter({ visible: true }).filter({ has: page.getByRole('button', { name: 'ลบ' }) });
  await expect(pos).toContainText('MA-FA260400001');
  await expect(page.getByRole('row', { name: /^รวม 8 รายการ/ })).toBeVisible();
  await golden.step('หน้าทะเบียนสินทรัพย์ 8 รายการ');
  await pos.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('ลบสินทรัพย์ MA-FA260400001 — คอมพิวเตอร์ POS หน้าร้านพร้อมเครื่องพิมพ์ ?')).toBeVisible();
  await golden.step('กดลบคอมพิวเตอร์ POS ระบบถามยืนยัน');
  before = await app.state();
  await confirmDelete('ลบสินทรัพย์ MA-FA260400001').click();
  await expect(pos).toHaveCount(0);
  await expect(page.getByRole('row', { name: /^รวม 7 รายการ/ })).toBeVisible();
  await golden.step('หลังลบสินทรัพย์ เหลือ 7 รายการ');
  await golden.stateChange('delete-asset', before);
  await golden.screen('assets-after-delete');

  await page.getByRole('button', { name: '└ เงินลงทุน / เงินสด', exact: true }).click();
  const scrap = page.getByRole('row').filter({ hasText: 'ขายเศษเหล็กและอะไหล่เก่า' }).filter({ visible: true });
  await expect(scrap).toContainText('25,000.00');
  await expect(page.getByText('25 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText('993,634', { exact: true })).toBeVisible();
  await golden.step('หน้าเงินลงทุน / เงินสด 25 รายการ');
  await golden.screen('capital-before', { mask: [page.locator('#cCash'), page.locator('#cEquity'), page.locator('#cAssets').locator('..')] });
  await scrap.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('ลบรายการนี้?', { exact: true })).toBeVisible();
  await golden.step('กดลบรายรับขายเศษเหล็ก ระบบถามยืนยัน (ไม่บอกว่าเป็นรายการไหน)');
  before = await app.state();
  await confirmDelete('ลบรายการนี้?').click();
  await expect(scrap).toHaveCount(0);
  await expect(page.getByText('24 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('หลังลบรายการ เหลือ 24 รายการ');
  await golden.stateChange('delete-capital', before);
  const cash = page.getByText('968,634', { exact: true });
  await expect(cash).toBeVisible();
  await cash.scrollIntoViewIfNeeded();
  await golden.screen('capital-after', { mask: [page.locator('#cCash'), page.locator('#cEquity'), page.locator('#cAssets').locator('..')] });
  golden.done();
});
