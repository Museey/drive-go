import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.4, decision R7-ก, owner's answers 2026-10-25): what the
// shop withholds is reported on ภ.ง.ด.3 / ภ.ง.ด.53 by the day it is paid —
// paid expenses and vendor payments, not expenses still owed — and the tax
// report sums each form. The certificate (50 ทวิ) follows the Revenue
// Department's form: copies 1 and 2, the payee's address, ลำดับที่ in the
// month's form, the income type and "(1) หัก ณ ที่จ่าย"; it is issued only once
// paid, and its number stays when the expense is saved again (the legacy form
// dropped it). Fixture: two paid expenses withheld on 13/10 — MA-EX261000001
// (สำนักงานบัญชีเลิศพัฒนา, tax id 0…, ภ.ง.ด.53, 3% of 3,500.00) and
// MA-EX261000002 (คุณสุนทร เจ้าของอาคาร, ภ.ง.ด.3, 5% of 25,000.00).
// A side menu opens and closes its sub-menu on each press: press it only when the sub-menu item is not showing.
async function go(page: Page, menu: string | RegExp, item: string) {
  const sub = page.getByRole('button', { name: item });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
async function payVendorWithholding(page: Page) {
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
  await page.getByText('บัญชี - การเงิน', { exact: true }).click();
  await page.getByRole('button', { name: 'เจ้าหนี้ (ค้างจ่าย)' }).click();
  await page.getByRole('button', { name: '+ ชำระเงินเจ้าหนี้' }).click();
  await page.getByRole('button').filter({ hasText: 'หจก. ไทยพาร์ท ซัพพลาย' }).filter({ visible: true }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-RC261000002' }).check();
  await page.getByRole('button', { name: 'หัก ณ ที่จ่าย', exact: true }).click();
  await page.getByRole('combobox', { name: 'อัตราหัก ณ ที่จ่ายของ MA-RC261000002' }).selectOption('1% (ค่าขนส่ง)');
  await page.getByRole('button', { name: 'เงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'บันทึกจ่ายชำระ' }).click();
  await page.getByRole('button', { name: 'ยืนยันบันทึกจ่ายชำระ ฿9,222.00' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
}
async function expense(page: Page, o: { desc: string; payee: string; tax: string; base: string; wht: string; paid: boolean }) {
  await go(page, '06 รายจ่าย / ซื้อสินค้า', '6 · อื่น ๆ');
  await page.getByRole('button', { name: '+ บันทึกรายจ่าย' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await select('หมวดค่าใช้จ่าย *').selectOption('ค่าซ่อมแซมและบำรุงรักษา');
  await field('รายละเอียดค่าใช้จ่าย *').fill(o.desc);
  await page.getByPlaceholder('หรือพิมพ์ชื่อเอง').fill(o.payee);
  await field('เลขประจำตัวผู้เสียภาษีผู้รับเงิน').fill(o.tax);
  await field('มูลค่าก่อนภาษี (บาท) *').fill(o.base);
  await select('หักภาษี ณ ที่จ่าย').selectOption(o.wht);
  await select('สถานะ').selectOption(o.paid ? 'จ่ายแล้ว' : 'ค้างจ่าย');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
}
async function vendorRegister(page: Page) {
  await go(page, /^04 ใบเสร็จรับเงิน/, '└ 4.4 ใบหัก ณ ที่จ่าย');
  await page.getByRole('tab', { name: 'เราหักผู้ขาย' }).click();
}
const printed = (page: Page, text: string | RegExp) => page.locator('#printStage').getByText(text, typeof text === 'string' ? { exact: true } : undefined);

test('S150 ระบบใหม่: ภ.ง.ด.3 / 53 นับตามวันที่จ่าย รวมการจ่ายเจ้าหนี้ที่หักไว้ และหนังสือรับรอง 50 ทวิ ตามแบบสรรพากร ฉบับที่ 1 และ 2', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await payVendorWithholding(page);   // MA-PV261000001: 1% of 8,700.00 = 87.00, ภ.ง.ด.53
  await expense(page, { desc: 'ล้างและซ่อมเครื่องปรับอากาศสำนักงาน', payee: 'ร้านเย็นฉ่ำแอร์เซอร์วิส', tax: '3100600112233', base: '2000',
    wht: '3% (ค่าบริการ / ค่าจ้างทำของ)', paid: true });   // MA-EX261000003, MA-PV261000002: 60.00, ภ.ง.ด.3
  await expense(page, { desc: 'ค่าจ้างทำป้ายหน้าร้าน', payee: 'ร้านป้ายสวย', tax: '3100600445566', base: '5000',
    wht: '3% (ค่าบริการ / ค่าจ้างทำของ)', paid: false });   // MA-EX261000004: still owed, nothing withheld yet

  // The tax report of October: paid withholdings only, each with its form and ลำดับที่; each form summed.
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  const table = page.getByRole('table').filter({ has: page.getByRole('cell', { name: 'ผู้รับเงิน / รายการ', exact: true }) });
  const line = (no: string) => table.getByRole('row').filter({ hasText: no });
  await expect(line('MA-EX261000001')).toContainText('ภ.ง.ด.53 ลำดับที่ 1');
  await expect(line('MA-EX261000002')).toContainText('ภ.ง.ด.3 ลำดับที่ 1');
  await expect(line('MA-EX261000003')).toContainText('ภ.ง.ด.3 ลำดับที่ 2');
  await expect(line('MA-EX261000003')).toContainText('60.00');
  await expect(line('MA-PV261000001')).toContainText('หจก. ไทยพาร์ท ซัพพลาย');
  await expect(line('MA-PV261000001')).toContainText('ภ.ง.ด.53 ลำดับที่ 2 · MA-PV261000001 · ค่าสินค้าตามใบรับสินค้า MA-RC261000002');
  await expect(line('MA-PV261000001')).toContainText('8,700.00');
  await expect(line('MA-PV261000001')).toContainText('87.00');
  await expect(line('MA-EX261000004')).toHaveCount(0);
  await expect(table.getByRole('row', { name: /^ภ\.ง\.ด\.3 · 2 ราย/ })).toContainText('27,000.00');
  await expect(table.getByRole('row', { name: /^ภ\.ง\.ด\.3 · 2 ราย/ })).toContainText('1,310.00');
  await expect(table.getByRole('row', { name: /^ภ\.ง\.ด\.53 · 2 ราย/ })).toContainText('12,200.00');
  await expect(table.getByRole('row', { name: /^ภ\.ง\.ด\.53 · 2 ราย/ })).toContainText('192.00');
  await expect(table.getByRole('row', { name: /^รวมที่ต้องนำส่ง/ })).toContainText('1,502.00');
  await expect(page.getByRole('row', { name: /^ภาษีหัก ณ ที่จ่ายที่กิจการต้องนำส่ง/ })).toContainText('1,502.00');

  // 4.4 เราหักผู้ขาย lists the vendor payment; its certificate on the Revenue Department's form, two copies.
  await vendorRegister(page);
  const vrow = page.getByRole('row').filter({ hasText: 'MA-PV261000001' }).filter({ visible: true });
  await expect(vrow).toContainText('หจก. ไทยพาร์ท ซัพพลาย');
  await expect(vrow).toContainText('ค่าสินค้าตามใบรับสินค้า MA-RC261000002');
  await vrow.getByRole('button', { name: 'พิมพ์ 50 ทวิ' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(printed(page, 'หนังสือรับรองการหักภาษี ณ ที่จ่าย')).toHaveCount(2);
  for (const text of ['ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ใช้แนบพร้อมกับแบบแสดงรายการภาษี)', 'ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)'])
    await expect(printed(page, text)).toHaveCount(1);
  for (const text of ['MA-WH261000001', 'หจก. ไทยพาร์ท ซัพพลาย', '0103545006789', 'ค่าขนส่ง 1%', '(แปดสิบเจ็ดบาทถ้วน)'])
    await expect(printed(page, text)).toHaveCount(2);
  await expect(printed(page, /ลำดับที่ 2 ในแบบ/)).toHaveCount(2);
  await expect(printed(page, /145 ซ\.ประชาอุทิศ 33/)).toHaveCount(2);
  await expect(printed(page, /\(1\) หัก ณ ที่จ่าย/)).toHaveCount(2);
  await page.emulateMedia({ media: 'screen' });
  await app.settle();
  let db = (await app.state()).DB;
  expect(db.purchases.find((g: any) => g.no === 'MA-RC261000002').payments[0]).toMatchObject({ whtCertNo: 'MA-WH261000001', whtForm: '53' });
  expect(db.audit.at(-1)).toMatchObject({ kind: 'gr', no: 'MA-RC261000002', act: 'print', note: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย MA-WH261000001' });

  // An expense still owed has withheld nothing: no certificate yet.
  const before = db;
  await page.getByRole('row').filter({ hasText: 'MA-EX261000004' }).filter({ visible: true }).getByRole('button', { name: 'พิมพ์ 50 ทวิ' }).click();
  await expect(page.getByText('ยังไม่ได้จ่ายเงิน — ออก 50 ทวิ ได้หลังจ่าย', { exact: true })).toBeVisible();
  await app.settle();
  expect((await app.state()).DB).toEqual(before);

  // A paid expense's certificate keeps its number after the expense is saved again.
  await page.getByRole('row').filter({ hasText: 'MA-EX261000003' }).filter({ visible: true }).getByRole('button', { name: 'พิมพ์ 50 ทวิ' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(printed(page, 'MA-WH261000002')).toHaveCount(2);
  await expect(printed(page, /ลำดับที่ 2 ในแบบ/)).toHaveCount(2);
  await page.emulateMedia({ media: 'screen' });
  await go(page, '06 รายจ่าย / ซื้อสินค้า', '6 · อื่น ๆ');
  await page.getByRole('row').filter({ hasText: 'MA-EX261000003' }).getByRole('button', { name: 'แก้ไข' }).click();
  await page.getByLabel('หมายเหตุ', { exact: true }).filter({ visible: true }).fill('ช่างมาซ่อมวันที่ 12');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  db = (await app.state()).DB;
  expect(db.expenses.find((x: any) => x.no === 'MA-EX261000003')).toMatchObject({ whtCertNo: 'MA-WH261000002', whtForm: '3', note: 'ช่างมาซ่อมวันที่ 12' });
  await vendorRegister(page);
  await page.getByRole('row').filter({ hasText: 'MA-EX261000003' }).filter({ visible: true }).getByRole('button', { name: 'พิมพ์ 50 ทวิ' }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(printed(page, 'MA-WH261000002')).toHaveCount(2);
  await page.emulateMedia({ media: 'screen' });
  await app.settle();
  expect((await app.state()).DB.seq['MA-WH2610']).toBe(2);
});
