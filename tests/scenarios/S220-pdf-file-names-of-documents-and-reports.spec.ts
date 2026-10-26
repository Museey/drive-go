import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.14, decision F9 and the owner's answers 14.1–14.4 of 2026-10-26): the browser's print page
// stays, and "Save as PDF" offers a name made from what is printed — <type>_<number>_<party>.pdf for a document
// (the printed heading up to its first " / ", the walk-in customer as "ลูกค้าทั่วไป", "_ยกเลิก" when cancelled),
// <title>_<period> for a report. Browsers take that name from the page's title, which is set while printing and
// put back afterwards (on "afterprint", or on the next print where no "afterprint" comes).
// window.print here records the page's title at the moment the print page would open.
async function recordPrints(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__printed = [];
    w.__noAfterprint = false;
    window.print = () => {
      window.dispatchEvent(new Event('beforeprint'));
      w.__printed.push(document.title);
      if (!w.__noAfterprint) window.dispatchEvent(new Event('afterprint'));
    };
  });
}
const printedSoFar = (page: Page) => page.evaluate(() => (window as any).__printed.length as number);
/* clicks a print button and expects one print, saved under `name`, and the page's own title back after it */
async function printsAs(page: Page, click: () => Promise<void>, name: string, after = OWN) {
  const n = await printedSoFar(page);
  await click();
  await expect.poll(() => page.evaluate(k => (window as any).__printed.slice(k), n)).toEqual([name]);
  await expect(page).toHaveTitle(after);
}
const OWN = 'ระบบบริหารงานอู่ซ่อมรถ';

async function openSale(page: Page, no: string) {
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.1 ตัดสต็อกสินค้า' }).click();
  await page.getByRole('combobox', { name: 'ช่วงวันที่' }).filter({ visible: true }).selectOption('เลือกทั้งหมด');
  await page.getByText(no, { exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'ใบตัดสต็อกขายสินค้า ' + no })).toBeVisible();
}
const closeSale = (page: Page) => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

test('S220 ระบบใหม่: พิมพ์เอกสารและรายงานแล้วบันทึกเป็น PDF ได้ชื่อไฟล์ ประเภท_เลขที่_ลูกค้า หรือ ชื่อรายงาน_งวด แล้วชื่อหน้าต่างกลับเป็นเหมือนเดิม', async ({ app, page }) => {
  test.slow();
  await recordPrints(page);
  await app.loginAsOwner();
  await expect(page).toHaveTitle(OWN);

  // A quotation: the heading "ใบเสนอราคา / ใบอนุมัติซ่อม" gives its first part.
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: 'MA-QT261000001', exact: true }).click();
  await printsAs(page, () => page.getByRole('button', { name: 'พิมพ์ (ต้นฉบับ+สำเนา)' }).click(), 'ใบเสนอราคา_MA-QT261000001_สมชาย ใจดี.pdf');
  await page.keyboard.press('Escape');

  // A tax invoice from the list of 4.6.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  const tx = page.getByRole('row').filter({ hasText: 'MA-TX261000001' }).filter({ visible: true }).first();
  await printsAs(page, () => tx.getByRole('button', { name: 'พิมพ์', exact: true }).click(),
    'ใบกำกับภาษี_MA-TX261000001_บริษัท ขนส่งไทยรุ่งเรือง จำกัด.pdf');

  // A billing note to a customer whose name has dots: the name still ends with .pdf.
  await page.getByRole('button', { name: '└ 4.5 ใบวางบิล' }).click();
  await page.getByRole('button', { name: 'MA-BL261000001', exact: true }).click();
  await printsAs(page, () => page.getByRole('button', { name: 'พิมพ์ใบวางบิล' }).click(), 'ใบวางบิล_MA-BL261000001_หจก. บางมดขนส่ง.pdf');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The 80 mm stock cut of a walk-in sale with VAT: "ใบกำกับภาษีอย่างย่อ", the customer "ลูกค้าทั่วไป".
  await openSale(page, 'MA-SA261000001');
  await printsAs(page, () => page.getByRole('button', { name: 'เอกสารอย่างย่อ', exact: true }).click(),
    'ใบกำกับภาษีอย่างย่อ_MA-SA261000001_ลูกค้าทั่วไป.pdf');
  await printsAs(page, () => page.getByRole('button', { name: 'ใบตัดสต็อกขายสินค้า (A4)' }).click(),
    'ใบตัดสต็อกขายสินค้า_MA-SA261000001_ลูกค้าทั่วไป.pdf');
  await closeSale(page);

  // A cancelled sale: "_ยกเลิก" at the end.
  await openSale(page, 'MA-SA261000012');
  await printsAs(page, () => page.getByRole('button', { name: 'ใบตัดสต็อกขายสินค้า (A4)' }).click(),
    'ใบตัดสต็อกขายสินค้า_MA-SA261000012_ปรีชา ทองสุข_ยกเลิก.pdf');
  await printsAs(page, () => page.getByRole('button', { name: 'เอกสารอย่างย่อ', exact: true }).click(),
    'ใบกำกับภาษีอย่างย่อ_MA-SA261000012_ปรีชา ทองสุข_ยกเลิก.pdf');
  await closeSale(page);

  // Reports: the title and the period they cover, or the day they are printed.
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ ผังบัญชี' }).click();
  await printsAs(page, () => page.getByRole('button', { name: 'พิมพ์งบทดลอง' }).click(), 'งบทดลอง_2026.pdf');
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
  await printsAs(page, () => page.getByRole('button', { name: 'พิมพ์รายงานภาษีทั้งชุด' }).click(), 'รายงานภาษีขาย_2026-10.pdf');
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await printsAs(page, () => page.getByRole('button', { name: 'PDF' }).filter({ visible: true }).first().click(), 'ใบเสนอราคา อนุมัติซ่อม_2026-10-13.pdf');

  // A browser that does not say when printing is over: the name stays until the next print, which names its own
  // file, and the page's own title comes back after that one.
  await page.evaluate(() => { (window as any).__noAfterprint = true; });
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await printsAs(page, () => tx.getByRole('button', { name: 'พิมพ์', exact: true }).click(),
    'ใบกำกับภาษี_MA-TX261000001_บริษัท ขนส่งไทยรุ่งเรือง จำกัด.pdf', 'ใบกำกับภาษี_MA-TX261000001_บริษัท ขนส่งไทยรุ่งเรือง จำกัด.pdf');
  await page.evaluate(() => { (window as any).__noAfterprint = false; });
  const tx2 = page.getByRole('row').filter({ hasText: 'MA-TX261000002' }).filter({ visible: true }).first();
  const n = await printedSoFar(page);
  await tx2.getByRole('button', { name: 'พิมพ์', exact: true }).click();
  await expect.poll(() => page.evaluate(k => (window as any).__printed.slice(k), n)).toEqual([expect.stringMatching(/^ใบกำกับภาษี_MA-TX261000002_.+\.pdf$/)]);
  await expect(page).toHaveTitle(OWN);
});
