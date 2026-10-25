import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S66 in the new system (tests/intentional-changes.json, task 3.6, decision R10-ค):
// the issue form has the expense category next to the department (S158); a cancelled issue
// keeps it, can no longer change it, and books nothing. Every step, data change and the rest
// of each screen is S66's.
const S66 = 'S66-cancel-internal-issue.spec.ts';

test('S164 ระบบใหม่: ยกเลิกใบเบิกใช้ภายในที่อนุมัติแล้ว ระบบคืนสต๊อก ไม่มีค่าใช้จ่ายของใบที่ยกเลิก', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S66, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // เตรียม: เบิกน้ำมันเบรก DOT4 2 ขวด แล้วอนุมัติตัดสต๊อก (แบบเดียวกับ S33)
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เบิกใช้ภายใน' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' }).click();
  await page.getByLabel('ผู้เบิก *').filter({ visible: true }).selectOption({ label: 'EMP003 · วิชัย ขยันงาน (ช่างซ่อมทั่วไป)' });
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025 · น้ำมันเบรก DOT4/ }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').fill('2');
  await line.getByPlaceholder('เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ').fill('เปลี่ยนน้ำมันเบรกรถกระบะของอู่');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const row = page.getByRole('row').filter({ hasText: 'MA-WD261000001' }).filter({ visible: true });
  await expect(row).toBeVisible();
  await golden.step('ทะเบียนใบเบิกของมี MA-WD261000001 ที่อนุมัติแล้ว');

  await row.getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(page.getByText('ใบนี้ตัดสต๊อกไปแล้ว ระบบจะคืนสต๊อกให้อัตโนมัติ', { exact: false })).toBeVisible();
  await golden.step('ถามเหตุผลที่ยกเลิก และแจ้งว่าจะคืนสต๊อก');
  await golden.screen('confirm-cancel-issue');

  // ช่องเหตุผลอยู่ใต้ข้อความถามในป๊อปอัพ
  await page.getByText(/^ระบุเหตุผลที่ยกเลิก/).locator('..').getByRole('textbox').fill('เบิกผิด ยังไม่ได้ใช้ของ นำกลับเข้าคลัง');
  const before = await app.state();
  await page.getByRole('button', { name: 'ยืนยันยกเลิก' }).click();
  await expect(row.getByRole('button', { name: 'ยกเลิก' })).toHaveCount(0);
  await golden.step('หลังยกเลิกใบเบิก');
  await golden.stateChange('cancel-issue', before);
  // Legacy behaviour: the issue form opens again after cancelling from the list.
  const cat = page.getByLabel('หมวดค่าใช้จ่าย').filter({ visible: true });
  await expect(cat).toHaveValue('ค่าซ่อมแซมและบำรุงรักษา');
  await expect(cat).toBeDisabled();
  await expect(page.getByText(/^ลงบัญชีตามทุน FIFO:/).filter({ visible: true })).toHaveCount(0);
  await golden.screen('issue-form-after-cancel', { mask: [page.getByLabel('แผนก / งานที่นำไปใช้').filter({ visible: true }).locator('..'), cat.locator('..')] });

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await row.scrollIntoViewIfNeeded();
  await golden.step('ทะเบียนใบเบิกหลังยกเลิก');
  await golden.screen('issue-list-after-cancel');
  golden.done();
});
