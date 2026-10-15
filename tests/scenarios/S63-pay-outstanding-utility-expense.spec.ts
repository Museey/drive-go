import { test, expect } from '../support/test';

test('S63 บันทึกค่าไฟฟ้าแบบค้างจ่าย แล้วกดจ่ายจากรายการค่าน้ำค่าไฟ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '2 · ค่าน้ำค่าไฟ' }).click();
  await golden.step('หน้าค่าน้ำค่าไฟ');

  await page.getByRole('button', { name: '+ ค่าไฟฟ้า' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  // A select's accessible name also contains its chosen option, so selects are matched by the start of the label.
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('ค่าไฟฟ้า');
  await golden.step('ฟอร์มค่าไฟฟ้า');

  await field('เลขที่ใบกำกับภาษี / ใบเสร็จผู้ขาย').fill('MEA-6909-112233');
  await field('วันที่ในใบเสร็จ / ใบกำกับผู้ขาย').fill('2026-10-05');
  await field('รายละเอียดค่าใช้จ่าย *').fill('ค่าไฟฟ้าประจำเดือน กันยายน 2569');
  await page.getByPlaceholder('หรือพิมพ์ชื่อเอง').fill('การไฟฟ้านครหลวง');
  await field('มูลค่าก่อนภาษี (บาท) *').fill('4500');
  await select('ภาษีมูลค่าเพิ่ม').selectOption('VAT 7% (มีใบกำกับภาษี)');
  await select('หักภาษี ณ ที่จ่าย').selectOption('ไม่หัก');
  await select('วิธีชำระ').selectOption('เครดิต (ยังไม่จ่าย)');
  await select('สถานะ').selectOption('ค้างจ่าย');
  await expect(page.getByRole('row', { name: 'จำนวนเงินที่จ่ายจริง' })).toContainText('4,815.00');
  await golden.step('กรอกค่าไฟฟ้า 4,500 + VAT 315 สถานะค้างจ่าย');
  await golden.screen('expense-form');

  const beforeSave = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  const row = page.getByRole('row').filter({ hasText: 'ค่าไฟฟ้าประจำเดือน กันยายน 2569' }).filter({ visible: true });
  await expect(row.getByRole('button', { name: 'ค้างจ่าย' })).toBeVisible();
  await golden.step('รายการค่าไฟฟ้าขึ้นเป็นค้างจ่าย');
  await golden.stateChange('save-unpaid-expense', beforeSave);
  await row.scrollIntoViewIfNeeded();
  await golden.screen('expense-unpaid');

  const beforePay = await app.state();
  await row.getByRole('button', { name: 'ค้างจ่าย' }).click();
  await expect(row).toContainText('จ่ายแล้ว');
  await golden.step('กดค้างจ่าย ระบบบันทึกจ่ายทันที');
  await golden.stateChange('pay-expense', beforePay);
  await golden.screen('expense-paid');
});
