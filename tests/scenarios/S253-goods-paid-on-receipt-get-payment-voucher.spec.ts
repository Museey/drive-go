import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant review 2.7, both accountants and the owner's decision of 2026-10-28,
// docs/ACCOUNTANT-ANSWERS.md): a goods receipt saved with "สถานะการชำระ: ชำระแล้ว" — paid when the goods came, not
// through "ชำระเงินเจ้าหนี้" — gets a payment voucher MA-PV… like any other money paid out: a payment of the whole
// receipt, dated on it, cash or transfer at once. A receipt saved unpaid has none until it is marked paid.
// The receipt's window names the voucher and prints it.
async function newReceipt(page: Page, qty: string, paid: boolean) {
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.locator('#grVendorList').getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).click();
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').nth(0).fill(qty);
  await line.getByRole('spinbutton').nth(1).fill('870');
  await page.getByLabel('เงื่อนไขชำระ').filter({ visible: true }).selectOption('เงินสด / โอนทันที');
  if (paid) await page.getByLabel('สถานะการชำระ').filter({ visible: true }).selectOption('ชำระแล้ว');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
}
const toast = (page: Page, text: string) => expect(page.getByText(text, { exact: true }).filter({ visible: true })).toBeVisible();
const close = (page: Page) => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

test('S253 ระบบใหม่: ใบรับสินค้าที่บันทึกว่าชำระแล้วตอนรับของได้ใบสำคัญจ่ายเหมือนการจ่ายเงินทางอื่น ใบที่ยังไม่ชำระไม่มี จนกว่าจะบันทึกว่าชำระแล้ว', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();

  // Paid when the goods came: 10 × 870 + VAT = 9,309.00.
  await newReceipt(page, '10', true);
  await toast(page, 'บันทึกจ่ายเงิน 9,309.00 บาท · ใบสำคัญจ่าย MA-PV261000001');
  await expect(page.getByText('เลขที่ MA-RC261000002 · รออนุมัติ · ใบสำคัญจ่าย MA-PV261000001', { exact: true })).toBeVisible();
  await app.settle();
  let db = (await app.state()).DB;
  const paid = db.purchases.find((g: any) => g.no === 'MA-RC261000002');
  expect(paid).toMatchObject({ paid: true, payDate: '2026-10-13', payMethod: 'cash',
    payments: [{ amt: 9309, date: '2026-10-13', method: 'cash', by: 'เจ้าของกิจการ / ผู้ดูแลระบบ', atOnce: true, pvNo: 'MA-PV261000001' }] });
  expect(db.audit.filter((a: any) => a.kind === 'gr' && a.act === 'pay').map((a: any) => a.note)).toEqual(['จ่ายเงิน 9,309.00 บาท (เงินสด / โอนทันที) · ใบสำคัญจ่าย MA-PV261000001']);

  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).filter({ visible: true }).click();
  await page.emulateMedia({ media: 'print' });
  for (const text of ['ใบสำคัญจ่าย', 'MA-PV261000001', 'หจก. ไทยพาร์ท ซัพพลาย', 'ค่าสินค้าตามใบรับสินค้า', 'MA-RC261000002', '9,309.00', 'เงินสด'])
    await expect(page.locator('#printStage').getByText(text, { exact: true }).first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await close(page);

  // Saved unpaid: no payment, no voucher.
  await newReceipt(page, '2', false);
  await expect(page.getByText('เลขที่ MA-RC261000003 · รออนุมัติ', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).filter({ visible: true })).toHaveCount(0);
  await app.settle();
  db = (await app.state()).DB;
  expect(db.purchases.find((g: any) => g.no === 'MA-RC261000003')).toMatchObject({ paid: false });
  expect(db.purchases.find((g: any) => g.no === 'MA-RC261000003').payments ?? []).toEqual([]);

  // Marked paid later, in the same window: 2 × 870 + VAT = 1,861.80, the next voucher.
  await page.getByLabel('สถานะการชำระ').filter({ visible: true }).selectOption('ชำระแล้ว');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await toast(page, 'บันทึกจ่ายเงิน 1,861.80 บาท · ใบสำคัญจ่าย MA-PV261000002');
  await app.settle();
  db = (await app.state()).DB;
  expect(db.purchases.find((g: any) => g.no === 'MA-RC261000003').payments).toEqual([
    expect.objectContaining({ amt: 1861.8, date: '2026-10-13', atOnce: true, pvNo: 'MA-PV261000002' })]);
  // saved once more, nothing is paid twice
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  expect((await app.state()).DB.purchases.find((g: any) => g.no === 'MA-RC261000003').payments).toHaveLength(1);
});
