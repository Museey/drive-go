import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S382 in the new system (tests/intentional-changes.json, task 3.13, decision R17 and answers 13.1–13.11 of
// 2026-10-26, as S210 replaces S65): an asset bought with VAT needs a vendor of the register, so saving the 11 tools with
// the typed name "บริษัท เครื่องมือช่างไทย จำกัด" (not in 05 ผู้ขาย) is refused and the purchase is made from
// ร้านยางเจริญยนต์ (V00004, a cash vendor: the terms stay "เงินสด / โอนทันที"); bought in cash, the purchase is paid when
// saved with a payment voucher MA-PV261000001, which the asset window's title names. Every other step, message and data
// change is S382's; the tax report's screen is S382's but for the vendor's name on the purchase rows.
const pager = (page: Page, table: string) =>
  page.locator('div.panel').filter({ has: page.getByRole('heading', { name: table, exact: true }) });

const S382 = 'S382-tax-report-pages-month-print.spec.ts';

test('S444 ระบบใหม่: ซื้อเครื่องมือ 11 รายการในใบกำกับเดียวจากผู้ขายในทะเบียน จ่ายเงินสดได้ใบสำคัญจ่าย แล้วดูและพิมพ์รายงานภาษี', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S382, { app, page, testInfo });
  await app.loginAsOwner();
  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '3 · ซื้อสินทรัพย์' }).click();
  await page.getByRole('button', { name: '+ บันทึกการซื้อสินทรัพย์' }).click();
  await golden.step('ฟอร์มบันทึกการซื้อสินทรัพย์ถาวร');

  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await field('ผู้ขาย').fill('บริษัท เครื่องมือช่างไทย จำกัด');
  await field('เลขที่ใบกำกับภาษี').fill('TT-6910-0101');
  const line = (i: number) => page.getByRole('row')
    .filter({ has: page.getByPlaceholder('เช่น เครื่องเชื่อม CO2') }).filter({ visible: true }).nth(i);
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: '+ เพิ่มบรรทัดสินทรัพย์' }).click();
  for (let i = 0; i < 11; i++) {
    await line(i).getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill(`ชุดบล็อกลม ${i + 1}`);
    await line(i).getByRole('spinbutton').nth(0).fill(String(10000 + i * 1000));
  }
  await line(10).getByRole('spinbutton').nth(0).press('Tab');
  await expect(page.getByText(/^กรอกแล้ว 11 รายการ/).filter({ visible: true })).toBeVisible();
  await golden.step('กรอกเครื่องมือ 11 รายการ');
  // A name typed that is not in the register: refused, the form stays open.
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByText(/^เลือกผู้ขายจากทะเบียนผู้ขาย/).filter({ visible: true })).toBeVisible();
  await app.settle();
  expect(await app.signature()).toEqual({ page: ['06 รายจ่าย / ซื้อสินค้า 0 ›', '3 · ซื้อสินทรัพย์'],
    popups: ['บันทึกการซื้อสินทรัพย์ถาวร (กรอกได้หลายรายการ)'],
    messages: ['เลือกผู้ขายจากทะเบียนผู้ขาย — สินทรัพย์ที่มี VAT หรือซื้อเครดิตต้องมีผู้ขายในทะเบียน (05 ผู้ขาย)'] });
  expect((await app.state()).DB.assets.filter((a: any) => a.inv === 'TT-6910-0101')).toEqual([]);
  // A vendor of the register: a cash vendor, so the terms stay cash.
  await field('ผู้ขาย').fill('ร้านยางเจริญยนต์');
  await field('ผู้ขาย').dispatchEvent('change');
  await expect(page.getByLabel('เงื่อนไขชำระ').filter({ visible: true })).toHaveValue('cash');
  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  const saved = page.getByRole('row').filter({ hasText: 'ชุดบล็อกลม 11' }).filter({ visible: true });
  await expect(saved).toBeVisible();
  await golden.step('บันทึกแล้ว 11 รายการขึ้นในหน้าซื้อสินทรัพย์');
  // S382's records with the vendor of the register, the purchase they belong to and its terms, and on the first one
  // the payment made when saved; the payment is in the audit log.
  const legacy = JSON.parse(legacyStateChange(S382, 'save-assets'));
  const terms = { vendor: 'ร้านยางเจริญยนต์', vendorId: '@DB.vendors[V00004]', grp: '@DB.assets[MA-FA261000001]', term: 'cash', days: 0, due: '2026-10-13' };
  const assets = legacy['DB.assets'].added;
  expect(assets.map((a: any) => a.vendor)).toEqual(Array(11).fill('บริษัท เครื่องมือช่างไทย จำกัด'));
  for (const a of assets) Object.assign(a, terms);
  Object.assign(assets[0], { payments: [{ id: '@DB.assets[MA-FA261000001].payments[#0]', amt: 176550, date: '2026-10-13', method: 'cash',
    by: 'เจ้าของกิจการ / ผู้ดูแลระบบ', note: '', atOnce: true, pvNo: 'MA-PV261000001' }], pvNo: 'MA-PV261000001', paid: true, payDate: '2026-10-13', payMethod: 'cash' });
  const audit = legacy['DB.audit'].added;
  audit.push({ ...audit[0], id: '@DB.audit[MA-FA261000001#61]', act: 'pay', note: 'จ่ายเงิน 176,550.00 บาท (เงินสด / โอนทันที) · ใบสำคัญจ่าย MA-PV261000001' });
  await golden.stateChange('save-assets', before, { 'DB.assets': legacy['DB.assets'], 'DB.audit': legacy['DB.audit'], 'DB.seq.MA-PV2610': [null, 1] });

  // "แก้ไข" on the buy page opens the saved item; closed without saving.
  await saved.getByRole('button', { name: 'แก้ไข' }).click();
  // The window's title names the purchase's payment voucher too.
  await expect(page.getByRole('heading', { name: 'แก้ไขสินทรัพย์ · MA-FA261000011 · ใบสำคัญจ่าย MA-PV261000001' })).toBeVisible();
  await app.settle();
  expect(await app.signature()).toEqual({ page: ['06 รายจ่าย / ซื้อสินค้า 0 ›', '3 · ซื้อสินทรัพย์'],
    popups: ['แก้ไขสินทรัพย์ · MA-FA261000011 · ใบสำคัญจ่าย MA-PV261000001'], messages: [] });
  golden.skip('เปิดชุดบล็อกลม 11 จากหน้าซื้อสินทรัพย์');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('heading', { name: /^แก้ไขสินทรัพย์ · / })).toBeHidden();

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี', exact: true }).click();
  const sale = pager(page, 'รายงานภาษีขาย'), buy = pager(page, 'รายงานภาษีซื้อ');
  await expect(sale).toContainText('13 ฉบับ');
  await expect(sale).toContainText('หน้า 1/2');
  await expect(buy).toContainText('11 ฉบับ');
  await expect(buy).toContainText('หน้า 1/2');
  await golden.step('รายงานภาษี ตุลาคม 2569 ภาษีขาย 13 ฉบับ ภาษีซื้อ 11 ฉบับ หน้า 1/2');
  // The purchase rows name the vendor of the register (S382: the typed name), on page 1 the first 10 of the 11.
  const vendorCells = buy.getByRole('row').filter({ hasText: 'TT-6910-0101' }).getByRole('cell').filter({ hasText: 'ร้านยางเจริญยนต์' });
  await expect(vendorCells).toHaveCount(10);
  await expect(buy.getByText('บริษัท เครื่องมือช่างไทย จำกัด')).toHaveCount(0);
  await golden.screen('tax-report-page-1', { mask: [vendorCells] });

  await sale.getByRole('button', { name: '2', exact: true }).click();
  await expect(sale).toContainText('หน้า 2/2');
  await expect(sale.getByRole('row')).toHaveCount(5);   // heading, 3 rows, total
  await golden.step('ภาษีขายหน้า 2');
  await buy.getByRole('button', { name: '›' }).click();
  await expect(buy).toContainText('หน้า 2/2');
  await expect(buy.getByRole('row').filter({ hasText: 'TT-6910-0101' })).toHaveCount(1);
  await golden.step('ภาษีซื้อหน้า 2');
  await buy.getByRole('button', { name: '‹' }).click();
  await expect(buy).toContainText('หน้า 1/2');
  await golden.step('ภาษีซื้อกลับหน้า 1');

  // The tax month: September has nothing, then back to October.
  await page.getByLabel('งวดเดือน').filter({ visible: true }).fill('2026-09');
  await expect(sale).toContainText('0 ฉบับ');
  await expect(page.getByText('งวดนี้ยังไม่มีใบกำกับภาษีขาย')).toBeVisible();
  await golden.step('เปลี่ยนงวดเป็นกันยายน 2569 ไม่มีเอกสาร');
  await page.getByLabel('งวดเดือน').filter({ visible: true }).fill('2026-10');
  await expect(sale).toContainText('13 ฉบับ');
  await golden.step('กลับงวดตุลาคม 2569');

  before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์รายงานภาษีทั้งชุด' }).click();
  const sheet = page.locator('#printStage');
  await expect(sheet).toContainText('รายงานภาษีขาย');
  await expect(sheet).toContainText('รายงานภาษีซื้อ');
  await expect(sheet).toContainText('สรุปภาษีที่ต้องนำส่ง');
  await expect(sheet.locator('tr').filter({ hasText: 'TT-6910-0101' })).toHaveCount(11);
  await expect(sheet.locator('tr').filter({ hasText: 'TT-6910-0101' }).filter({ hasText: 'ร้านยางเจริญยนต์' })).toHaveCount(11);
  await golden.step('พิมพ์รายงานภาษีทั้งชุด (ครบทุกฉบับ)');
  await golden.stateChange('print-tax', before);
  golden.done();
  await expect(sale).toContainText('หน้า 1/2');
});
