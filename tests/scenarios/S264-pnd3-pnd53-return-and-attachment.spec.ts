import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (owner's request 2026-11-06: the return and its attachment, the payee's branch left blank, the
// buttons on the tax report): 08 บัญชี → รายงานภาษี prints a month's ภ.ง.ด.3 / ภ.ง.ด.53 on the Revenue Department's
// forms — the return (the payer's tax id and branch, the month ticked, the attachment's ราย and แผ่น, the income paid
// and the tax withheld) and its attachment, six ลำดับที่ a sheet numbered on from sheet to sheet, one per payment
// in the order of the tax report and the 50 ทวิ, each sheet with its own totals. Saved as PDF: ภ.ง.ด.3_<yyyy-mm>.
// Fixture: two paid expenses withheld on 13/10 — MA-EX261000001 (สำนักงานบัญชีเลิศพัฒนา, tax id 0105551234567,
// ภ.ง.ด.53, 3% of 3,500.00) and MA-EX261000002 (คุณสุนทร เจ้าของอาคาร, ภ.ง.ด.3, 5% of 25,000.00).
async function go(page: Page, menu: string | RegExp, item: string) {
  const sub = page.getByRole('button', { name: item });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
/* window.print records the page's title (the PDF's name) at the moment the print page would open */
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
async function paidExpense(page: Page, payee: string, tax: string, base: string) {
  await go(page, '06 รายจ่าย / ซื้อสินค้า', '6 · อื่น ๆ');
  await page.getByRole('button', { name: '+ บันทึกรายจ่าย' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await select('หมวดค่าใช้จ่าย *').selectOption('ค่าซ่อมแซมและบำรุงรักษา');
  await field('รายละเอียดค่าใช้จ่าย *').fill('ค่าจ้างซ่อมเครื่องมือ');
  await page.getByPlaceholder('หรือพิมพ์ชื่อเอง').fill(payee);
  await field('เลขประจำตัวผู้เสียภาษีผู้รับเงิน').fill(tax);
  await field('มูลค่าก่อนภาษี (บาท) *').fill(base);
  await select('หักภาษี ณ ที่จ่าย').selectOption('3% (ค่าบริการ / ค่าจ้างทำของ)');
  await select('สถานะ').selectOption('จ่ายแล้ว');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
}
const text = async (l: Locator) => ((await l.textContent()) || '').replace(/\s+/g, ' ').trim();
const sheets = (page: Page) => page.locator('#printStage .sheetpage');
/* prints one form; expects one print saved as `name` and `count` sheets */
async function printForm(page: Page, form: string, name: string, count: number) {
  const before = await page.evaluate(() => (window as any).__printed.length as number);
  await page.getByRole('button', { name: `พิมพ์ ภ.ง.ด.${form} + ใบแนบ` }).click();
  await expect.poll(() => page.evaluate(k => (window as any).__printed.slice(k), before)).toEqual([name]);
  await expect(sheets(page)).toHaveCount(count);
}

test('S264 ระบบใหม่: พิมพ์ ภ.ง.ด.3 / ภ.ง.ด.53 พร้อมใบแนบตามแบบสรรพากร จากหน้ารายงานภาษี แผ่นละ 6 ลำดับ ลำดับต่อเนื่องทุกแผ่น', async ({ app, page }) => {
  test.slow();
  await recordPrints(page);
  await app.loginAsOwner();
  await payVendorWithholding(page);   // MA-PV261000001: 1% of 8,700.00 = 87.00, ภ.ง.ด.53, the vendor's address in the register
  const people: [string, string, string][] = [
    ['นาย สมชาย ใจดี', '3100600100011', '1000'], ['นางสาว สมหญิง รักงาน', '3100600100022', '2000'],
    ['นาย ประสิทธิ์ ช่างดี', '3100600100033', '3000'], ['นาย วิชัย เก่งกาจ', '3100600100044', '4000'],
    ['นาง มาลี ขยัน', '3100600100055', '5000'], ['นาย บุญมี มีสุข', '3100600100066', '6000']];
  for (const [payee, tax, base] of people) await paidExpense(page, payee, tax, base);   // MA-EX261000003 … 008: 3%, ภ.ง.ด.3

  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await expect(page.getByRole('button', { name: 'พิมพ์ ภ.ง.ด.3 + ใบแนบ' })).toBeVisible();

  // ภ.ง.ด.53: the return and one sheet of the attachment.
  await printForm(page, '53', 'ภ.ง.ด.53_2026-10.pdf', 2);
  const ret53 = await text(sheets(page).nth(0));
  for (const t of ['แบบยื่นรายการภาษีเงินได้หัก ณ ที่จ่าย', 'ภ.ง.ด.53', '0-1055-45001-23-4', 'สาขาที่ 00000', 'Drivego Service',
    '123/45 ถ.พระราม 2 แขวงบางมด เขตจอมทอง กรุงเทพมหานคร 10150', 'รหัสไปรษณีย์ 10150', 'พ.ศ. 2569', '✓(10) ตุลาคม', '(9) กันยายน',
    '✓(1) มาตรา 3 เตรส', '✓ใบแนบ ภ.ง.ด.53 ที่แนบมาพร้อมนี้ : จำนวน 2 ราย จำนวน 1 แผ่น',
    '1. รวมยอดเงินได้ทั้งสิ้น 12,200.00', '2. รวมยอดภาษีที่นำส่งทั้งสิ้น 192.00', '3. เงินเพิ่ม (ถ้ามี)', 'ผู้จ่ายเงิน'])
    expect(ret53).toContain(t);
  expect(ret53).not.toContain('✓(9) กันยายน');
  expect(ret53).not.toContain('✓(1) ยื่นปกติ');
  const att53 = sheets(page).nth(1);
  const a53 = await text(att53);
  for (const t of ['ใบแนบ ภ.ง.ด.53', '0-1055-45001-23-4', 'สาขาที่ 00000', 'แผ่นที่ 1 ในจำนวน 1 แผ่น',
    'รวมยอดเงินได้และภาษีที่นำส่ง (นำไปรวมกับใบแนบ ภ.ง.ด.53 แผ่นอื่น (ถ้ามี)) 12,200.00 192.00', '(ให้กรอกลำดับที่ต่อเนื่องกันไปทุกแผ่น)'])
    expect(a53).toContain(t);
  const row53 = (who: string) => text(att53.getByRole('row', { includeHidden: true }).filter({ hasText: who }));
  expect(await row53('สำนักงานบัญชีเลิศพัฒนา')).toBe('1 0-1055-51234-56-7 ชื่อ สำนักงานบัญชีเลิศพัฒนา ที่อยู่ 13/10/2569 ค่าบริการ / ค่าจ้างทำของ 3 3,500.00 105.00 1');
  expect(await row53('หจก. ไทยพาร์ท ซัพพลาย')).toBe('2 0-1035-45006-78-9 ชื่อ หจก. ไทยพาร์ท ซัพพลาย ที่อยู่ 145 ซ.ประชาอุทิศ 33 ถ.ประชาอุทิศ แขวงบางมด เขตทุ่งครุ กรุงเทพมหานคร 10140 13/10/2569 ค่าขนส่ง 1 8,700.00 87.00 1');

  // ภ.ง.ด.3: seven payments — the return, sheet 1 with ลำดับที่ 1–6 and sheet 2 with 7, each sheet its own totals.
  await printForm(page, '3', 'ภ.ง.ด.3_2026-10.pdf', 3);
  const ret3 = await text(sheets(page).nth(0));
  for (const t of ['ภ.ง.ด.3', 'มาตรา 59 แห่งประมวลรัษฎากร', '✓(1) มาตรา 3 เตรส', '(2) มาตรา 48 ทวิ', '✓(10) ตุลาคม',
    '✓ใบแนบ ภ.ง.ด.3 ที่แนบมาพร้อมนี้ : จำนวน 7 ราย จำนวน 2 แผ่น', '1. รวมยอดเงินได้ทั้งสิ้น 46,000.00', '2. รวมยอดภาษีที่นำส่งทั้งสิ้น 1,880.00'])
    expect(ret3).toContain(t);
  const [s1, s2] = [sheets(page).nth(1), sheets(page).nth(2)];
  expect(await text(s1)).toContain('แผ่นที่ 1 ในจำนวน 2 แผ่น');
  expect(await text(s1)).toContain('รวมยอดเงินได้และภาษีที่นำส่ง (นำไปรวมกับใบแนบ ภ.ง.ด.3 แผ่นอื่น (ถ้ามี)) 40,000.00 1,700.00');
  expect(await text(s1)).toContain('(ให้กรอกลำดับที่ต่อเนื่องกันไปทุกแผ่นตามเงินได้แต่ละประเภท)');
  expect(await text(s1.getByRole('row', { includeHidden: true }).filter({ hasText: 'เจ้าของอาคาร' })))
    .toBe('1 3-1012-00456-78-9 ชื่อ คุณสุนทร ชื่อสกุล เจ้าของอาคาร ที่อยู่ 13/10/2569 ค่าเช่า 5 25,000.00 1,250.00 1');
  expect(await text(s1.getByRole('row', { includeHidden: true }).filter({ hasText: 'มาลี' })))
    .toBe('6 3-1006-00100-05-5 ชื่อ นาง มาลี ชื่อสกุล ขยัน ที่อยู่ 13/10/2569 ค่าบริการ / ค่าจ้างทำของ 3 5,000.00 150.00 1');
  expect(await text(s2)).toContain('แผ่นที่ 2 ในจำนวน 2 แผ่น');
  expect(await text(s2)).toContain('รวมยอดเงินได้และภาษีที่นำส่ง (นำไปรวมกับใบแนบ ภ.ง.ด.3 แผ่นอื่น (ถ้ามี)) 6,000.00 180.00');
  expect(await text(s2.getByRole('row', { includeHidden: true }).filter({ hasText: 'บุญมี' })))
    .toBe('7 3-1006-00100-06-6 ชื่อ นาย บุญมี ชื่อสกุล มีสุข ที่อยู่ 13/10/2569 ค่าบริการ / ค่าจ้างทำของ 3 6,000.00 180.00 1');

  // The page's own title is back after printing; a month without withholding has no buttons.
  await expect(page).toHaveTitle('ระบบบริหารงานอู่ซ่อมรถ');
  await page.getByRole('textbox', { name: 'งวดเดือน' }).fill('2026-09');
  await page.getByRole('textbox', { name: 'งวดเดือน' }).dispatchEvent('change');
  await expect(page.getByRole('button', { name: /^พิมพ์ ภ\.ง\.ด\.(3|53) \+ ใบแนบ$/ })).toHaveCount(0);
});
