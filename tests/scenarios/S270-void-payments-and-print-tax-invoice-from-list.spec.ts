import { test, expect } from '../support/test';

// Buttons no other scenario pressed (docs/BEHAVIORS.md): "ยกเลิกรายการ" in the payment history of a customer's bill
// (one payment) and of a vendor's bill paid in full the old way (no payment lines), and "พิมพ์" in the list of 4.6.
test('S270 ยกเลิกรายการรับชำระของลูกหนี้ ยกเลิกการจ่ายเต็มใบของเจ้าหนี้ และพิมพ์ใบกำกับภาษีจากทะเบียน', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();

  // Answers the confirm card with this title (the history behind it has a button with the same name).
  const confirm = async (title: string, reason: string, answer: string) => {
    const card = page.getByRole('heading', { name: title, exact: true }).locator('xpath=ancestor::div[.//button][1]');
    await card.getByRole('textbox').fill(reason);
    await card.getByRole('button', { name: answer, exact: true }).click();
  };
  const history = (no: string) => page.locator('div.sheet').filter({ has: page.getByRole('heading', { name: 'ประวัติการชำระเงิน · ' + no }) });

  // 1. A customer's bill paid in part (MA-SA261000006: 1,500.00 of 4,594.50 by transfer).
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ลูกหนี้ (ค้างรับ)' }).click();
  const ar = page.getByRole('row').filter({ hasText: 'MA-SA261000006' }).filter({ visible: true });
  await ar.getByRole('button', { name: 'ประวัติชำระ' }).click();
  await expect(history('MA-SA261000006')).toContainText('TR-0002');
  await golden.step('ประวัติการชำระเงินของ MA-SA261000006');
  await history('MA-SA261000006').getByRole('button', { name: 'ยกเลิกรายการ', exact: true }).click();
  await golden.step('กดยกเลิกรายการชำระ 1,500.00 ระบบถามเหตุผล');
  let before = await app.state();
  await confirm('ยกเลิกรายการชำระ 1,500.00 บาท', 'โอนผิดบัญชี ลูกค้าขอคืน', 'ยกเลิกรายการ');
  await expect(history('MA-SA261000006')).toContainText('ยกเลิกแล้ว');
  await golden.step('ยกเลิกรายการชำระแล้ว');
  await golden.stateChange('void-ar-payment', before);
  await history('MA-SA261000006').getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(ar).toContainText('4,654.50');
  await golden.step('ทะเบียนลูกหนี้หลังยกเลิกรายการชำระ');

  // 2. A vendor's bill marked paid in full without payment lines (MA-RC261000001).
  await page.getByRole('button', { name: '└ เจ้าหนี้ (ค้างจ่าย)' }).click();
  await page.getByLabel('สถานะเจ้าหนี้').filter({ visible: true }).selectOption({ label: 'ชำระครบแล้ว' });
  const ap = page.getByRole('row').filter({ hasText: 'MA-RC261000001' }).filter({ visible: true });
  await expect(ap).toContainText('ชำระครบแล้ว');
  await golden.step('ทะเบียนเจ้าหนี้ที่ชำระครบแล้ว');
  await ap.getByRole('button', { name: 'ประวัติชำระ' }).click();
  await expect(history('MA-RC261000001')).toContainText('บันทึกชำระครบทั้งใบ (ไม่แยกงวด)');
  await golden.step('ประวัติการชำระเงินของ MA-RC261000001 ชำระครบทั้งใบ');
  await history('MA-RC261000001').getByRole('button', { name: 'ยกเลิกรายการ', exact: true }).click();
  await golden.step('กดยกเลิกการชำระเต็มใบ ระบบถามเหตุผล');
  before = await app.state();
  const title = await page.getByRole('heading', { name: /^ยกเลิก/ }).filter({ visible: true }).last().textContent();
  await confirm(String(title).trim(), 'บันทึกชำระผิดใบ', 'ยกเลิกรายการ');
  await golden.step('ยกเลิกการชำระเต็มใบแล้ว');
  await golden.stateChange('void-ap-full', before);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // 3. Print a tax invoice from the list of 4.6.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  const tx = page.getByRole('row').filter({ hasText: 'MA-TX261000001' }).filter({ visible: true }).first();
  await expect(tx).toBeVisible();
  await golden.step('ทะเบียนใบกำกับภาษี');
  before = await app.state();
  await tx.getByRole('button', { name: 'พิมพ์', exact: true }).click();
  await golden.step('กดพิมพ์ใบกำกับภาษี MA-TX261000001 จากทะเบียน');
  await golden.stateChange('print-tax-invoice', before);
  await page.emulateMedia({ media: 'print' });
  // (from the top: the page behind the print is taller in the new system, which lists credit notes on 4.6 too)
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('tax-invoice-printed');
  await page.emulateMedia({ media: 'screen' });
});
