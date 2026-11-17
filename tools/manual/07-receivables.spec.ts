import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 7: what customers owe: the billing note, and settling it.
test('07 ลูกหนี้และใบวางบิล', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByText('ใบเสร็จรับเงิน / ใบกำกับภาษี', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: '4.5 ใบวางบิล' }).click();
  await app.settle();
  const add = page.getByRole('button', { name: '+ สร้างใบวางบิลใหม่' });
  await shot(page, '07-bl-list', { mark: [add] });
  await add.click();
  const cust = page.getByPlaceholder('พิมพ์ชื่อ / บริษัท / เบอร์โทร / ทะเบียนรถ').filter({ visible: true });
  await cust.fill('วิภา');
  await page.getByText('วิภา ศรีสมบูรณ์', { exact: true }).filter({ visible: true }).click();
  const pull = page.getByRole('button', { name: 'ดึงใบเสร็จค้างชำระ' });
  await pull.click();
  await page.getByText('เลือกแล้ว 2 ใบ · ยอดรวม 10,368.30 บาท').filter({ visible: true }).waitFor();
  await page.getByRole('textbox', { name: 'กำหนดชำระ' }).filter({ visible: true }).fill('2026-11-12');
  await shot(page, '07-bl-form', { mark: [[cust, '1'], [pull, '2'], [page.getByRole('textbox', { name: 'กำหนดชำระ' }).filter({ visible: true }), '3']], scroll: false });
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await page.getByText('ใบวางบิลเป็นเอกสารแสดงยอดค้างของลูกค้า').filter({ visible: true }).waitFor();
  const approve = page.getByRole('button', { name: 'อนุมัติเอกสาร' }).filter({ visible: true });
  await shot(page, '07-bl-saved', { mark: [approve] });
  await approve.click();
  await app.settle();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await app.settle();

  // Settling a billing note
  const go = page.getByRole('row').filter({ hasText: 'MA-BL261000001' }).filter({ visible: true }).getByRole('button', { name: 'ไปหน้าตัดชำระลูกหนี้' });
  await shot(page, '07-bl-settle', { mark: [go] });
  await go.click();
  await page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000008' }).waitFor();
  await app.settle();
  const full = page.getByRole('button', { name: 'เงินสดเต็มจำนวน' }).filter({ visible: true });
  await full.click();
  await page.getByText(/^รับชำระ ฿[\d,.]+ · ตัดครบ/).filter({ visible: true }).first().waitFor();
  await page.waitForTimeout(500);
  await shot(page, '07-settle-form', { mark: [[full, '1'], [page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000008' }), '2']] });
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  const confirm = page.getByRole('button', { name: /^ยืนยันบันทึกรับชำระ/ });
  await confirm.waitFor();
  await shot(page, '07-settle-confirm', { mark: [confirm] });
  await confirm.click();
  await app.settle();
  await page.keyboard.press('Escape').catch(() => {});
  await page.reload();
  await app.settle();

  // What customers still owe (08)
  await page.getByText('บัญชี - การเงิน', { exact: true }).click();
  await page.getByRole('button', { name: 'ลูกหนี้ (ค้างรับ)' }).click();
  await app.settle();
  await shot(page, '07-ar-list');
});
