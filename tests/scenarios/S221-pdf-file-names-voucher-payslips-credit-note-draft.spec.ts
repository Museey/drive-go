import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.14, decision F9 and the owner's answers 14.1–14.4 of 2026-10-26), continued from S220:
// the PDF names of documents made in the scenario — the payment voucher of an expense (the payee), a credit note
// (the customer), the pay slip of one employee (the period in place of a number) and of every employee
// ("ทุกคน") and a goods receipt printed before it is saved ("ร่าง"). The payee's name, typed freely, holds
// characters a file name may not have and an invisible one (each a space, never "_") and is too long: the name keeps
// 80 characters before ".pdf", cut at a word's end.
async function recordPrints(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__printed = [];
    window.print = () => {
      window.dispatchEvent(new Event('beforeprint'));
      w.__printed.push(document.title);
      window.dispatchEvent(new Event('afterprint'));
    };
  });
}
const OWN = 'ระบบบริหารงานอู่ซ่อมรถ';
async function printsAs(page: Page, click: () => Promise<void>, name: string) {
  const n = await page.evaluate(() => (window as any).__printed.length as number);
  await click();
  await expect.poll(() => page.evaluate(k => (window as any).__printed.slice(k), n)).toEqual([name]);
  await expect(page).toHaveTitle(OWN);
}
const asked = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const toast = (page: Page, text: string) => expect(page.getByText(text, { exact: true }).filter({ visible: true })).toBeVisible();

test('S221 ระบบใหม่: ชื่อไฟล์ PDF ของใบสำคัญจ่าย ใบลดหนี้ สลิปเงินเดือนรายคนและทุกคน ใบรับสินค้าที่ยังไม่บันทึก และชื่อผู้รับเงินยาวและมีอักษรต้องห้าม', async ({ app, page }) => {
  test.slow();
  await recordPrints(page);
  await app.loginAsOwner();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });

  // A paid expense: its payment voucher names the payee.
  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '6 · อื่น ๆ' }).click();
  await page.getByRole('button', { name: '+ บันทึกรายจ่าย' }).click();
  await select('หมวดค่าใช้จ่าย *').selectOption('ค่าซ่อมแซมและบำรุงรักษา');
  await field('รายละเอียดค่าใช้จ่าย *').fill('ล้างและซ่อมเครื่องปรับอากาศสำนักงาน');
  await page.getByPlaceholder('หรือพิมพ์ชื่อเอง').fill('บริษัท "เย็นฉ่ำ" แอร์/เซอร์วิส แอนด์ เอ็นจิเนียริ่ง (ประเทศไทย) จำกัด\u200b');
  await field('มูลค่าก่อนภาษี (บาท) *').fill('2000');
  await select('วิธีชำระ').selectOption('เงินสด');
  await select('สถานะ').selectOption('จ่ายแล้ว');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await page.getByRole('row').filter({ hasText: 'ล้างและซ่อมเครื่องปรับอากาศสำนักงาน' }).getByRole('button').first().click();
  await printsAs(page, () => page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).filter({ visible: true }).first().click(),
    'ใบสำคัญจ่าย_MA-PV261000001_บริษัท เย็นฉ่ำ แอร์ เซอร์วิส แอนด์ เอ็นจิเนียริ่ง.pdf');
  await page.keyboard.press('Escape');

  // Pay slips of October: one employee's, then everyone's.
  await page.getByRole('button', { name: '└ 4 · จ่ายเงินเดือน' }).click();
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  const rec = asked(page, 'บันทึกเงินเดือน งวด ต.ค. 2569');
  await rec.getByLabel('สถานะ').selectOption('จ่ายแล้ว');
  await rec.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await toast(page, 'บันทึกเงินเดือน งวด ต.ค. 2569 แล้ว · เงินเดือน 216,500 + สมทบนายจ้าง 8,800 บาท · จ่ายแล้ว');
  const emp1 = page.locator('#payTbl').getByRole('row').filter({ hasText: 'EMP001' });
  await printsAs(page, () => emp1.getByRole('button', { name: 'สลิปเงินเดือน' }).click(), 'สลิปเงินเดือน_2026-10_ศักดิ์ชัย มั่นคง.pdf');
  await printsAs(page, () => page.getByRole('button', { name: 'พิมพ์สลิปเงินเดือนทุกคน' }).click(), 'สลิปเงินเดือน_2026-10_ทุกคน.pdf');

  // A goods receipt printed before it is saved: "ร่าง" in place of the number, no vendor chosen yet.
  await page.getByRole('button', { name: '└ 1 · ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await printsAs(page, () => page.getByRole('button', { name: 'พิมพ์', exact: true }).filter({ visible: true }).click(), 'ใบรับสินค้า_ร่าง.pdf');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).click();

  // A credit note for a price cut on an unpaid sale.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await page.getByRole('button', { name: '+ ออกใบลดหนี้' }).click();
  const cn = page.locator('div.panel').filter({ has: page.getByRole('heading', { name: /ใบลดหนี้/ }) });
  await cn.getByLabel('ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า').fill('MA-SA261000003');
  await cn.getByRole('row').filter({ hasText: 'MA-SA261000003' }).getByRole('button', { name: 'เลือก' }).click();
  await cn.getByLabel('กรณี').selectOption('ลดราคาหลังขาย');
  await cn.getByLabel('มูลค่าที่ลด (ก่อน VAT)').fill('500');
  await cn.getByLabel('เหตุผล (ต้องกรอก)').fill('ลดราคาให้ลูกค้า');
  await cn.getByRole('button', { name: 'บันทึกใบลดหนี้' }).click();
  await expect(cn.getByRole('heading', { name: 'ใบลดหนี้ MA-CN261000001' })).toBeVisible();
  await printsAs(page, () => cn.getByRole('button', { name: 'พิมพ์ใบลดหนี้ (ต้นฉบับ + สำเนา)' }).click(), 'ใบลดหนี้_MA-CN261000001_ปรีชา ทองสุข.pdf');
  await cn.getByRole('button', { name: 'ปิด' }).click();
});
