import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S62 in the new system (tests/intentional-changes.json, task 3.3,
// decision R6-ก): cancelling a tax invoice (for example a wrong company name)
// cancels only the tax invoice. The bill, its payments and the stock stay as
// they are (S62 cancelled the bill too and said to start again from a new
// quotation), and a new tax invoice can be issued in its place, dated on the
// day of the sale, recording which one it replaces and printing it (T1).
const S62 = 'S62-cancel-tax-invoice.spec.ts';

test('S136 ระบบใหม่: ยกเลิกเฉพาะใบกำกับภาษี บิล เงิน และสต๊อกไม่เปลี่ยน แล้วออกใบกำกับภาษีใบใหม่แทนได้', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S62, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await golden.step('หน้า 4.6 ใบกำกับภาษี');
  const start = await app.state();
  const bill = (s: any) => s.DB.receipts.find((r: any) => r.no === 'MA-SA261000010');

  const taxRow = page.getByRole('row').filter({ hasText: 'MA-TX261000003' }).filter({ visible: true });
  await expect(taxRow).toContainText('MA-SA261000010');
  await taxRow.getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(page.getByText('ยกเลิกเฉพาะใบกำกับภาษี MA-TX261000003 บิล การรับเงิน และสต๊อกไม่เปลี่ยน', { exact: false })).toBeVisible();
  await expect(page.getByText('เอกสารต้นทาง MA-SA261000010 จะถูกยกเลิกไปด้วยโดยอัตโนมัติ', { exact: false })).toHaveCount(0);
  golden.skip('ระบบเตือนว่าเอกสารต้นทางจะถูกยกเลิกด้วย');   // the warning is now the one above

  await page.getByRole('button', { name: 'ยกเลิกใบกำกับภาษี' }).click();
  const reason = page.getByText('ระบุเหตุผลที่ยกเลิก (ไม่บังคับ)', { exact: true }).locator('..').getByRole('textbox');
  await expect(reason).toBeVisible();
  await golden.step('ถามเหตุผลที่ยกเลิก');

  await reason.fill('ลูกค้าแจ้งว่าชื่อบริษัทในใบกำกับภาษีไม่ถูกต้อง');
  await page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).click();
  await expect(taxRow.getByRole('button', { name: 'ยกเลิก' })).toHaveCount(0);
  await expect(page.getByText('ยกเลิกใบกำกับภาษี MA-TX261000003 แล้ว — ออกใบกำกับภาษีใบใหม่แทนได้', { exact: true })).toBeAttached();
  golden.skip('หลังยกเลิกใบกำกับภาษี');   // S62's message said the bill was cancelled too
  await app.settle();
  const cancelled = bill(await app.state());
  expect(cancelled.taxDocs).toEqual([{ no: 'MA-TX261000003', date: '2026-10-13', cancelled: true,
    cancelReason: 'ลูกค้าแจ้งว่าชื่อบริษัทในใบกำกับภาษีไม่ถูกต้อง', cancelDate: '2026-10-13' }]);
  expect(cancelled).toMatchObject({ taxNo: '', issueTax: false, taxCancelled: true, paid: true, paidDate: bill(start).paidDate });
  expect(cancelled.cancelled).toBeUndefined();
  expect(cancelled.payments).toEqual(bill(start).payments);
  expect((await app.state()).DB.stock).toEqual(start.DB.stock);
  // S62 went on to show the cancelled bill; here the bill is not cancelled, so those steps do not happen.
  golden.skip('เปิดใบตัดสต็อก MA-SA261000010 หลังยกเลิกใบกำกับภาษี');
  golden.skip('รายการเอกสารทั้งหมดไม่มี MA-SA261000010 แล้ว');
  golden.skip('เปิดใบตัดสต็อก MA-SA261000011 จากรายการเอกสารทั้งหมด');
  golden.done();

  // A new tax invoice for the same sale, with the right name.
  await page.getByRole('button', { name: '+ ออกใบกำกับภาษีใหม่' }).click();
  await page.getByRole('row').filter({ hasText: 'MA-SA261000010' }).filter({ visible: true }).getByRole('radio').check();
  await page.getByRole('button', { name: 'ออกใบกำกับภาษี', exact: true }).click();
  await expect(page.getByPlaceholder('13 หลัก').filter({ visible: true })).toHaveValue('0105550990011');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบกำกับภาษี (ต้นฉบับ + สำเนา)' })).toBeVisible();
  await app.settle();
  const reissued = bill(await app.state());
  expect(reissued.taxNo).toBe('MA-TX261000004');
  expect(reissued.taxDocs[1]).toEqual({ no: 'MA-TX261000004', date: '2026-10-04', cancelled: false, cancelReason: '', cancelDate: '',
    issued: '2026-10-13', rate: 7, base: 2380, vat: 166.6, gross: 2546.6,
    replaces: 'MA-TX261000003' });
  expect(reissued.payments).toEqual(bill(start).payments);

  // The printed invoice (original and copy) says which one it replaces, when that one was dated and why it was cancelled (T1).
  await page.getByRole('button', { name: 'พิมพ์ใบกำกับภาษี (ต้นฉบับ + สำเนา)' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByText('ออกแทนใบกำกับภาษีเลขที่ MA-TX261000003 ลงวันที่ 13/10/2569 ที่ยกเลิก เพราะ ลูกค้าแจ้งว่าชื่อบริษัทในใบกำกับภาษีไม่ถูกต้อง', { exact: true })
    .filter({ visible: true })).toHaveCount(2);
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: 'ปิดหน้าต่าง' }).filter({ visible: true }).click();
  await expect(taxRow).toContainText('ยกเลิก');
  const newRow = page.getByRole('row').filter({ hasText: 'MA-TX261000004' }).filter({ visible: true });
  await expect(newRow).toContainText('MA-SA261000010');
  await expect(newRow).toContainText('04/10/2569ออก 13/10/2569');
  await expect(newRow).toContainText('2,546.60');

  // The sales tax report files the sale under its day with the new number.
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
  const reportRow = page.getByRole('row').filter({ hasText: 'MA-TX261000004' }).filter({ visible: true });
  await expect(reportRow).toContainText('04/10/2569');
  await expect(reportRow).toContainText('166.60');
  await expect(page.getByRole('row').filter({ hasText: 'MA-TX261000003' }).filter({ visible: true })).toHaveCount(0);
});
