import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S14 in the new system (tests/intentional-changes.json, task 3.3,
// decisions R4, R5): a tax invoice is dated on the day of the sale (05/10,
// the day the sales tax report files it under) instead of the day it is
// issued (13/10), and keeps its own amounts from the moment it is issued.
// Every step and message, the form and the data change otherwise are S14's.
const S14 = 'S14-issue-tax-invoice.spec.ts';

test('S135 ระบบใหม่: ออกใบกำกับภาษีจากใบตัดสต็อกที่ชำระแล้ว ใบกำกับลงวันที่ขาย และเก็บยอดของตัวเองตอนออก', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S14, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await golden.step('หน้า 4.6 ใบกำกับภาษี');

  await page.getByRole('button', { name: '+ ออกใบกำกับภาษีใหม่' }).click();
  await page.getByRole('row').filter({ hasText: 'MA-SA261000011' }).filter({ visible: true }).getByRole('radio').check();
  await golden.step('เลือกใบตัดสต็อก MA-SA261000011');

  await page.getByRole('button', { name: 'ออกใบกำกับภาษี', exact: true }).click();
  await expect(page.getByPlaceholder('13 หลัก').filter({ visible: true })).toHaveValue('0105550990011');
  const totals = page.getByText('รวมเป็นเงิน (ก่อน VAT)').filter({ visible: true });
  await totals.scrollIntoViewIfNeeded();
  await golden.step('ฟอร์มใบกำกับภาษี กรอกข้อมูลผู้ซื้อและรายการให้แล้ว');
  await golden.screen('tax-invoice-form');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบกำกับภาษี (ต้นฉบับ + สำเนา)' })).toBeVisible();
  await golden.step('หลังบันทึกใบกำกับภาษี');
  // Sold 05/10 for 1,260.00 + VAT 88.20 = 1,348.20; S14's invoice was dated 13/10 and kept no amounts.
  await golden.stateChange('issue-tax-invoice', before, {
    'DB.receipts[MA-SA261000011].taxDocs': { added: [{ no: 'MA-TX261000004', date: '2026-10-05', cancelled: false, cancelReason: '', cancelDate: '',
      issued: '2026-10-13', rate: 7, base: 1260, vat: 88.2, gross: 1348.2 }] },
  });

  await page.getByRole('button', { name: 'ปิดหน้าต่าง' }).filter({ visible: true }).click();
  const newRow = page.getByRole('row').filter({ hasText: 'MA-TX261000004' }).filter({ visible: true });
  await expect(newRow).toContainText('MA-SA261000011');
  await expect(newRow).toContainText('05/10/2569ออก 13/10/2569');
  await expect(newRow).toContainText('1,348.20');
  await newRow.scrollIntoViewIfNeeded();
  // The register lists the newest date first, so the new row is no longer at the top as in S14's picture;
  // it is listed among today's because it was made today.
  await golden.step('รายการใบกำกับภาษีมี MA-TX261000004');
  golden.done();
});
