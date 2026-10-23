import { test, expect } from '../support/test';

// New behaviour (task 3.3, decision R4): the VAT of a document is an amount in
// satang, rounded once on the document's total with halves going up, and the
// total is the base plus that amount. The legacy app kept 7% of 1,234.50 as
// 86.415, showed it as 86.41 and the total as 1,320.92 (1,234.50 + 86.41 is
// 1,320.91), and added the unrounded amounts up in the sales tax report.
test('S138 ระบบใหม่: VAT ของแต่ละใบเก็บเป็นสตางค์ ปัดครึ่งขึ้น ยอดรวมเท่ากับยอดก่อน VAT บวก VAT และรายงานภาษีขายใช้ยอดเดียวกัน', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อลูกค้า / เบอร์โทร / ทะเบียน').filter({ visible: true });
  await custBox.fill('วิภา');
  await custBox.locator('..').getByText('วิภา ศรีสมบูรณ์').click();
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001/ }).click();
  // BR-001 row: warranty (months), quantity, price
  const row = page.getByRole('row').filter({ hasText: 'BR-001' }).filter({ has: page.getByRole('spinbutton') });
  await row.getByRole('spinbutton').nth(2).fill('1234.5');
  await row.getByRole('spinbutton').nth(2).press('Tab');
  const vatLine = page.locator('div', { has: page.locator('span', { hasText: /^ภาษีมูลค่าเพิ่ม/ }) }).filter({ visible: true }).last();
  await expect(vatLine).toContainText('86.42');
  await expect(page.getByText('1,320.92').filter({ visible: true }).first()).toBeVisible();

  const before = (await app.state()).DB;
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await app.settle();
  const after = (await app.state()).DB;
  const sale = after.stockCuts.find((c: any) => !before.stockCuts.some((b: any) => b.id === c.id));
  expect(sale).toMatchObject({ no: 'MA-SA261000015', vat: 7, total: 1320.92 });

  // The sales tax report lists the sale (a short tax invoice) with the same amounts.
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
  // Ten rows a page: the new sale is the last one, on page 2.
  const report = page.locator('div').filter({ has: page.getByRole('heading', { name: 'รายงานภาษีขาย' }) }).filter({ has: page.getByRole('table') }).last();
  await report.getByRole('button', { name: '›', exact: true }).click();
  const reportRow = report.getByRole('row').filter({ hasText: 'MA-SA261000015' });
  await expect(reportRow).toContainText('13/10/2569');
  await expect(reportRow).toContainText('1,234.50');
  await expect(reportRow).toContainText('86.42');
});
