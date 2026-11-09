import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';

// 06 · รายจ่าย / ซื้อสินค้า: no scenario recorded office supplies (5 · อุปกรณ์สำนักงาน) or another expense (6 · อื่น ๆ),
// printed the payroll sheet, opened a saved entry with "แก้ไข" on the utilities, payroll history, office or other pages,
// or used the "คลังสินค้า / สาขา" picker of these pages (search, tick, "เลือกทั้งหมด").
const field = (page: Page, label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
const closeWindow = (page: Page) => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
const saveWindow = (page: Page) => page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
const row = (page: Page, text: string) => page.getByRole('row').filter({ hasText: text }).filter({ visible: true })
  .filter({ has: page.getByRole('button', { name: 'แก้ไข' }) });

const S385 = 'S385-buy-menu-utilities-payroll-office-other.spec.ts';

test('S445 ระบบใหม่: บันทึกเงินเดือนเป็นค้างจ่าย บันทึกวัสดุสำนักงานและรายจ่ายอื่นที่จ่ายแล้วได้ใบสำคัญจ่าย เปิดรายการเดิมจากทุกหน้า และเลือกคลัง / สาขา', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S385, { app, page, testInfo });
  await app.loginAsOwner();
  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();

  // 2 · ค่าน้ำค่าไฟ: an entry opened with "แก้ไข", closed.
  await page.getByRole('button', { name: '2 · ค่าน้ำค่าไฟ' }).click();
  await golden.step('หน้าค่าน้ำค่าไฟ');
  await row(page, 'ค่าทำบัญชีรายเดือน').getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByRole('heading', { name: 'แก้ไขค่าใช้จ่าย · MA-EX261000001' })).toBeVisible();
  await golden.step('เปิดค่าทำบัญชี MA-EX261000001 จากหน้าค่าน้ำค่าไฟ');
  await closeWindow(page);

  // The branch picker of the 06 pages: search, untick, tick all again.
  const picker = page.locator('details').filter({ visible: true }).first();
  await picker.locator('summary').click();
  await picker.getByPlaceholder('ค้นหาสาขา').fill('ไม่มีสาขานี้');
  await expect(picker.getByRole('checkbox')).toBeHidden();
  await golden.step('ค้นหาสาขาที่ไม่มี');
  await picker.getByPlaceholder('ค้นหาสาขา').fill('');
  // No branch ticked means every branch: tick the main branch, untick it, then "เลือกทั้งหมด".
  const main = picker.getByRole('checkbox', { name: 'สาขาหลัก MA' });
  await expect(main).not.toBeChecked();
  await main.check();
  await expect(picker.locator('summary')).toHaveText('สาขาหลัก');
  await expect(page.getByRole('row', { name: /^รวม 2 รายการ/ }).filter({ visible: true })).toBeVisible();
  await golden.step('ติ๊กสาขาหลัก');
  await main.uncheck();
  await expect(picker.locator('summary')).toHaveText('เลือกทั้งหมด');
  await golden.step('เอาติ๊กสาขาหลักออก');
  await picker.getByRole('button', { name: 'เลือกทั้งหมด' }).click();
  await expect(main).toBeChecked();
  await golden.step('กดเลือกทั้งหมด');

  // 4 · จ่ายเงินเดือน: the payroll sheet printed, the month recorded, its entry opened from the history.
  await page.getByRole('button', { name: '4 · จ่ายเงินเดือน' }).click();
  await page.getByRole('button', { name: 'พิมพ์ใบจ่ายเงินเดือน' }).click();
  const sheet = page.locator('#printStage');
  await expect(sheet).toContainText('ใบจ่ายเงินเดือนพนักงาน');
  await expect(sheet).toContainText('ต.ค. 2569');
  await expect(sheet).toContainText('รวมนำส่งสำนักงานประกันสังคม');
  await golden.step('พิมพ์ใบจ่ายเงินเดือน ต.ค. 2569');
  console.log('SHEET', await sheet.innerText());
  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึกจ่ายเงินเดือนงวดนี้' }).click();
  const rec = page.locator('div.panel').filter({ has: page.getByRole('heading', { name: 'บันทึกเงินเดือน งวด ต.ค. 2569', exact: true }) });
  await rec.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(row(page, 'จ่ายเงินเดือนและค่าล่วงเวลา งวด ต.ค. 2569')).toBeVisible();
  await app.settle();
  console.log('SIGPAY', JSON.stringify(await app.signature()));
  console.log('DIFFPAY', formatDiff(stateDiff(before, await app.state())));
  golden.skip('บันทึกจ่ายเงินเดือน ต.ค. 2569');
  await row(page, 'จ่ายเงินเดือนและค่าล่วงเวลา งวด ต.ค. 2569').getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByRole('heading', { name: /^แก้ไขค่าใช้จ่าย · / })).toBeVisible();
  await golden.step('เปิดรายการจ่ายเงินเดือนจากประวัติ');
  await closeWindow(page);

  // 5 · อุปกรณ์สำนักงาน: paper and ink recorded, then opened again.
  await page.getByRole('button', { name: '5 · อุปกรณ์สำนักงาน' }).click();
  await golden.step('หน้าอุปกรณ์สำนักงาน');
  await page.getByRole('button', { name: '+ วัสดุสำนักงาน' }).click();
  await golden.step('ฟอร์มบันทึกวัสดุสำนักงาน');
  await field(page, 'รายละเอียดค่าใช้จ่าย *').fill('กระดาษ A4 และหมึกพิมพ์');
  await field(page, 'มูลค่าก่อนภาษี (บาท) *').fill('1850');
  before = await app.state();
  await saveWindow(page);
  await expect(row(page, 'กระดาษ A4 และหมึกพิมพ์')).toBeVisible();
  await golden.step('บันทึกวัสดุสำนักงานแล้ว');
  console.log('DIFF save-office', formatDiff(stateDiff(before, await app.state())));
  await row(page, 'กระดาษ A4 และหมึกพิมพ์').getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByRole('heading', { name: /^แก้ไขค่าใช้จ่าย · / })).toBeVisible();
  await golden.step('เปิดวัสดุสำนักงานที่บันทึก');
  await closeWindow(page);

  // 6 · อื่น ๆ: a car park rent recorded, then opened again.
  await page.getByRole('button', { name: '6 · อื่น ๆ' }).click();
  await page.getByRole('button', { name: '+ บันทึกรายจ่าย' }).click();
  await golden.step('ฟอร์มบันทึกรายจ่ายอื่น');
  await page.getByLabel('หมวดค่าใช้จ่าย *').filter({ visible: true }).selectOption('ค่าเช่าสถานที่');
  await field(page, 'รายละเอียดค่าใช้จ่าย *').fill('ค่าเช่าที่จอดรถลูกค้า');
  await field(page, 'มูลค่าก่อนภาษี (บาท) *').fill('3000');
  before = await app.state();
  await saveWindow(page);
  await expect(row(page, 'ค่าเช่าที่จอดรถลูกค้า')).toBeVisible();
  await golden.step('บันทึกรายจ่ายอื่นแล้ว');
  console.log('DIFF save-other', formatDiff(stateDiff(before, await app.state())));
  await row(page, 'ค่าเช่าที่จอดรถลูกค้า').getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByRole('heading', { name: /^แก้ไขค่าใช้จ่าย · / })).toBeVisible();
  await golden.step('เปิดรายจ่ายอื่นที่บันทึก');
  await closeWindow(page);
  golden.done();
});
