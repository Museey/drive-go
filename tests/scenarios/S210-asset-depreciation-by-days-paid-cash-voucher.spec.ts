import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S65 in the new system (tests/intentional-changes.json, task 3.13, decision R17, the owner's answers
// 13.1–13.11 of 2026-10-26): depreciation is worked out by the days held (÷ 365 / 366, the acquisition day counted),
// rounded to satang per asset per year; the form has the payment terms of a goods receipt and the vendor comes from
// the register (needed with VAT); bought "เงินสด / โอนทันที", the purchase is paid when saved with a payment voucher.
// The welder 38,000 (life 5, salvage 1) bought 10/10/2569 is held 83 days in 2569: 37,999 ÷ 5 × 83 ÷ 365 = 1,728.17
// (the legacy app counted October as a whole month: 3 months, 1,899.95); the air conditioner 24,500: 1,114.20.
// The fixture's assets move too, e.g. the POS computer 32,000 of 12/04/2569 (life 3): 264 days, 7,714.83 (legacy 9
// months, 7,999.75); the year's depreciation of the register is 164,913.43 + 1,728.17 + 1,114.20 = 167,755.80.
// The current year counts up to today (accountant review 7.2, the owner's decision of 2026-10-28): on 13/10/2569 the
// welder has been held 4 of its 83 days, 1,728.17 × 4 ÷ 83 = 83.29, the air conditioner 53.70, the POS computer 5,406.23,
// and the register 128,581.02 + 83.29 + 53.70 = 128,718.01 so far (worked out apart from the app's code).
// Every step and message is S65's; the screens with figures that moved are checked by their text.
const S65 = 'S65-register-fixed-assets.spec.ts';
const printed = async (page: Page, texts: string[]) => {
  await page.emulateMedia({ media: 'print' });
  for (const text of texts) await expect(page.locator('#printStage').getByText(text, { exact: true }).first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
};

test('S210 ระบบใหม่: ซื้อสินทรัพย์ 2 รายการเงินสด ได้ใบสำคัญจ่ายทันที ค่าเสื่อมราคาคิดตามจำนวนวันที่ถือครอง', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S65, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '3 · ซื้อสินทรัพย์' }).click();
  await golden.step('หน้าซื้อสินทรัพย์');

  await page.getByRole('button', { name: '+ บันทึกการซื้อสินทรัพย์' }).click();
  await golden.step('ฟอร์มบันทึกการซื้อสินทรัพย์ถาวร');

  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  const line = (i: number) => page.getByRole('row')
    .filter({ has: page.getByPlaceholder('เช่น เครื่องเชื่อม CO2') }).filter({ visible: true }).nth(i);
  // A line added and taken away again: the form keeps its five.
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดสินทรัพย์' }).click();
  await expect(page.getByPlaceholder('เช่น เครื่องเชื่อม CO2').filter({ visible: true })).toHaveCount(6);
  await line(5).getByRole('button', { name: '×' }).click();
  await expect(page.getByPlaceholder('เช่น เครื่องเชื่อม CO2').filter({ visible: true })).toHaveCount(5);

  await field('วันที่ได้มา *').fill('2026-10-10');
  // A vendor of the register: a cash vendor, so the terms stay cash.
  await field('ผู้ขาย').fill('ร้านยางเจริญยนต์');
  await field('ผู้ขาย').dispatchEvent('change');
  await field('เลขที่ใบกำกับภาษี').fill('TT-6910-0077');
  await expect(page.getByLabel('ภาษีมูลค่าเพิ่ม').filter({ visible: true })).toHaveValue('7');
  await expect(select('เงื่อนไขชำระ')).toHaveValue('cash');
  await expect(field('ครบกำหนดชำระ')).toHaveValue('ชำระทันที');
  await expect(field('จำนวนวันเครดิต')).toBeDisabled();

  await line(0).getByRole('combobox').selectOption('เครื่องมือช่าง');
  await line(0).getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill('เครื่องเชื่อม CO2 / MIG 250A');
  await line(0).getByRole('spinbutton').nth(0).fill('38000');
  await line(0).getByRole('spinbutton').nth(2).fill('1');
  await line(1).getByRole('combobox').selectOption('เครื่องใช้สำนักงาน');
  await line(1).getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill('เครื่องปรับอากาศห้องรับรองลูกค้า 18,000 BTU');
  await line(1).getByRole('spinbutton').nth(0).fill('24500');
  await line(1).getByRole('spinbutton').nth(2).fill('1');
  await line(1).getByRole('spinbutton').nth(2).press('Tab');
  await expect(page.getByText(/^กรอกแล้ว 2 รายการ/).filter({ visible: true })).toBeVisible();
  await expect(page.locator('#yItems tfoot')).toContainText('รวม VAT 66,875.00');
  await golden.step('กรอกสินทรัพย์ 2 รายการ รวม 62,500 บาท');
  // The form has a row more (the payment terms): not S65's screen.

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('row').filter({ hasText: 'เครื่องเชื่อม CO2 / MIG 250A' }).filter({ visible: true })).toBeVisible();
  await golden.step('หลังบันทึก รายการขึ้นในหน้าซื้อสินทรัพย์');
  // The legacy records, with the vendor of the register, the purchase they belong to, the terms and, on the first
  // line, the payment made when saved; the payment is in the audit log.
  const legacy = JSON.parse(legacyStateChange(S65, 'save-assets'));
  const terms = { vendor: 'ร้านยางเจริญยนต์', vendorId: '@DB.vendors[V00004]', grp: '@DB.assets[MA-FA261000001]', term: 'cash', days: 0, due: '2026-10-10' };
  const [welder, ac] = legacy['DB.assets'].added;
  Object.assign(welder, terms, { payments: [{ id: '@DB.assets[MA-FA261000001].payments[#0]', amt: 66875, date: '2026-10-10', method: 'cash',
    by: 'เจ้าของกิจการ / ผู้ดูแลระบบ', note: '', atOnce: true, pvNo: 'MA-PV261000001' }], pvNo: 'MA-PV261000001', paid: true, payDate: '2026-10-10', payMethod: 'cash' });
  Object.assign(ac, terms);
  const audit = legacy['DB.audit'].added;
  audit.push({ ...audit[0], id: '@DB.audit[MA-FA261000001#52]', act: 'pay', note: 'จ่ายเงิน 66,875.00 บาท (เงินสด / โอนทันที) · ใบสำคัญจ่าย MA-PV261000001' });
  await golden.stateChange('save-assets', before, { 'DB.assets': legacy['DB.assets'], 'DB.audit': legacy['DB.audit'], 'DB.seq.MA-PV2610': [null, 1] });
  // S65's list, but for the vendor's name and the buttons: paid assets (all of them here) are cancelled, not deleted.
  const vendorCells = page.getByRole('row').filter({ visible: true }).filter({ hasText: 'TT-6910-0077' }).getByRole('cell').filter({ hasText: 'ร้านยางเจริญยนต์' });
  await expect(vendorCells).toHaveCount(2);
  const list = page.locator('#basTbl');
  await expect(list.getByRole('button', { name: 'ลบ', exact: true })).toHaveCount(0);
  await expect(list.getByRole('button', { name: 'ยกเลิก', exact: true })).toHaveCount(10);
  await golden.screen('asset-list', { mask: [vendorCells, list.getByRole('button', { name: 'ยกเลิก', exact: true })] });

  await page.getByRole('button', { name: 'ดูทะเบียนและค่าเสื่อมราคา' }).click();
  const reg = page.getByRole('row').filter({ hasText: 'เครื่องปรับอากาศห้องรับรองลูกค้า 18,000 BTU' }).filter({ visible: true }).first();
  await reg.waitFor();
  await golden.step('ทะเบียนสินทรัพย์และค่าเสื่อมราคา');
  golden.done();
  // By the day: cost, this year, brought forward, carried forward, net.
  const dep = (name: string) => page.locator('#depTbl').getByRole('row').filter({ hasText: name });
  await expect(dep('เครื่องเชื่อม CO2 / MIG 250A')).toHaveText(/^เครื่องเชื่อม CO2 \/ MIG 250A\s*10\/10\/2569\s*38,000\.00\s*83\.29\s*0\.00\s*83\.29\s*37,916\.71$/);
  await expect(dep('เครื่องปรับอากาศห้องรับรองลูกค้า 18,000 BTU')).toContainText('53.70');
  await expect(dep('คอมพิวเตอร์ POS หน้าร้านพร้อมเครื่องพิมพ์')).toContainText('5,406.23');
  await expect(dep('ลิฟต์ยกรถ 2 เสา 4 ตัน (ตัวที่ 2)')).toHaveText(/^ลิฟต์ยกรถ 2 เสา 4 ตัน \(ตัวที่ 2\)\s*19\/01\/2567\s*185,000\.00\s*28,991\.62\s*72,179\.94\s*101,171\.56\s*83,828\.44$/);
  await expect(page.locator('#depTag')).toHaveText('ปีบัญชี 2569 · ค่าเสื่อมปีนี้ ถึง 13/10/2569 128,718.01 บาท');
  await expect(page.locator('#depTbl tfoot')).toHaveText(/^รวม\s*880,500\.00\s*128,718\.01\s*236,300\.67\s*365,018\.68\s*515,481\.32$/);

  // Printed (the register's PDF button prints the asset register), with the same figures.
  await page.getByRole('group', { name: 'ส่งออกรายการ' }).filter({ visible: true }).getByRole('button', { name: 'PDF' }).click();
  await printed(page, ['ทะเบียนทรัพย์สินและค่าเสื่อมราคา', 'เครื่องเชื่อม CO2 / MIG 250A', '83.29', '128,718.01', '365,018.68', '515,481.32']);

  // The voucher of the payment, printed from the asset's window.
  await reg.getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByRole('heading', { name: 'แก้ไขสินทรัพย์ · MA-FA261000002 · ใบสำคัญจ่าย MA-PV261000001' })).toBeVisible();
  await expect(field('สถานะการชำระ')).toHaveValue('ชำระแล้ว');
  await expect(select('เงื่อนไขชำระ')).toBeDisabled();
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).click();
  await printed(page, ['ใบสำคัญจ่าย', 'MA-PV261000001', 'ร้านยางเจริญยนต์', 'ค่าสินทรัพย์ถาวร เครื่องเชื่อม CO2 / MIG 250A / เครื่องปรับอากาศห้องรับรองลูกค้า 18,000 BTU (ใบกำกับภาษี TT-6910-0077)',
    'MA-FA261000001, MA-FA261000002', '66,875.00']);
  await expect(page.locator('#printStage')).toContainText('เลขประจำตัวผู้เสียภาษี 3100900123456');   /* the vendor's, from the register */
  await app.settle();
  expect((await app.state()).DB.audit.at(-1)).toMatchObject({ kind: 'asset', no: 'MA-FA261000001', act: 'print', note: 'ใบสำคัญจ่าย MA-PV261000001' });
});
