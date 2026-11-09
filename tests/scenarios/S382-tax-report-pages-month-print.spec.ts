import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// 08 · รายงานภาษี: no scenario opened it on the original. Its sales and purchase tax tables show 10 documents a page;
// October 2569 has 13 tax invoices, and a tool set of 11 items bought on one VAT invoice makes 11 purchase tax rows.
// The pages are turned, the tax month changed, and the whole set printed (every row, not just the page on screen).
const pager = (page: Page, table: string) =>
  page.locator('div.panel').filter({ has: page.getByRole('heading', { name: table, exact: true }) });

test('S382 รายงานภาษี: ซื้อเครื่องมือ 11 รายการในใบกำกับเดียว เปลี่ยนหน้าภาษีขายและภาษีซื้อ เปลี่ยนงวดเดือน แล้วพิมพ์รายงานภาษีทั้งชุด', async ({ app, page, golden }) => {
  test.slow();
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
  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  const saved = page.getByRole('row').filter({ hasText: 'ชุดบล็อกลม 11' }).filter({ visible: true });
  await expect(saved).toBeVisible();
  await golden.step('บันทึกแล้ว 11 รายการขึ้นในหน้าซื้อสินทรัพย์');
  await golden.stateChange('save-assets', before);

  // "แก้ไข" on the buy page opens the saved item; closed without saving.
  await saved.getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByRole('heading', { name: /^แก้ไขสินทรัพย์ · / })).toBeVisible();
  await golden.step('เปิดชุดบล็อกลม 11 จากหน้าซื้อสินทรัพย์');
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
  await golden.screen('tax-report-page-1');

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
  await golden.step('พิมพ์รายงานภาษีทั้งชุด (ครบทุกฉบับ)');
  await golden.stateChange('print-tax', before);
  await expect(sale).toContainText('หน้า 1/2');
});
