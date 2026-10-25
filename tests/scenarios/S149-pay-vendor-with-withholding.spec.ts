import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.4, decision R7-ข-ก, owner's answers 2026-10-25): a
// vendor payment may withhold tax. In "ชำระเงินเจ้าหนี้" the button "หัก ณ ที่จ่าย"
// opens a table of the ticked goods receipts: the base before VAT (the receipt's,
// to be changed when only part of it is a service) and the rate; what is withheld
// lowers what is paid and settles the bill like money. The settlement has one
// payment voucher MA-PV…, printed with the withholding, and the payment history
// shows both. The legacy app has no withholding on vendor payments.
async function creditPurchase(page: Page) {
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').nth(0).fill('10');
  await line.getByRole('spinbutton').nth(1).fill('870');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
}

test('S149 ระบบใหม่: จ่ายเจ้าหนี้แล้วหัก ณ ที่จ่าย 1% ค่าขนส่ง ยอดหักลดยอดที่จ่าย ได้ใบสำคัญจ่ายที่พิมพ์ยอดหัก และประวัติชำระแสดงทั้งสองอย่าง', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await creditPurchase(page);   // MA-RC261000002: 8,700.00 + VAT 609.00 = 9,309.00

  await page.getByText('บัญชี - การเงิน', { exact: true }).click();
  await page.getByRole('button', { name: 'เจ้าหนี้ (ค้างจ่าย)' }).click();
  await page.getByRole('button', { name: '+ ชำระเงินเจ้าหนี้' }).click();
  await page.getByRole('button').filter({ hasText: 'หจก. ไทยพาร์ท ซัพพลาย' }).filter({ visible: true }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-RC261000002' }).check();

  // The withholding table: the base before VAT of the receipt, the rate; 1% of 8,700.00 = 87.00.
  await page.getByRole('button', { name: 'หัก ณ ที่จ่าย', exact: true }).click();
  await expect(page.getByText('หัก ณ ที่จ่ายผู้ขาย', { exact: true })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'ฐานก่อน VAT ของ MA-RC261000002' })).toHaveValue('8700');
  await page.getByRole('combobox', { name: 'อัตราหัก ณ ที่จ่ายของ MA-RC261000002' }).selectOption('1% (ค่าขนส่ง)');
  await expect(page.getByText('หัก ณ ที่จ่าย รวม ฿87.00 — ยอดที่ต้องจ่ายผู้ขาย ฿9,222.00')).toBeVisible();
  await expect(page.getByRole('row').filter({ has: page.getByRole('checkbox', { name: 'เลือก MA-RC261000002' }) })).toContainText('9,222.00');

  await page.getByRole('button', { name: 'โอนเต็มจำนวน' }).click();
  await page.getByLabel('โอนจากบัญชีร้าน *').filter({ visible: true }).selectOption({ label: 'ธนาคารกสิกรไทย 123-4-56789-0 (หจก.เอกหม้อน้ำ)' });
  await page.getByLabel('เลขอ้างอิง / เลขที่สลิป').filter({ visible: true }).fill('KB2610130002');
  await page.getByRole('button', { name: 'บันทึกจ่ายชำระ' }).click();
  await expect(page.getByText('หัก ณ ที่จ่าย ฿87.00 — ไม่ใช่เงินที่จ่าย ระบบลดยอดคงค้างของบิลให้')).toBeVisible();
  await page.getByRole('button', { name: 'ยืนยันบันทึกจ่ายชำระ ฿9,222.00' }).click();
  await expect(page.getByText('ใบสำคัญจ่าย MA-PV261000001')).toBeVisible();
  await app.settle();
  const db = (await app.state()).DB, gr = db.purchases.find((g: any) => g.no === 'MA-RC261000002');
  expect(gr.paid).toBe(true);
  expect(gr.payments).toEqual([expect.objectContaining({ amt: 9222, method: 'trans', ref: 'KB2610130002', pvNo: 'MA-PV261000001',
    wht: { rate: 1, baseAmt: 8700, amt: 87, form: '53' } })]);
  expect(db.audit.at(-1)).toMatchObject({ kind: 'gr', no: 'MA-RC261000002', act: 'pay',
    note: 'จ่ายเจ้าหนี้ 9,222.00 บาท (เงินโอน) · หัก ณ ที่จ่าย 87.00 บาท · ใบสำคัญจ่าย MA-PV261000001 · ชำระครบแล้ว' });

  // The voucher: what the receipt was, the withholding, what was paid.
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).click();
  await page.emulateMedia({ media: 'print' });
  for (const text of ['ใบสำคัญจ่าย', 'MA-PV261000001', 'หจก. ไทยพาร์ท ซัพพลาย', 'ค่าสินค้าตามใบรับสินค้า', 'MA-RC261000002', '9,309.00', 'หัก ภาษี ณ ที่จ่าย 1%', '87.00', '9,222.00'])
    await expect(page.locator('#printStage').getByText(text, { exact: true }).first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The payables register: settled in full (paid 9,222.00 + withheld 87.00); the history shows the withholding and the voucher.
  await page.getByRole('combobox', { name: 'สถานะเจ้าหนี้' }).selectOption('ชำระครบแล้ว');
  const row = page.getByRole('row').filter({ hasText: 'MA-RC261000002' }).filter({ visible: true });
  await expect(row).toContainText('9,309.00');
  await expect(row).toContainText('ชำระครบแล้ว');
  await row.getByRole('button', { name: 'ประวัติชำระ' }).click();
  const history = page.locator('div.sheet').filter({ has: page.getByRole('heading', { name: 'ประวัติการชำระเงิน · MA-RC261000002' }) });
  const pay = history.getByRole('row').filter({ hasText: '13/10/2569' });
  await expect(pay).toContainText('9,222.00');
  await expect(pay).toContainText('หัก ณ ที่จ่าย 87.00');
  await expect(pay).toContainText('ใบสำคัญจ่าย MA-PV261000001');
  await expect(pay.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' })).toBeVisible();
});
