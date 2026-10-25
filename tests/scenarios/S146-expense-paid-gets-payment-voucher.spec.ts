import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S43 in the new system (tests/intentional-changes.json, task 3.4,
// decision R7-ข, owner's answers 2026-10-25): an expense saved as "จ่ายแล้ว"
// gets a payment voucher MA-PV… and its payment date, and paying is written to
// the audit log; the register shows the voucher number under the expense's.
// The voucher prints from the expense window, and saving the expense again
// keeps its voucher and payment date (the legacy form dropped what it does not
// show). Every other step, message, screen and data change is S43's.
const S43 = 'S43-record-other-expense-vat-wht.spec.ts';
const printed = async (page: Page, texts: string[]) => {
  await page.emulateMedia({ media: 'print' });
  for (const text of texts) await expect(page.locator('#printStage').getByText(text, { exact: true }).first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
};

test('S146 ระบบใหม่: บันทึกรายจ่ายค่าซ่อมแอร์ที่จ่ายแล้ว ได้ใบสำคัญจ่าย MA-PV และบันทึกการจ่ายเงิน พิมพ์ใบสำคัญจ่ายได้ แก้ไขแล้วเลขเดิมยังอยู่', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S43, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '6 · อื่น ๆ' }).click();
  await expect(page.getByText('ยังไม่มีรายจ่ายอื่นในปีนี้')).toBeVisible();
  await golden.step('หน้ารายจ่ายอื่น ๆ');

  await page.getByRole('button', { name: '+ บันทึกรายจ่าย' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
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
  const row = page.getByRole('row').filter({ hasText: 'ล้างและซ่อมเครื่องปรับอากาศสำนักงาน' });
  await expect(row).toBeVisible();
  await golden.step('หลังบันทึก รายการขึ้นในรายจ่ายอื่น ๆ');
  const legacy = JSON.parse(legacyStateChange(S43, 'other-expense'));
  const exp = legacy['DB.expenses'].added[0];
  Object.assign(exp, { payDate: '2026-10-13', pvNo: 'MA-PV261000001' });
  legacy['DB.audit'].added.push({ ...legacy['DB.audit'].added[0], id: '@DB.audit[MA-EX261000003#51]', act: 'pay',
    note: 'จ่ายเงิน 2,080.00 บาท (เงินสด) · หัก ณ ที่จ่าย 60.00 บาท · ใบสำคัญจ่าย MA-PV261000001' });
  await golden.stateChange('other-expense', before, { 'DB.expenses': legacy['DB.expenses'], 'DB.audit': legacy['DB.audit'], 'DB.seq.MA-PV2610': [null, 1] });
  // The register shows the voucher number under the expense's.
  const noCell = row.getByRole('cell').filter({ hasText: 'MA-EX261000003' });
  await expect(noCell).toContainText('MA-PV261000001');
  await golden.screen('expense-list', { mask: [noCell] });
  golden.done();

  // The voucher, printed from the expense window: payee, the expense, the withholding, what was paid.
  await row.getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByRole('heading', { name: 'แก้ไขค่าใช้จ่าย · MA-EX261000003 · ใบสำคัญจ่าย MA-PV261000001' })).toBeVisible();
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).click();
  await printed(page, ['ใบสำคัญจ่าย', 'MA-PV261000001', 'ร้านเย็นฉ่ำแอร์เซอร์วิส', 'ล้างและซ่อมเครื่องปรับอากาศสำนักงาน (ค่าซ่อมแซมและบำรุงรักษา)',
    'MA-EX261000003 · INV-6910-088', '2,140.00', 'หัก ภาษี ณ ที่จ่าย 3%', '60.00', '2,080.00', 'เงินสด', 'ผู้จ่ายเงิน', 'ผู้อนุมัติ', 'ผู้รับเงิน']);
  await app.settle();
  expect((await app.state()).DB.audit.at(-1)).toMatchObject({ kind: 'expense', no: 'MA-EX261000003', act: 'print', note: 'ใบสำคัญจ่าย MA-PV261000001' });

  // Saved again (a note added): the voucher and the payment date stay, no second payment is recorded.
  await field('หมายเหตุ').fill('ช่างมาซ่อมวันที่ 12');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  const db = (await app.state()).DB;
  expect(db.expenses.find((x: any) => x.no === 'MA-EX261000003')).toMatchObject({ note: 'ช่างมาซ่อมวันที่ 12', pvNo: 'MA-PV261000001', payDate: '2026-10-13' });
  expect(db.audit.at(-1)).toMatchObject({ act: 'save', no: 'MA-EX261000003' });
  expect(db.seq['MA-PV2610']).toBe(1);
});
