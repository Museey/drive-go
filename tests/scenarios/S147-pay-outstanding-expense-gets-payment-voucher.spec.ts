import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S63 in the new system (tests/intentional-changes.json, task 3.4,
// decision R7-ข, owner's answers 2026-10-25): paying an outstanding expense
// ("ค้างจ่าย") gives it a payment voucher MA-PV… and writes the payment to the
// audit log (the legacy app wrote nothing); the list shows the voucher number
// under the expense's. Every other step, message, screen and data change is S63's.
const S63 = 'S63-pay-outstanding-utility-expense.spec.ts';

test('S147 ระบบใหม่: บันทึกค่าไฟฟ้าแบบค้างจ่าย แล้วกดจ่าย ได้ใบสำคัญจ่าย MA-PV และบันทึกการจ่ายเงินในประวัติ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S63, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '2 · ค่าน้ำค่าไฟ' }).click();
  await golden.step('หน้าค่าน้ำค่าไฟ');

  await page.getByRole('button', { name: '+ ค่าไฟฟ้า' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
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

  // Saved as outstanding: no voucher yet, the same data change as S63.
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
  await golden.stateChange('pay-expense', beforePay, {
    'DB.expenses[MA-EX261000003].pvNo': [null, 'MA-PV261000001'],
    'DB.seq.MA-PV2610': [null, 1],
    'DB.audit': { added: [{ id: '@DB.audit[MA-EX261000003#51]', ts: '2026-10-13T02:00:00.000Z', user: '', userName: 'เจ้าของกิจการ / ผู้ดูแลระบบ',
      kind: 'expense', docId: '@DB.expenses[MA-EX261000003]', no: 'MA-EX261000003', act: 'pay', note: 'จ่ายเงิน 4,815.00 บาท · ใบสำคัญจ่าย MA-PV261000001' }] },
  });
  const noCell = row.getByRole('cell').filter({ hasText: 'MA-EX261000003' });
  await expect(noCell).toContainText('MA-PV261000001');
  await golden.screen('expense-paid', { mask: [noCell] });
  golden.done();
});
