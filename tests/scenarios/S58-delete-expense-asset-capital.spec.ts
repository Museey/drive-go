import { test, expect } from '../support/test';

test('S58 ลบรายการบัญชีที่บันทึกผิด: ค่าเช่าอาคารในค่าใช้จ่ายกิจการ คอมพิวเตอร์ POS ในทะเบียนสินทรัพย์ และรายรับขายเศษเหล็กในเงินลงทุน / เงินสด', async ({ app, page, golden }) => {
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
  await expect(page.getByText('-1,540,866', { exact: true })).toBeVisible();
  await golden.step('หน้าเงินลงทุน / เงินสด 25 รายการ');
  await golden.screen('capital-before');
  await scrap.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('ลบรายการนี้?', { exact: true })).toBeVisible();
  await golden.step('กดลบรายรับขายเศษเหล็ก ระบบถามยืนยัน (ไม่บอกว่าเป็นรายการไหน)');
  before = await app.state();
  await confirmDelete('ลบรายการนี้?').click();
  await expect(scrap).toHaveCount(0);
  await expect(page.getByText('24 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('หลังลบรายการ เหลือ 24 รายการ');
  await golden.stateChange('delete-capital', before);
  const cash = page.getByText('-1,565,866', { exact: true });
  await expect(cash).toBeVisible();
  await cash.scrollIntoViewIfNeeded();
  await golden.screen('capital-after');
});
