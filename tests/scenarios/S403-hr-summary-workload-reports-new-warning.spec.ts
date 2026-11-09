import { test, expect } from '../support/test';

// 09 งานบุคคล reports: the monthly summary printed, an employee's row opening the work / leave form for him, a record's
// "แก้ไข" in the work and leave log, the mechanics' workload for the month / fiscal year / everything and printed,
// and "+ สร้างใบเตือนใหม่" after opening an issued warning.
test('S403 พิมพ์สรุปรายเดือนงานบุคคล เปิดบันทึกจากแถวพนักงาน ดูปริมาณงานซ่อมสะสมทุกช่วงแล้วพิมพ์ และเริ่มใบเตือนใหม่', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('button', { name: 'สรุปรายเดือน' }).click();
  await golden.step('สรุปรายเดือนงานบุคคล');

  let before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์รายงาน' }).filter({ visible: true }).click();
  await golden.step('กดพิมพ์รายงานสรุปรายเดือน');
  await golden.stateChange('print-hr-summary', before);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#printStage').getByText('วิเคราะห์ รอบคอบ').first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('hr-summary-printed');
  await page.emulateMedia({ media: 'screen' });

  // A row opens the work / leave form with that employee chosen; closed with ปิด.
  await page.getByRole('row').filter({ hasText: 'EMP009' }).click();
  const form = page.locator('#mHr');
  await expect(form).toBeVisible();
  await golden.step('กดแถวของ EMP009 เปิดฟอร์มบันทึกการทำงานและการลา');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await expect(form).toBeHidden();
  await golden.step('ปิดฟอร์มบันทึก');

  // The log: "แก้ไข" opens a record.
  await page.getByRole('button', { name: 'บันทึกการทำงานและการลา' }).click();
  await golden.step('บันทึกการทำงานและการลา');
  await page.getByRole('button', { name: 'แก้ไข', exact: true }).filter({ visible: true }).first().click();
  await expect(form).toBeVisible();
  await golden.step('กดแก้ไขรายการแรก');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await expect(form).toBeHidden();

  // Workload: month, fiscal year, everything; printed.
  await page.getByRole('button', { name: 'ปริมาณงานซ่อมสะสม' }).click();
  await golden.step('ปริมาณงานซ่อมสะสมของช่าง เฉพาะงวดเดือน');
  const scope = page.getByRole('combobox').filter({ has: page.getByRole('option', { name: 'สะสมทั้งปีบัญชี' }) });
  await scope.selectOption({ label: 'สะสมทั้งปีบัญชี' });
  await golden.step('สะสมทั้งปีบัญชี');
  await scope.selectOption({ label: 'สะสมทั้งหมด' });
  await golden.step('สะสมทั้งหมด');
  await golden.screen('workload-all');
  before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์รายงาน' }).filter({ visible: true }).click();
  await golden.step('กดพิมพ์รายงานปริมาณงาน');
  await golden.stateChange('print-workload', before);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#printStage').getByText('สะสมทั้งหมด').first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });

  // Warnings: an issued one opened, then a new blank one.
  await page.getByRole('button', { name: '└ ใบเตือน', exact: true }).click();
  await page.getByRole('row').filter({ hasText: 'MA-WN260800001' }).getByRole('button', { name: 'เปิด' }).click();
  await golden.step('เปิดใบเตือน MA-WN260800001');
  await page.getByRole('button', { name: '+ สร้างใบเตือนใหม่' }).click();
  await golden.step('กดสร้างใบเตือนใหม่ ฟอร์มว่าง');
});
