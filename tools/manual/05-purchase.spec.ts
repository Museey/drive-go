import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 6 of the manual: expenses, buying goods on credit, paying the supplier. Numbers on a picture are the numbers of
// the steps of its section.
test('05 รายจ่ายและซื้อสินค้า', async ({ app, page }) => {
  await app.loginAsOwner();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });

  // An expense paid in cash, with VAT and withholding tax (page 6 · อื่น ๆ)
  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '6 · อื่น ๆ' }).click();
  await app.settle();
  const addExp = page.getByRole('button', { name: '+ บันทึกรายจ่าย' });
  await shot(page, '05-exp-list', { mark: [[page.getByRole('button', { name: '6 · อื่น ๆ' }), '1'], [addExp, '2']], scroll: false });
  await addExp.click();
  await page.waitForTimeout(400);
  await select('หมวดค่าใช้จ่าย *').selectOption('ค่าซ่อมแซมและบำรุงรักษา');
  await field('เลขที่ใบกำกับภาษี / ใบเสร็จผู้ขาย').fill('INV-6910-088');
  await field('วันที่ในใบเสร็จ / ใบกำกับผู้ขาย').fill('2026-10-12');
  await field('รายละเอียดค่าใช้จ่าย *').fill('ล้างและซ่อมเครื่องปรับอากาศหน้าร้าน');
  await page.getByPlaceholder('หรือพิมพ์ชื่อเอง').fill('ร้านเย็นฉ่ำแอร์เซอร์วิส');
  await field('เลขประจำตัวผู้เสียภาษีผู้รับเงิน').fill('3100600112233');
  await field('มูลค่าก่อนภาษี (บาท) *').fill('2000');
  await select('ภาษีมูลค่าเพิ่ม').selectOption('VAT 7% (มีใบกำกับภาษี)');
  await select('หักภาษี ณ ที่จ่าย').selectOption('3% (ค่าบริการ / ค่าจ้างทำของ)');
  await select('วิธีชำระ').selectOption('เงินสด');
  await select('สถานะ').selectOption('จ่ายแล้ว');
  await shot(page, '05-exp-form', { mark: [[select('หมวดค่าใช้จ่าย *'), '3'], [select('ภาษีมูลค่าเพิ่ม'), '4'], [select('หักภาษี ณ ที่จ่าย'), '5'], [select('สถานะ'), '6']], scroll: false });
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await shot(page, '05-exp-saved', { scroll: false });

  // Goods received on credit (page 1 · ซื้อสินค้า)
  await page.reload();
  await app.settle();
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await app.settle();
  const newGr = page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' });
  await shot(page, '05-gr-list', { mark: [[newGr, '1']], scroll: false });
  await newGr.click();
  const vendor = page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true });
  await vendor.click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await page.getByLabel('เลขที่ใบส่งของ/ใบกำกับผู้ขาย').filter({ visible: true }).fill('TP-2610-0451');
  const search = page.getByPlaceholder(/^ค้นหาสินค้า — พิมพ์ชื่อ/).filter({ visible: true });
  await search.click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').nth(0).fill('10');
  await line.getByRole('spinbutton').nth(1).fill('870');
  await page.waitForTimeout(300);
  const approve = page.getByRole('button', { name: 'อนุมัติเอกสาร' });
  await shot(page, '05-gr-form', { mark: [[vendor, '2'], [line, '2'], [approve, '3']], scroll: false });
  await approve.click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await app.settle();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // Paying the supplier
  await page.getByText('บัญชี - การเงิน', { exact: true }).click();
  await page.getByRole('button', { name: 'เจ้าหนี้ (ค้างจ่าย)' }).click();
  await app.settle();
  const pay = page.getByRole('button', { name: '+ ชำระเงินเจ้าหนี้' });
  await shot(page, '05-ap-list', { mark: [[pay, '1']], scroll: false });
  await pay.click();
  await page.getByRole('button').filter({ hasText: 'หจก. ไทยพาร์ท ซัพพลาย' }).filter({ visible: true }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-RC261000002' }).check();
  await page.getByRole('button', { name: 'โอนเต็มจำนวน' }).click();
  await page.getByLabel('โอนจากบัญชีร้าน *').filter({ visible: true }).selectOption({ label: 'ธนาคารกสิกรไทย 123-4-56789-0 (หจก.เอกหม้อน้ำ)' });
  await page.getByLabel('เลขอ้างอิง / เลขที่สลิป').filter({ visible: true }).fill('KB2610130001');
  const savePay = page.getByRole('button', { name: 'บันทึกจ่ายชำระ' });
  await shot(page, '05-ap-pay', { mark: [[page.getByRole('checkbox', { name: 'เลือก MA-RC261000002' }), '2'], [page.getByRole('button', { name: 'โอนเต็มจำนวน' }), '2'], [savePay, '3']], scroll: false });
  await savePay.click();
  const confirm = page.getByRole('button', { name: /^ยืนยันบันทึกจ่ายชำระ/ });
  await confirm.waitFor();
  await shot(page, '05-ap-confirm', { mark: [[confirm, '3']] });
  await confirm.click();
  await app.settle();
  await page.waitForTimeout(500);
  await shot(page, '05-ap-done', { scroll: false });
});
