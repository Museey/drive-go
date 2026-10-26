import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S46 in the new system (tests/intentional-changes.json, task 3.7, the owner's answer of
// 2026-10-25 "เฉพาะงวดที่บันทึก"): the health page counts payroll once, from the recorded periods.
// Before October is recorded there is no payroll in it (the legacy app added 2,534,500 estimated from
// the staff list) and a line says which months have none; after recording, "เงินเดือนและสวัสดิการพนักงาน"
// is October's 216,500 + 8,800 and the expense category "เงินเดือนและค่าแรงงาน" is not added a second
// time. The figures changed, so the two screens are checked by their text; the steps are S46's
// (the recording now asks first: the legacy step after it is checked here).
// Task 3.13 (R17, answer 13.1): the year's depreciation is worked out by the day, 164,913.43 instead of
// 165,198.35, so the expenses add up to 218,803 before recording and 444,103 after (legacy 219,088 / 444,388).
const S46 = 'S46-payroll-in-finance-health.spec.ts';

test('S166 ระบบใหม่: หน้าสุขภาพการเงินนับเงินเดือนจากงวดที่บันทึกเท่านั้น บอกเดือนที่ยังไม่บันทึก', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S46, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ สุขภาพการเงิน', exact: true }).click();
  await expect(page.getByText('รวม 218,803 บาท', { exact: true })).toBeVisible();
  await expect(page.getByText('เงินเดือนและสวัสดิการพนักงาน', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await expect(page.getByText('เงินเดือนและค่าแรงงาน', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await expect(page.getByText(/^ยังไม่ได้บันทึกเงินเดือน/)).toHaveText('ยังไม่ได้บันทึกเงินเดือน 10 เดือน (ม.ค. 2569 – ต.ค. 2569) — งบและเงินสดยังไม่มีเงินเดือนของเดือนเหล่านั้น (บันทึกที่ 06.4 จ่ายเงินเดือน)');
  const cashRow = (label: string) => page.locator('#cashTbl').getByRole('row').filter({ hasText: label });
  await expect(cashRow('จ่ายเงินเดือนและประกันสังคม')).toHaveText('จ่ายเงินเดือนและประกันสังคม-0.00');
  await golden.step('หน้าสุขภาพการเงินก่อนบันทึกเงินเดือน');

  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '4 · จ่ายเงินเดือน' }).click();
  await golden.step('หน้าจ่ายเงินเดือน');

  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await page.getByText('MA-EX261000004', { exact: true }).filter({ visible: true }).first().waitFor();
  // Asked first, recorded owed (S165 checks the recording): the legacy step's message changed.
  await app.settle();
  expect(await app.signature()).toMatchObject({ messages: ['บันทึกเงินเดือน งวด ต.ค. 2569 แล้ว · เงินเดือน 216,500 + สมทบนายจ้าง 8,800 บาท · ค้างจ่าย'] });
  golden.skip('หลังบันทึกจ่ายเงินเดือน');

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ สุขภาพการเงิน', exact: true }).click();
  await expect(page.getByText('รวม 444,103 บาท', { exact: true })).toBeVisible();
  await expect(page.getByText('เงินเดือนและสวัสดิการพนักงาน', { exact: true })).toBeVisible();
  await expect(page.getByText('เงินเดือนและค่าแรงงาน', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await expect(page.getByText('225,300 บาท', { exact: true })).toBeVisible();
  await expect(page.getByText(/^ยังไม่ได้บันทึกเงินเดือน/)).toHaveText('ยังไม่ได้บันทึกเงินเดือน 9 เดือน (ม.ค. 2569 – ก.ย. 2569) — งบและเงินสดยังไม่มีเงินเดือนของเดือนเหล่านั้น (บันทึกที่ 06.4 จ่ายเงินเดือน)');
  // Recorded, not paid: no cash has left yet.
  await expect(cashRow('จ่ายเงินเดือนและประกันสังคม')).toHaveText('จ่ายเงินเดือนและประกันสังคม-0.00');
  await golden.step('หน้าสุขภาพการเงินหลังบันทึกเงินเดือน');
  golden.done();
});
