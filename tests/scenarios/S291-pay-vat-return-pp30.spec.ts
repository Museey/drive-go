import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant round 3, J29; the owner's decision 4 of 2026-11-11, docs/ACCOUNTANT-ANSWERS.md): a month's
// ภ.พ.30 is paid from the tax report, as ภ.ง.ด.3 / 53 are remitted (S265). On 05/11/2569, October's line tells the
// month's own VAT (output 3,631.95, no input), the input VAT the system carries in from the assets bought in 2566–2567
// (all of it used, 53,628.05 carried on to November on 1055) and what is left to pay (0.00). The shop's own return has
// that old VAT settled long ago, so it pays 3,631.95: the amount is what was paid on the return filed. One payment
// voucher to กรมสรรพากร; the general ledger has it on 2040 and the bank; the trial balance on 2040; the owner cancels it
// with a reason and the month is open to pay again.
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const line = (page: Page) => page.locator('#taxSumTbl').getByRole('row').filter({ hasText: /ภ\.พ\.30 (เดือน|แล้ว)/ }).last();

test('S291 ระบบใหม่: บันทึกนำส่ง ภ.พ.30 ของเดือนที่จบแล้ว ยอดที่ระบบคำนวณกับภาษีซื้อยกมา ใบสำคัญจ่าย บัญชีแยกประเภท งบทดลอง และยกเลิกการนำส่ง', async ({ app, page }) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-05T09:00:00+07:00'));
  await app.loginAsOwner();
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await page.getByLabel('งวดเดือน').filter({ visible: true }).fill('2026-10');
  await expect(page.getByText('สรุปภาษีที่ต้องนำส่ง — งวดเดือน ต.ค. 2569', { exact: true })).toBeVisible();
  await expect(line(page)).toHaveText('ภ.พ.30 เดือนตุลาคม 2569: ภาษีขาย − ภาษีซื้อ 3,631.95 บาท · หักภาษีซื้อที่ยกมา 3,631.95 บาท · ต้องชำระ 0.00 บาท · ภาษีซื้อเกินยกไปเดือนถัดไป 53,628.05 บาท (1055 ลูกหนี้กรมสรรพากร) บันทึกนำส่ง ภ.พ.30');

  // Paid as on the return filed.
  await line(page).getByRole('button', { name: 'บันทึกนำส่ง ภ.พ.30' }).click();
  await expect(page.getByText('ชำระกรมสรรพากรภายในวันที่ 15 พฤศจิกายน 2569 · ระบบคำนวณได้ 0.00 บาท')).toBeVisible();
  const amount = page.getByLabel('จำนวนเงินที่ชำระ (ตามแบบที่ยื่น)').filter({ visible: true });
  await expect(amount).toHaveValue('');
  await page.getByRole('button', { name: 'บันทึกการนำส่ง' }).click();
  await expect(page.getByText('กรอกจำนวนเงินที่ชำระให้มากกว่า 0')).toBeVisible();
  await line(page).getByRole('button', { name: 'บันทึกนำส่ง ภ.พ.30' }).click();
  await amount.fill('3631.95');
  await page.getByLabel('วิธีจ่าย').filter({ visible: true }).selectOption('เงินโอน');
  await page.getByRole('button', { name: 'บันทึกการนำส่ง' }).click();
  await expect(page.getByText(/^บันทึกนำส่ง ภ\.พ\.30 เดือนตุลาคม 2569 แล้ว · ใบสำคัญจ่าย MA-PV2611\d{5}$/)).toBeVisible();
  const pv = (await line(page).textContent())!.match(/MA-PV2611\d{5}/)![0];
  await expect(line(page)).toContainText(`นำส่ง ภ.พ.30 แล้ว 05/11/2569 (เงินโอน) 3,631.95 บาท · ใบสำคัญจ่าย ${pv}`);
  await expect(page.getByRole('button', { name: 'บันทึกนำส่ง ภ.พ.30' })).toHaveCount(0);

  // Its voucher: to กรมสรรพากร, one line for the month.
  await line(page).getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).click();
  const sheet = page.locator('#printStage');
  for (const t of ['กรมสรรพากร', pv, 'ภาษีมูลค่าเพิ่ม (ภ.พ.30) เดือนตุลาคม 2569', '3,631.95'])
    await expect(sheet).toContainText(t);
  const db = (await app.state()).DB;
  expect(db.taxPeriods['2026-10'].remit).toMatchObject({ done: true, date: '2026-11-05', method: 'เงินโอน', pvNo: pv, amt: 3631.95 });
  expect(db.audit.find((x: any) => x.kind === 'taxperiod' && x.act === 'pay')).toMatchObject({ act: 'pay', note: `นำส่งภาษีมูลค่าเพิ่ม (ภ.พ.30) เดือนตุลาคม 2569 3,631.95 บาท (เงินโอน) · ใบสำคัญจ่าย ${pv}` });

  // The general ledger: 2040 debited, the bank credited, on the day paid.
  await go(page, /^08 บัญชี/, '└ บัญชีแยกประเภท');
  const ledger = page.locator('#a-ledger');
  for (const [code, dr, cr] of [['2040', '3,631.95', ''], ['1020', '', '3,631.95']]) {
    await ledger.getByLabel('บัญชี', { exact: true }).selectOption(code);
    await expect(ledger.getByRole('row').filter({ hasText: pv }).getByRole('cell'))
      .toHaveText(['05/11/2569', pv, 'นำส่งภาษีมูลค่าเพิ่ม (ภ.พ.30) ตุลาคม 2569', dr, cr, /\d/]);
  }

  // The trial balance: the year's payment on 2040.
  await go(page, /^08 บัญชี/, '└ ผังบัญชี');
  await expect(page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: '2040', exact: true }) }).getByRole('cell'))
    .toHaveText(['2040', 'ภาษีมูลค่าเพิ่มค้างชำระ', /หนี้สิน/, '3,631.95', '']);

  // The owner cancels it with a reason: October is open to pay again.
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await line(page).getByRole('button', { name: 'ยกเลิกการนำส่ง' }).click();
  await page.getByText('ระบุเหตุผลที่ยกเลิก (จำเป็น)').locator('..').getByRole('textbox').fill('ลงจำนวนเงินผิด');
  await page.getByRole('button', { name: 'ยืนยันยกเลิกการนำส่ง', exact: true }).click();
  await expect(page.getByText(`ยกเลิกการนำส่ง ${pv} แล้ว`)).toBeVisible();
  await expect(line(page).getByRole('button', { name: 'บันทึกนำส่ง ภ.พ.30' })).toBeVisible();
  const after = (await app.state()).DB;
  expect(after.taxPeriods['2026-10'].remit).toMatchObject({ done: false, voided: { pvNo: pv, reason: 'ลงจำนวนเงินผิด' } });
  expect(after.audit.find((x: any) => x.kind === 'taxperiod' && x.act === 'payvoid')).toMatchObject({ act: 'payvoid', note: `ยกเลิกการนำส่งภาษีมูลค่าเพิ่ม (ภ.พ.30) · ใบสำคัญจ่าย ${pv} — ลงจำนวนเงินผิด` });
});
