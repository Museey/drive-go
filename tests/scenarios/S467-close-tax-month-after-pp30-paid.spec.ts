import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New system (team's check of 2026-11-18): a month whose ภ.พ.30 was paid first (S291) can still be closed (S141) and
// opened again. Paying it made the month's tax-period record without a history, and closing then failed: no message, no
// audit entry, nothing saved. Now the close starts the history, the record keeps its payment, and both are saved.
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const popup = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const line = (page: Page) => page.locator('#taxSumTbl').getByRole('row').filter({ hasText: /ภ\.พ\.30 (เดือน|แล้ว)/ }).last();

test('S467 ระบบใหม่: บันทึกนำส่ง ภ.พ.30 ของเดือน ต.ค. 2569 ก่อน แล้วปิดงวดภาษีเดือนนั้นได้ ลงประวัติ และเจ้าของเปิดงวดกลับได้', async ({ app, page }) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-05T09:00:00+07:00'));
  await app.loginAsOwner();
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await page.getByLabel('งวดเดือน').filter({ visible: true }).fill('2026-10');

  // October's ภ.พ.30 paid first.
  await line(page).getByRole('button', { name: 'บันทึกนำส่ง ภ.พ.30' }).click();
  await page.getByLabel('จำนวนเงินที่ชำระ (ตามแบบที่ยื่น)').filter({ visible: true }).fill('3631.95');
  await page.getByLabel('วิธีจ่าย').filter({ visible: true }).selectOption('เงินโอน');
  await page.getByRole('button', { name: 'บันทึกการนำส่ง' }).click();
  await expect(page.getByText(/^บันทึกนำส่ง ภ\.พ\.30 เดือนตุลาคม 2569 แล้ว · ใบสำคัญจ่าย MA-PV2611\d{5}$/)).toBeVisible();
  const pv = (await line(page).textContent())!.match(/MA-PV2611\d{5}/)![0];

  // Then the month is closed: the message, the closed state, the history and the audit log; the payment stays.
  await page.getByRole('button', { name: 'ปิดงวดภาษี', exact: true }).click();
  await popup(page, 'ปิดงวดภาษีเดือน ต.ค. 2569?').getByRole('button', { name: 'ปิดงวดภาษี', exact: true }).click();
  await expect(page.getByText('ปิดงวดภาษีเดือน ต.ค. 2569 แล้ว', { exact: true })).toBeVisible();
  await expect(page.getByText('ปิดงวดภาษีแล้ว', { exact: true })).toBeVisible();
  await expect(page.getByText('05/11/2569 · เจ้าของกิจการ / ผู้ดูแลระบบ', { exact: true })).toBeVisible();
  await expect(line(page)).toContainText(`นำส่ง ภ.พ.30 แล้ว 05/11/2569 (เงินโอน) 3,631.95 บาท · ใบสำคัญจ่าย ${pv}`);
  await app.settle();
  let db = (await app.state()).DB;
  const closing = { date: '2026-11-05', at: '2026-11-05T02:00:00.000Z', by: '', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' };
  expect(db.taxPeriods['2026-10']).toMatchObject({ closed: true, ...closing, hist: [{ act: 'close', ...closing }],
    remit: { done: true, date: '2026-11-05', method: 'เงินโอน', pvNo: pv, amt: 3631.95 } });
  expect(db.audit.at(-1)).toMatchObject({ kind: 'taxperiod', act: 'close', no: '2026-10', note: 'ปิดงวดภาษีเดือน ต.ค. 2569' });

  // The owner opens it again, with a reason.
  await page.getByRole('button', { name: 'เปิดงวดกลับ', exact: true }).click();
  const reopen = popup(page, 'เปิดงวดภาษีเดือน ต.ค. 2569 กลับ');
  await reopen.getByRole('textbox').fill('ปิดงวดก่อนได้รับใบกำกับภาษีซื้อจากผู้ขายครบ');
  await reopen.getByRole('button', { name: 'เปิดงวดกลับ', exact: true }).click();
  await expect(page.getByText('เปิดงวดภาษีเดือน ต.ค. 2569 กลับแล้ว', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ปิดงวดภาษี', exact: true })).toBeVisible();
  await app.settle();
  db = (await app.state()).DB;
  expect(db.taxPeriods['2026-10']).toMatchObject({ closed: false, hist: [{ act: 'close' },
    { act: 'open', reason: 'ปิดงวดก่อนได้รับใบกำกับภาษีซื้อจากผู้ขายครบ', date: '2026-11-05' }], remit: { done: true, pvNo: pv } });
  expect(db.audit.at(-1)).toMatchObject({ kind: 'taxperiod', act: 'reopen', no: '2026-10',
    note: 'เปิดงวดภาษีเดือน ต.ค. 2569 กลับ · เหตุผล: ปิดงวดก่อนได้รับใบกำกับภาษีซื้อจากผู้ขายครบ' });
});
