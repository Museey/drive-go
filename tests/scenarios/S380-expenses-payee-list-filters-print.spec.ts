import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// 08 · ค่าใช้จ่ายกิจการ: no scenario opened an expense to look at it ("แก้ไข"), picked a payee from the list in the
// expense window, used "ดูทั้งหมด" (the document list with its own filters and print) or printed the expense register
// ("PDF" on the register prints it with printExpReport, whose own button is hidden).
const combo = (page: Page, scope: string, option: string) =>
  page.locator(scope).getByRole('combobox').filter({ hasText: option }).filter({ visible: true });

test('S380 ค่าใช้จ่ายกิจการ: เปิดดูรายการ เลือกผู้รับเงินจากรายชื่อ ดูทั้งหมดพร้อมตัวกรอง พิมพ์รายการ และพิมพ์รายงาน', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ค่าใช้จ่ายกิจการ', exact: true }).click();
  await golden.step('หน้าค่าใช้จ่ายกิจการ');

  // Open the accounting fee to look at it, try the payee list, then close without saving.
  const fee = page.getByRole('row').filter({ hasText: 'ค่าทำบัญชีรายเดือน' }).filter({ visible: true });
  await fee.getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByRole('heading', { name: 'แก้ไขค่าใช้จ่าย · MA-EX261000001' })).toBeVisible();
  await golden.step('เปิดค่าทำบัญชี MA-EX261000001');
  const payeeList = combo(page, '#mExp', 'เลือกผู้ให้บริการ / ผู้ขาย');
  const payee = page.getByPlaceholder('หรือพิมพ์ชื่อเอง');
  await payeeList.selectOption('การไฟฟ้านครหลวง (MEA)');
  await expect(payee).toHaveValue('การไฟฟ้านครหลวง (MEA)');
  await golden.step('เลือกผู้รับเงิน การไฟฟ้านครหลวง จากรายชื่อ');
  await payeeList.selectOption('อื่น ๆ (พิมพ์เอง)');
  await expect(payee).toHaveValue('');
  await expect(payee).toBeFocused();
  await golden.step('เลือก "อื่น ๆ (พิมพ์เอง)" ช่องชื่อว่างให้พิมพ์เอง');
  const before = await app.state();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('heading', { name: 'แก้ไขค่าใช้จ่าย · MA-EX261000001' })).toBeHidden();
  await golden.step('ปิดหน้าต่างโดยไม่บันทึก');
  await golden.stateChange('close-without-saving', before);

  // "ดูทั้งหมด": the list of every expense with its own filters.
  await page.getByRole('button', { name: 'ดูทั้งหมด' }).click();
  const docs = page.locator('#mDocs');
  await expect(docs.getByRole('heading', { name: 'ค่าใช้จ่ายกิจการ — ดูทั้งหมด' })).toBeVisible();
  await expect(docs.getByRole('row', { name: /^รวม 2 ฉบับ/ })).toBeVisible();
  await golden.step('ดูทั้งหมด 2 ฉบับ');
  await combo(page, '#mDocs', '20 รายการ').selectOption('20 รายการ');
  await golden.step('แสดง 20 รายการ');
  await combo(page, '#mDocs', 'วันปัจจุบัน').selectOption('เดือนปี');
  await expect(docs.getByRole('row', { name: /^รวม 2 ฉบับ/ })).toBeVisible();
  await golden.step('กรองเดือนปี (ตุลาคม 2569)');
  await combo(page, '#mDocs', 'กันยายน').selectOption('กันยายน');
  await expect(docs.getByRole('row', { name: /^รวม 0 ฉบับ/ })).toBeVisible();
  await golden.step('เปลี่ยนเป็นเดือนกันยายน ไม่มีรายการ');
  await combo(page, '#mDocs', 'กันยายน').selectOption('ตุลาคม');
  await expect(docs.getByRole('row', { name: /^รวม 2 ฉบับ/ })).toBeVisible();
  await page.getByRole('button', { name: 'พิมพ์รายการ' }).click();
  const sheet = page.locator('#printStage');
  await expect(sheet).toContainText('ค่าใช้จ่ายกิจการ');
  await expect(sheet).toContainText('รวม 2 ฉบับ');
  await expect(sheet).toContainText('27,145.00');
  await golden.step('พิมพ์รายการค่าใช้จ่าย');
  await docs.getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await expect(docs.getByRole('heading', { name: 'ค่าใช้จ่ายกิจการ — ดูทั้งหมด' })).toBeHidden();
  await golden.step('ปิดหน้าต่างดูทั้งหมด');

  // The expense register of the year, printed with "PDF" (the old "พิมพ์รายงาน" button is hidden and leads here).
  const before2 = await app.state();
  await page.getByRole('button', { name: /^PDF/ }).filter({ visible: true }).first().click();
  await expect(sheet).toContainText('ทะเบียนค่าใช้จ่ายกิจการ');
  await expect(sheet).toContainText('ค่าเช่าอาคารประจำเดือน — คุณสุนทร เจ้าของอาคาร');
  await expect(sheet).toContainText('27,145.00');
  await golden.step('กด PDF พิมพ์ทะเบียนค่าใช้จ่ายกิจการ');
  await golden.stateChange('print-register', before2);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('expense-register-printed');
  await page.emulateMedia({ media: 'screen' });
});
