import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.3, decisions F2, T2–T5): closing a month's VAT. On
// 02/11/2569 the owner closes October in 08 → รายงานภาษี. Documents with VAT
// dated in October are then locked (a sale cannot be cancelled, an asset with
// VAT cannot be recorded in October) while money is still received as usual;
// a full tax invoice can still be issued for an October sale after a warning,
// and October's sales tax report keeps the number it was filed under. The
// owner opens the month again with a reason. The legacy app has no closing.
const popup = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const LOCKED = 'เดือน ต.ค. 2569 ปิดงวดภาษีแล้ว ใช้ใบลดหนี้แทน';

async function taxReport(page: Page, month: string) {
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
  await page.getByLabel('งวดเดือน').filter({ visible: true }).fill(month);
}

test('S141 ระบบใหม่: ปิดงวดภาษีเดือน ต.ค. 2569 เอกสารที่มี VAT ของเดือนนั้นแก้ไม่ได้ รับเงินได้ ออกใบกำกับเต็มรูปภายหลังได้ และเจ้าของเปิดงวดกลับได้', async ({ app, page }) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-02T09:00:00+07:00'));
  await app.loginAsOwner();

  // November has not ended: nothing to close. October can be closed.
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
  await expect(page.getByLabel('งวดเดือน').filter({ visible: true })).toHaveValue('2026-11');
  await expect(page.getByRole('button', { name: 'ปิดงวดภาษี', exact: true })).toHaveCount(0);
  await page.getByLabel('งวดเดือน').filter({ visible: true }).fill('2026-10');
  await expect(page.getByText('สรุปภาษีที่ต้องนำส่ง — งวดเดือน ต.ค. 2569', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ปิดงวดภาษี', exact: true }).click();
  const ask = popup(page, 'ปิดงวดภาษีเดือน ต.ค. 2569?');
  await expect(ask.getByText('หลังปิดงวด เอกสารที่มี VAT ของเดือนนี้แก้ได้ด้วยใบลดหนี้เท่านั้น', { exact: true })).toBeVisible();
  await ask.getByRole('button', { name: 'ปิดงวดภาษี', exact: true }).click();
  await expect(page.getByText('ปิดงวดภาษีแล้ว', { exact: true })).toBeVisible();
  await expect(page.getByText('02/11/2569 · เจ้าของกิจการ / ผู้ดูแลระบบ', { exact: true })).toBeVisible();
  await app.settle();
  let db = (await app.state()).DB;
  const closing = { date: '2026-11-02', at: '2026-11-02T02:00:00.000Z', by: '', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' };
  expect(db.taxPeriods).toEqual({ '2026-10': { closed: true, ...closing, hist: [{ act: 'close', ...closing }] } });
  expect(db.audit.at(-1)).toMatchObject({ kind: 'taxperiod', act: 'close', no: '2026-10', note: 'ปิดงวดภาษีเดือน ต.ค. 2569' });

  // An October sale cannot be cancelled any more; it can still be paid.
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  let before = (await app.state()).DB;
  await page.getByRole('button', { name: 'ยกเลิกเอกสาร', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText(LOCKED, { exact: true })).toBeVisible();
  await app.settle();
  expect((await app.state()).DB).toEqual(before);

  await page.getByRole('button', { name: 'รับชำระ', exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await app.settle();
  db = (await app.state()).DB;
  expect(db.receipts.find((r: any) => r.no === 'MA-SA261000003').payments).toEqual([
    expect.objectContaining({ date: '2026-11-02', amt: 9913.55, method: 'cash' })]);
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();

  // An asset with VAT cannot be recorded in October any more.
  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '3 · ซื้อสินทรัพย์' }).click();
  await page.getByRole('button', { name: '+ บันทึกการซื้อสินทรัพย์' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await field('วันที่ได้มา *').fill('2026-10-20');
  const line = page.getByRole('row').filter({ has: page.getByPlaceholder('เช่น เครื่องเชื่อม CO2') }).filter({ visible: true }).first();
  await line.getByRole('combobox').selectOption('เครื่องมือช่าง');
  await line.getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill('เครื่องเชื่อม CO2 / MIG 250A');
  await line.getByRole('spinbutton').nth(0).fill('38000');
  await line.getByRole('spinbutton').nth(0).press('Tab');
  before = (await app.state()).DB;
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByText(LOCKED, { exact: true })).toBeVisible();
  await app.settle();
  expect((await app.state()).DB.assets).toEqual(before.assets);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // A full tax invoice for an October sale: a warning first, then dated on the sale (05/10).
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await page.getByRole('button', { name: '+ ออกใบกำกับภาษีใหม่' }).click();
  await page.getByRole('row').filter({ hasText: 'MA-SA261000011' }).filter({ visible: true }).getByRole('radio').check();
  await page.getByRole('button', { name: 'ออกใบกำกับภาษี', exact: true }).click();
  await expect(page.getByPlaceholder('13 หลัก').filter({ visible: true })).toHaveValue('0105550990011');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  const warn = popup(page, 'เดือน ต.ค. 2569 ปิดงวดภาษีแล้ว');
  await expect(warn.getByText('ใบกำกับภาษีเต็มรูปลงวันที่ขาย 05/10/2569 รายงานภาษีขายของเดือนนั้นยังแสดงเลขเดิม MA-SA261000011 และยอดภาษีไม่เปลี่ยน', { exact: true })).toBeVisible();
  await warn.getByRole('button', { name: 'ออกใบกำกับภาษี', exact: true }).click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบกำกับภาษี (ต้นฉบับ + สำเนา)' })).toBeVisible();
  await app.settle();
  db = (await app.state()).DB;
  expect(db.receipts.find((r: any) => r.no === 'MA-SA261000011').taxDocs).toEqual([{ no: 'MA-TX261100001', date: '2026-10-05', cancelled: false,
    cancelReason: '', cancelDate: '', issued: '2026-11-02', rate: 7, base: 1260, vat: 88.2, gross: 1348.2, late: true }]);
  await page.getByRole('button', { name: 'ปิดหน้าต่าง' }).filter({ visible: true }).click();

  // October's sales tax report still lists the sale under MA-SA261000011 and notes the late invoice.
  await taxReport(page, '2026-10');
  const report = page.locator('div').filter({ has: page.getByRole('heading', { name: 'รายงานภาษีขาย' }) }).filter({ has: page.getByRole('table') }).last();
  await report.getByRole('button', { name: '›', exact: true }).click();
  const row = report.getByRole('row').filter({ hasText: 'MA-SA261000011' });
  await expect(row).toContainText('ออกใบเต็มรูปภายหลัง เลขที่ MA-TX261100001');
  await expect(row).toContainText('88.20');

  // The owner opens October again: the reason is required and goes into the audit log.
  await page.getByRole('button', { name: 'เปิดงวดกลับ', exact: true }).click();
  const reopen = popup(page, 'เปิดงวดภาษีเดือน ต.ค. 2569 กลับ');
  await expect(reopen.getByText('เหตุผลที่เปิดงวดกลับ', { exact: true })).toBeVisible();
  await expect(reopen.getByRole('button', { name: 'เปิดงวดกลับ', exact: true })).toBeDisabled();
  await reopen.getByRole('textbox').fill('ปิดงวดก่อนได้รับใบกำกับภาษีซื้อจากผู้ขายครบ');
  await reopen.getByRole('button', { name: 'เปิดงวดกลับ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'ปิดงวดภาษี', exact: true })).toBeVisible();
  await app.settle();
  db = (await app.state()).DB;
  expect(db.taxPeriods['2026-10']).toMatchObject({ closed: false, hist: [{ act: 'close' },
    { act: 'open', reason: 'ปิดงวดก่อนได้รับใบกำกับภาษีซื้อจากผู้ขายครบ', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ', date: '2026-11-02' }] });
  expect(db.audit.at(-1)).toMatchObject({ kind: 'taxperiod', act: 'reopen', no: '2026-10',
    note: 'เปิดงวดภาษีเดือน ต.ค. 2569 กลับ · เหตุผล: ปิดงวดก่อนได้รับใบกำกับภาษีซื้อจากผู้ขายครบ' });
});
