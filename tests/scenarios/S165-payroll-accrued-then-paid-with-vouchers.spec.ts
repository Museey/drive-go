import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S40 in the new system (tests/intentional-changes.json, task 3.7, decisions R12, R13, F5):
// - social security: 5% of salary (+ regular income) between 1,650 and 17,500 (2026), at most 875 —
//   the legacy app used 15,000 / 750 and counted the fixed overtime and bonus as income every month;
//   overtime and bonus are now typed on the page for the month (0 here): October totals 216,500,
//   8,800 each side, 207,700 net, 17,600 to remit;
// - recording writes the two expenses dated 31 Oct unpaid ("ค้างจ่าย"), with a payroll period;
//   pressing again is refused (cancel the period first) — the legacy app offered "บันทึกซ้ำ";
// - "จ่ายเงินเดือน" pays the salaries (net) and "นำส่งประกันสังคม" the contribution, each with a
//   date, a method and a payment voucher; each employee has a payslip.
// The first two steps are S40's; the screen of the table and the rest changed on purpose.
const S40 = 'S40-run-payroll-social-security.spec.ts';
const printed = async (page: Page, texts: string[]) => {
  await page.emulateMedia({ media: 'print' });
  for (const text of texts) await expect(page.locator('#printStage').getByText(text, { exact: true }).first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
};
const asked = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

test('S165 ระบบใหม่: บันทึกเงินเดือนงวด ต.ค. 2569 เป็นค้างจ่าย ประกันสังคมเพดาน 17,500 กดซ้ำถูกปฏิเสธ แล้วจ่ายเงินเดือนและนำส่งประกันสังคมพร้อมใบสำคัญจ่ายและสลิป', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S40, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');
  // The home page's social security panel is an estimate until the month is recorded, and says so.
  const ssoTag = page.locator('#ssoHomeBox').getByText(/^11 คน/);
  await expect(ssoTag).toHaveText('11 คน · ประมาณการ');
  await expect(ssoTag).toHaveAttribute('title', 'ยังไม่ได้บันทึกเงินเดือนงวด ต.ค. 2569 (06.4 จ่ายเงินเดือน)');

  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).filter({ visible: true }).click();
  await page.getByText('4 · จ่ายเงินเดือน', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).waitFor();
  await golden.step('หน้าจ่ายเงินเดือน งวด ต.ค. 2569');

  const table = page.locator('#payTbl');
  const row = (code: string) => table.getByRole('row').filter({ hasText: code });
  // EMP001: salary 25,000 → 875 (ceiling 17,500); EMP003 12,000 → 600; overtime, bonus and the tax withheld (task 3.8) start at 0.
  await expect(row('EMP001').getByRole('cell')).toHaveText(['EMP001', 'ศักดิ์ชัย มั่นคง', 'หัวหน้าช่าง', '25,000.00', '', '', '25,000.00', '875.00', '', '24,125.00', '875.00']);
  await expect(row('EMP001').getByLabel('ค่าล่วงเวลา EMP001')).toHaveValue('');
  await expect(row('EMP003').getByRole('cell').nth(7)).toHaveText('600.00');
  await expect(table.getByRole('row').filter({ hasText: 'รวม 11 คน' })).toContainText('216,500.00');
  await expect(table.getByRole('row').filter({ hasText: 'รวม 11 คน' }).getByRole('cell')).toHaveText(['รวม 11 คน', '216,500.00', '8,800.00', '0.00', '207,700.00', '8,800.00']);
  await expect(table.getByRole('row').filter({ hasText: 'ยอดที่ต้องนำส่งประกันสังคม' })).toContainText('17,600.00');
  await expect(page.getByText(/^ยังไม่ได้บันทึกงวด ต\.ค\. 2569/)).toContainText('ประกันสังคม 5% ฐาน 1,650 – 17,500 บาท (หักสูงสุด 875 บาท)');

  // Recorded as owed on 31 Oct.
  const before = (await app.state()).DB;
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  const rec = asked(page, 'บันทึกเงินเดือน งวด ต.ค. 2569');
  await expect(rec.getByText('ลงค่าใช้จ่ายวันที่ 31/10/2569 (สิ้นงวด)', { exact: true })).toBeVisible();
  await expect(rec.getByLabel('สถานะ')).toHaveValue('0');
  await rec.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText('บันทึกเงินเดือน งวด ต.ค. 2569 แล้ว · เงินเดือน 216,500 + สมทบนายจ้าง 8,800 บาท · ค้างจ่าย', { exact: true }).filter({ visible: true })).toBeVisible();
  // The legacy app recorded both as paid at once, and its second press asked "บันทึกซ้ำ".
  golden.skip('หลังบันทึกจ่ายเงินเดือน');
  await app.settle();
  const recorded = (await app.state()).DB;
  const added = recorded.expenses.filter((x: any) => !before.expenses.some((b: any) => b.id === x.id));
  const period = recorded.payroll[0];
  expect(added).toEqual([
    expect.objectContaining({ no: 'MA-EX261000003', date: '2026-10-31', cat: 'เงินเดือนและค่าแรงงาน', desc: 'จ่ายเงินเดือนและค่าล่วงเวลา งวด ต.ค. 2569',
      payee: 'พนักงาน 11 คน', base: 216500, paid: false, method: '', note: 'หักประกันสังคมลูกจ้าง 8,800.00 บาท · จ่ายสุทธิ 207,700.00 บาท', payroll: period.id, payPart: 'pay' }),
    expect.objectContaining({ no: 'MA-EX261000004', date: '2026-10-31', desc: 'เงินสมทบประกันสังคมส่วนนายจ้าง งวด ต.ค. 2569', payee: 'สำนักงานประกันสังคม',
      base: 8800, paid: false, note: 'นำส่งพร้อมส่วนลูกจ้าง รวม 17,600.00 บาท', payroll: period.id, payPart: 'sso' }),
  ]);
  expect(period).toMatchObject({ month: '2026-10', label: 'งวด ต.ค. 2569', date: '2026-10-31', payNo: 'MA-EX261000003', ssoNo: 'MA-EX261000004', cancelled: false,
    totals: { n: 11, gross: 216500, emp: 8800, er: 8800, net: 207700 }, sso: { rate: 5, min: 1650, max: 17500, cap: 875 } });
  expect(period.lines.find((l: any) => l.code === 'EMP001')).toMatchObject({ salary: 25000, regular: 0, ot: 0, bonus: 0, gross: 25000, days: 31, full: true, ssoBase: 17500, ssoEmp: 875, ssoEr: 875, net: 24125 });
  expect(recorded.seq['MA-EX2610']).toBe(4);
  expect(recorded.audit.at(-1)).toMatchObject({ kind: 'expense', no: 'MA-EX261000003', act: 'save',
    note: 'บันทึกเงินเดือน งวด ต.ค. 2569 · 11 คน รวม 216,500.00 บาท · หักประกันสังคม 8,800.00 บาท · จ่ายสุทธิ 207,700.00 บาท · นายจ้างสมทบ 8,800.00 บาท · ค้างจ่าย' });
  await expect(page.getByText(/^บันทึกแล้ว · รายจ่าย MA-EX261000003 \(เงินเดือน\) และ MA-EX261000004 \(นายจ้างสมทบ\)$/)).toBeVisible();
  await expect(page.getByText('เงินเดือนค้างจ่าย', { exact: true })).toBeVisible();
  await expect(page.getByText('ประกันสังคมค้างนำส่ง', { exact: true })).toBeVisible();

  // The same month again: refused.
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  await expect(page.getByText('งวด ต.ค. 2569 บันทึกแล้ว (MA-EX261000003) — ต้องยกเลิกงวดเดิมก่อนจึงจะบันทึกใหม่ได้', { exact: true }).filter({ visible: true })).toBeVisible();
  golden.skip('กดบันทึกซ้ำ ระบบถามว่างวดนี้บันทึกแล้ว');
  golden.skip('เลือกไม่บันทึกซ้ำ');
  golden.done();
  await app.settle();
  expect((await app.state()).DB.expenses.length).toBe(recorded.expenses.length);

  // Salaries paid today by transfer: the voucher takes the contributions off (its layout: S256).
  await page.getByRole('button', { name: 'จ่ายเงินเดือน', exact: true }).click();
  const pay = asked(page, 'จ่ายเงินเดือน งวด ต.ค. 2569');
  await expect(pay.getByText('จ่ายสุทธิให้พนักงาน 11 คน 207,700.00 บาท (รวมรายได้ 216,500.00 หักประกันสังคม 8,800.00)', { exact: true })).toBeVisible();
  await expect(pay.getByLabel('วันที่จ่าย')).toHaveValue('2026-10-13');
  await pay.getByLabel('วิธีจ่าย').selectOption('เงินโอน');
  await pay.getByRole('button', { name: 'บันทึกการจ่าย' }).click();
  await expect(page.getByText('บันทึกจ่ายเงินเดือน งวด ต.ค. 2569 แล้ว · ใบสำคัญจ่าย MA-PV261000001', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText('จ่ายแล้ว 13/10/2569 (เงินโอน) · ใบสำคัญจ่าย MA-PV261000001', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).first().click();
  await printed(page, ['ใบสำคัญจ่าย', 'MA-PV261000001', 'พนักงาน 11 คน', 'เงินเดือนและค่าจ้าง งวด ต.ค. 2569 (11 คน)', '216,500.00',
    'หัก เงินสมทบประกันสังคม (ส่วนลูกจ้าง)', '8,800.00', '207,700.00', 'เงินโอน']);

  // The contribution remitted: employees' and employer's parts, the second voucher.
  await page.getByRole('button', { name: 'นำส่งประกันสังคม', exact: true }).click();
  const sso = asked(page, 'นำส่งประกันสังคม งวด ต.ค. 2569');
  await expect(sso.getByText('นำส่งสำนักงานประกันสังคม 17,600.00 บาท (ลูกจ้าง 8,800.00 + นายจ้าง 8,800.00) ภายในวันที่ 15 ของเดือนถัดไป', { exact: true })).toBeVisible();
  await sso.getByRole('button', { name: 'บันทึกการนำส่ง' }).click();
  await expect(page.getByText('บันทึกนำส่งประกันสังคม งวด ต.ค. 2569 แล้ว · ใบสำคัญจ่าย MA-PV261000002', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: 'พิมพ์ใบสำคัญจ่าย' }).last().click();
  await printed(page, ['MA-PV261000002', 'สำนักงานประกันสังคม', 'เงินสมทบประกันสังคมส่วนนายจ้าง งวด ต.ค. 2569',
    'เงินสมทบประกันสังคมส่วนลูกจ้าง (หักจากเงินเดือน งวด ต.ค. 2569)', '17,600.00']);
  await app.settle();
  const paid = (await app.state()).DB;
  expect(paid.expenses.filter((x: any) => x.payroll === period.id)).toEqual([
    expect.objectContaining({ no: 'MA-EX261000003', paid: true, payDate: '2026-10-13', method: 'เงินโอน', pvNo: 'MA-PV261000001' }),
    expect.objectContaining({ no: 'MA-EX261000004', paid: true, payDate: '2026-10-13', method: 'เงินโอน', pvNo: 'MA-PV261000002' }),
  ]);
  expect(paid.audit.filter((a: any) => a.kind === 'expense' && a.act === 'pay').map((a: any) => a.note)).toEqual([
    'จ่ายเงินเดือน งวด ต.ค. 2569 สุทธิ 207,700.00 บาท (เงินโอน) · ใบสำคัญจ่าย MA-PV261000001',
    'นำส่งประกันสังคม งวด ต.ค. 2569 17,600.00 บาท (ลูกจ้าง 8,800.00 + นายจ้าง 8,800.00) (เงินโอน) · ใบสำคัญจ่าย MA-PV261000002',
  ]);

  // EMP003's payslip.
  await row('EMP003').getByRole('button', { name: 'สลิปเงินเดือน' }).click();
  await printed(page, ['สลิปเงินเดือน', 'EMP003 · วิชัย ขยันงาน', '12,000.00', 'เงินสมทบประกันสังคม 5% (ฐาน 12,000.00)', '600.00', '11,400.00',
    '13/10/2569', 'ผู้รับเงิน']);
  await app.settle();
  expect((await app.state()).DB.audit.at(-1)).toMatchObject({ act: 'print', note: 'สลิปเงินเดือน งวด ต.ค. 2569 · EMP003' });

  // Recorded: the home page shows the month's figures, no longer an estimate.
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await expect(ssoTag).toHaveText('11 คน');
  await expect(page.locator('#ssoHomeBox').getByRole('row').filter({ hasText: 'รวมนำส่งสำนักงานประกันสังคม' }).getByRole('cell'))
    .toHaveText(['รวมนำส่งสำนักงานประกันสังคม', '216,500.00', '8,800.00', '8,800.00', '17,600.00']);
});
