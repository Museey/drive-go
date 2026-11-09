import { test, expect } from '../support/test';

// The pick list and the tax-invoice window of 4.6 "+ ออกใบกำกับภาษีใหม่", parts no other scenario used
// (docs/BEHAVIORS.md): the pick list's date filter, Enter in its search box, rows per page and "ปิด"; in the tax window
// the buyer's tax ID typed by hand, choosing the document by its row, "บันทึก" at the bottom, "พิมพ์ใบกำกับภาษี", "ใบใหม่"
// with a customer chosen in the window, "✕ ล้างลูกค้า" and "✕ ปิด" at the top.
test('S364 ออกใบกำกับภาษีใหม่: ตัวกรองหน้าต่างเลือกใบ แก้เลขผู้เสียภาษี บันทึกปุ่มล่าง พิมพ์ ใบใหม่ เลือก/ล้างลูกค้า และปิด', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();

  // The pick list: date filter, search + Enter, rows per page, then "ปิด".
  await page.getByRole('button', { name: '+ ออกใบกำกับภาษีใหม่' }).click();
  const pick = page.getByRole('heading', { name: 'ออกใบกำกับภาษี — เลือกใบตัดสต็อก' }).locator('xpath=ancestor::div[contains(@class,"sheet")][1]');
  await expect(pick).toBeVisible();
  await golden.step('หน้าต่างเลือกใบตัดสต็อกเพื่อออกใบกำกับภาษี');
  await pick.getByRole('combobox').first().selectOption({ label: 'วันที่ระบุ' });
  await golden.step('ช่วงวันที่: วันที่ระบุ ช่องวันที่ขึ้นมา (รายการรอกดค้นหา)');
  await pick.getByRole('combobox').first().selectOption({ label: 'เลือกทั้งหมด' });
  await pick.getByPlaceholder(/เลขที่ใบตัดสต็อก \/ ชื่อลูกค้า/).fill('ก่อสร้าง');
  await pick.getByPlaceholder(/เลขที่ใบตัดสต็อก \/ ชื่อลูกค้า/).press('Enter');
  await expect(pick.getByRole('row').filter({ hasText: 'MA-SA261000011' })).toBeVisible();
  await golden.step('พิมพ์ "ก่อสร้าง" แล้วกด Enter');
  await pick.getByLabel('จำนวนรายการต่อหน้า').selectOption({ label: '100 รายการ' });
  await golden.step('แสดง 100 รายการต่อหน้า');
  await pick.getByRole('contentinfo').getByRole('button', { name: 'ปิด', exact: true }).click();
  await golden.step('กดปิดหน้าต่างเลือกใบ');

  // Again: MA-SA261000011 → the tax window.
  await page.getByRole('button', { name: '+ ออกใบกำกับภาษีใหม่' }).click();
  await page.getByRole('row').filter({ hasText: 'MA-SA261000011' }).filter({ visible: true }).getByRole('radio').check();
  await page.getByRole('button', { name: 'ออกใบกำกับภาษี', exact: true }).click();
  const taxId = page.getByPlaceholder('13 หลัก').filter({ visible: true });
  await expect(taxId).toHaveValue('0105550990011');
  await golden.step('หน้าต่างใบกำกับภาษีของ MA-SA261000011');
  await taxId.fill('');
  await golden.step('ลบเลขประจำตัวผู้เสียภาษี ระบบเตือน');
  await taxId.fill('0105550990011');
  await page.getByRole('row').filter({ hasText: 'MA-SA261000011' }).filter({ visible: true }).getByRole('cell').nth(1).click();
  await golden.step('ใส่เลขกลับ แล้วกดที่แถวของ MA-SA261000011');
  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบกำกับภาษี (ต้นฉบับ + สำเนา)' })).toBeVisible();
  await golden.step('กดบันทึกที่ท้ายฟอร์ม');
  await golden.stateChange('issue-tax-invoice', before);
  const printed = await app.state();
  await page.getByRole('button', { name: 'พิมพ์ใบกำกับภาษี (ต้นฉบับ + สำเนา)' }).click();
  await golden.step('กดพิมพ์ใบกำกับภาษี');
  await golden.stateChange('print-tax-invoice', printed);

  // "ใบใหม่": choose a customer in the window, then "✕ ล้างลูกค้า", then "✕ ปิด".
  await page.getByRole('button', { name: 'สร้างเอกสารใหม่' }).click();
  const cust = page.getByPlaceholder(/^พิมพ์ชื่อ \/ บริษัท \/ เบอร์โทร \/ ทะเบียนร/).filter({ visible: true });
  await cust.fill('ก่อสร้างพระราม');
  await cust.press('Enter');
  await expect(page.getByText('ลูกค้ารายนี้ไม่มีใบตัดสต็อกที่รอออกใบกำกับภาษี', { exact: false }).filter({ visible: true })).toBeVisible();
  await golden.step('กดใบใหม่ แล้วเลือกลูกค้า บริษัท ก่อสร้างพระราม 2 จำกัด (ไม่มีใบรอออก)');
  await page.getByTitle('ล้างลูกค้า').filter({ visible: true }).click();
  await expect(cust).toHaveValue('');
  await golden.step('กด ✕ ล้างลูกค้า');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('กด ✕ ปิด ที่หัวหน้าต่าง');
});
