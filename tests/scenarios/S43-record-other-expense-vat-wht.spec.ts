import { test, expect } from '../support/test';

test('S43 บันทึกรายจ่ายอื่น ๆ ค่าซ่อมแอร์สำนักงาน มี VAT 7% และหัก ณ ที่จ่าย 3% จ่ายเงินสด', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '6 · อื่น ๆ' }).click();
  await expect(page.getByText('ยังไม่มีรายจ่ายอื่นในปีนี้')).toBeVisible();
  await golden.step('หน้ารายจ่ายอื่น ๆ');

  await page.getByRole('button', { name: '+ บันทึกรายจ่าย' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  // A select's accessible name also contains its chosen option, so selects are matched by the start of the label.
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  // Legacy behaviour reported to the owner: the "อื่น ๆ" form opens with category ค่าไฟฟ้า.
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('ค่าไฟฟ้า');
  await golden.step('ฟอร์มบันทึกค่าใช้จ่ายกิจการ');

  await select('หมวดค่าใช้จ่าย *').selectOption('ค่าซ่อมแซมและบำรุงรักษา');
  await field('เลขที่ใบกำกับภาษี / ใบเสร็จผู้ขาย').fill('INV-6910-088');
  await field('วันที่ในใบเสร็จ / ใบกำกับผู้ขาย').fill('2026-10-12');
  await field('รายละเอียดค่าใช้จ่าย *').fill('ล้างและซ่อมเครื่องปรับอากาศสำนักงาน');
  await page.getByPlaceholder('หรือพิมพ์ชื่อเอง').fill('ร้านเย็นฉ่ำแอร์เซอร์วิส');
  await field('เลขประจำตัวผู้เสียภาษีผู้รับเงิน').fill('3100600112233');
  await field('มูลค่าก่อนภาษี (บาท) *').fill('2000');
  await select('ภาษีมูลค่าเพิ่ม').selectOption('VAT 7% (มีใบกำกับภาษี)');
  await select('หักภาษี ณ ที่จ่าย').selectOption('3% (ค่าบริการ / ค่าจ้างทำของ)');
  await select('วิธีชำระ').selectOption('เงินสด');
  await select('สถานะ').selectOption('จ่ายแล้ว');
  await expect(page.getByRole('row', { name: 'จำนวนเงินที่จ่ายจริง' })).toContainText('2,080.00');
  await golden.step('กรอกรายจ่ายครบ ระบบคำนวณยอดจ่ายจริง');
  await golden.screen('expense-form');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('row').filter({ hasText: 'ล้างและซ่อมเครื่องปรับอากาศสำนักงาน' })).toBeVisible();
  await golden.step('หลังบันทึก รายการขึ้นในรายจ่ายอื่น ๆ');
  await golden.stateChange('other-expense', before);
  await golden.screen('expense-list');
});
