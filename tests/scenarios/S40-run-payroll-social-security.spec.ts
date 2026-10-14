import { test } from '../support/test';

test('S40 บันทึกจ่ายเงินเดือนงวด ต.ค. 2569 พร้อมหักประกันสังคม แล้วกดซ้ำถูกเตือนว่างวดนี้บันทึกแล้ว', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).filter({ visible: true }).click();
  await page.getByText('4 · จ่ายเงินเดือน', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).waitFor();
  await golden.step('หน้าจ่ายเงินเดือน งวด ต.ค. 2569');
  await golden.screen('payroll-table');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  const lastRecord = page.getByText('MA-EX261000004', { exact: true }).filter({ visible: true });
  await lastRecord.waitFor();
  await lastRecord.scrollIntoViewIfNeeded();
  await golden.step('หลังบันทึกจ่ายเงินเดือน');
  await golden.screen('payroll-history');

  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  await page.getByRole('button', { name: 'ไม่บันทึก' }).waitFor();
  await golden.step('กดบันทึกซ้ำ ระบบถามว่างวดนี้บันทึกแล้ว');

  await page.getByRole('button', { name: 'ไม่บันทึก' }).click();
  await golden.step('เลือกไม่บันทึกซ้ำ');
  await golden.stateChange('payroll-run', before);
});
