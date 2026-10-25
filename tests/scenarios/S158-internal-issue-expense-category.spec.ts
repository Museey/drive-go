import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S33 in the new system (tests/intentional-changes.json, task 3.6, decision R10-ค):
// an internal issue is an expense at its FIFO cost, under a category chosen on the issue
// ("หมวดค่าใช้จ่าย", next to the department; "ค่าซ่อมแซมและบำรุงรักษา" unless changed).
// The issue keeps the category (expCat) and, once stock is cut, says what it booked:
// 2 bottles of brake fluid at 180 = 360.00. Every step, the rest of each screen and every
// other data change is S33's.
const S33 = 'S33-internal-issue.spec.ts';

test('S158 ระบบใหม่: เบิกอะไหล่ใช้ภายในอู่ เลือกหมวดค่าใช้จ่าย แล้วอนุมัติตัดสต๊อก ลงค่าใช้จ่ายตามทุน FIFO', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S33, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เบิกใช้ภายใน' }).click();
  await golden.step('ทะเบียนใบเบิกของ');

  await page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' }).click();
  await golden.step('ใบเบิกของใหม่');

  await page.getByLabel('ผู้เบิก *').filter({ visible: true }).selectOption({ label: 'EMP003 · วิชัย ขยันงาน (ช่างซ่อมทั่วไป)' });
  await page.getByLabel('แผนก / งานที่นำไปใช้').filter({ visible: true }).fill('แผนกซ่อมบำรุง');
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025 · น้ำมันเบรก DOT4/ }).click();
  await golden.step('เลือกน้ำมันเบรก DOT4 เข้าใบเบิก');

  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').fill('2');
  await line.getByPlaceholder('เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ').fill('เปลี่ยนน้ำมันเบรกรถกระบะของอู่');
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('เบิกเพื่อซ่อมรถของกิจการเอง');
  await golden.step('กรอกจำนวน 2 ชิ้นและเหตุผล');
  const cat = page.getByLabel('หมวดค่าใช้จ่าย').filter({ visible: true });
  await expect(cat).toHaveValue('ค่าซ่อมแซมและบำรุงรักษา');
  // The department box now shares its row with the category.
  const fields = [page.getByLabel('แผนก / งานที่นำไปใช้').filter({ visible: true }).locator('..'), cat.locator('..')];
  await golden.screen('issue-filled', { mask: fields });

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await golden.step('หลังกดอนุมัติเอกสาร');
  const legacy = JSON.parse(legacyStateChange(S33, 'approve-issue'));
  legacy['DB.issues'].added[0].expCat = 'ค่าซ่อมแซมและบำรุงรักษา';
  await golden.stateChange('approve-issue', before, { 'DB.issues': legacy['DB.issues'] });
  const booked = page.getByText(/^ลงบัญชีตามทุน FIFO:/).filter({ visible: true });
  await expect(booked).toHaveText('ลงบัญชีตามทุน FIFO: ค่าใช้จ่ายหมวด ค่าซ่อมแซมและบำรุงรักษา 360.00 บาท');
  await golden.screen('issue-approved', { mask: [...fields, booked] });

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('ปิดหน้าต่างแจ้งอนุมัติ');
  golden.done();
});
