import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (owner's decision 2026-11-06, NOTES.md "งานบัญชีที่ค้าง" 1): the tax report records the remittance of a
// month's ภ.ง.ด.3 / ภ.ง.ด.53, as ภ.ง.ด.1 is remitted — one payment voucher to กรมสรรพากร for the form's rows not remitted
// yet, which 4.4 then shows remitted (its tick locked); the trial balance's 2050 has what was withheld from vendors and
// loses what was remitted, and cash keeps the tax withheld until it is remitted. The owner may cancel a remittance.
// Fixture: two paid expenses withheld on 13/10 — MA-EX261000001 (ภ.ง.ด.53, 105.00) and MA-EX261000002 (ภ.ง.ด.3, 1,250.00).
async function go(page: Page, menu: string | RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
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
const money = (s: string) => Number(s.replace(/,/g, ''));
const tbRow = (page: Page, code: string) => page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: code, exact: true }) });
/* the trial balance's debit and credit of one account (0 when it has no row) */
async function tb(page: Page, code: string): Promise<[number, number]> {
  await go(page, /^08 บัญชี/, '└ ผังบัญชี');
  const row = tbRow(page, code);
  if (!(await row.count())) return [0, 0];
  const c = await row.getByRole('cell').allTextContents();
  return [money(c[3] || '0') || 0, money(c[4] || '0') || 0];
}
const remitLine = (page: Page) => page.locator('#whtOutTbl tfoot tr.pnd-remit');

test('S265 ระบบใหม่: บันทึกนำส่ง ภ.ง.ด.3 / 53 ของเดือนพร้อมใบสำคัญจ่าย งบทดลอง 2050 และเงินสด แล้วยกเลิกการนำส่ง', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await payVendorWithholding(page);   // MA-PV261000001: 1% of 8,700.00 = 87.00, ภ.ง.ด.53, the goods receipt paid in full

  const [, wht0] = await tb(page, '2050');
  const [cash0] = await tb(page, '1010');
  expect(wht0).toBe(1442);   // 105.00 + 1,250.00 of the expenses (as before) + 87.00 withheld from the vendor

  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await expect(remitLine(page).nth(0)).toHaveText(/ภ\.ง\.ด\.3 ค้างนำส่ง 1,250\.00 บาท/);
  await expect(remitLine(page).nth(1)).toHaveText(/ภ\.ง\.ด\.53 ค้างนำส่ง 192\.00 บาท/);
  await page.getByRole('button', { name: 'บันทึกนำส่ง ภ.ง.ด.53' }).click();
  await expect(page.getByText('นำส่งกรมสรรพากร 192.00 บาท (2 ราย) ภายในวันที่ 7 พฤศจิกายน 2569')).toBeVisible();
  await page.getByLabel('วิธีจ่าย').filter({ visible: true }).selectOption('เงินโอน');
  await page.getByRole('button', { name: 'บันทึกการนำส่ง' }).click();
  await expect(page.getByText('บันทึกนำส่ง ภ.ง.ด.53 เดือนตุลาคม 2569 แล้ว · ใบสำคัญจ่าย MA-PV261000002')).toBeVisible();
  await expect(remitLine(page).nth(1)).toHaveText(/นำส่ง ภ\.ง\.ด\.53 แล้ว 13\/10\/2569 \(เงินโอน\) · ใบสำคัญจ่าย MA-PV261000002/);
  await expect(page.getByRole('button', { name: 'บันทึกนำส่ง ภ.ง.ด.53' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'บันทึกนำส่ง ภ.ง.ด.3' })).toBeVisible();

  // Its voucher: to กรมสรรพากร, one line for the form and month.
  await remitLine(page).nth(1).getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).click();
  const sheet = page.locator('#printStage');
  for (const t of ['กรมสรรพากร', 'MA-PV261000002', 'ภาษีเงินได้หัก ณ ที่จ่าย (ภ.ง.ด.53) เดือนตุลาคม 2569 (2 ราย)', 'MA-EX261000001, MA-PV261000001', '192.00', 'เงินโอน'])
    await expect(sheet).toContainText(t);

  // 4.4 shows both rows remitted with the voucher, their tick locked; the ภ.ง.ด.3 row is still open.
  await go(page, /^04 ใบเสร็จรับเงิน/, '└ 4.4 ใบหัก ณ ที่จ่าย');
  await page.getByRole('tab', { name: 'เราหักผู้ขาย' }).click();
  for (const no of ['MA-EX261000001', 'MA-PV261000001']) {
    const r = page.getByRole('row').filter({ hasText: no }).filter({ visible: true });
    await expect(r.getByRole('checkbox', { name: 'นำส่งแล้ว' })).toBeChecked();
    await expect(r.getByRole('checkbox', { name: 'นำส่งแล้ว' })).toBeDisabled();
    await expect(r).toContainText('13/10/2569 · MA-PV261000002');
  }
  await expect(page.getByRole('row').filter({ hasText: 'MA-EX261000002' }).filter({ visible: true }).getByRole('checkbox', { name: 'นำส่งแล้ว' })).toBeEnabled();

  // The trial balance: 2050 less what was remitted, cash less the payment.
  const [, wht1] = await tb(page, '2050');
  const [cash1] = await tb(page, '1010');
  expect(wht1).toBe(1250);
  expect(Math.round((cash0 - cash1) * 100) / 100).toBe(192);

  await app.settle();
  let db = (await app.state()).DB;
  const stamp = { done: true, date: '2026-10-13', method: 'เงินโอน', pvNo: 'MA-PV261000002', mo: '2026-10', form: '53' };
  expect(db.expenses.find((x: any) => x.no === 'MA-EX261000001').whtRemit).toMatchObject(stamp);
  expect(db.purchases.find((g: any) => g.no === 'MA-RC261000002').payments[0].whtRemit).toMatchObject(stamp);
  expect(db.expenses.find((x: any) => x.no === 'MA-EX261000002').whtRemit?.done).toBeFalsy();
  expect(db.audit.filter((a: any) => /นำส่งภาษีหัก ณ ที่จ่าย \(ภ\.ง\.ด\.53\) เดือนตุลาคม 2569 .* · ใบสำคัญจ่าย MA-PV261000002/.test(a.note)).map((a: any) => a.no))
    .toEqual(['MA-EX261000001', 'MA-RC261000002']);

  // The owner cancels it with a reason: the rows are open again and 2050 has them back.
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await remitLine(page).nth(1).getByRole('button', { name: 'ยกเลิกการนำส่ง' }).click();
  await page.getByText('ระบุเหตุผลที่ยกเลิก (จำเป็น)').locator('..').getByRole('textbox').fill('ลงวันที่ผิด');
  await page.getByRole('button', { name: 'ยืนยันยกเลิกการนำส่ง', exact: true }).click();
  await expect(page.getByText('ยกเลิกการนำส่ง MA-PV261000002 แล้ว')).toBeVisible();
  await expect(page.getByRole('button', { name: 'บันทึกนำส่ง ภ.ง.ด.53' })).toBeVisible();
  const [, wht2] = await tb(page, '2050');
  expect(wht2).toBe(1442);
  await app.settle();
  db = (await app.state()).DB;
  expect(db.expenses.find((x: any) => x.no === 'MA-EX261000001').whtRemit).toEqual({ done: false, date: '' });
  expect(db.audit.at(-1)).toMatchObject({ act: 'payvoid', note: 'ยกเลิกการนำส่งภาษีหัก ณ ที่จ่าย · ใบสำคัญจ่าย MA-PV261000002 — ลงวันที่ผิด' });
});
