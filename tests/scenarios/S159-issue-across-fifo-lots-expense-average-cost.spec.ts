import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S36 in the new system (tests/intentional-changes.json, task 3.6, decisions R10-ค and F4):
// the issue keeps its expense category (expCat, "ค่าซ่อมแซมและบำรุงรักษา" unless changed) and says
// what it booked at FIFO cost — 19 at 850 and 2 at 870 = 17,890.00; the register cost of the brake
// pads is the average of what is left: 856.90 after the goods receipt (29 left), 870 after the
// issue (8 left, all of the new lot). Every step, the rest of each screen and every other data
// change is S36's.
const S36 = 'S36-issue-across-fifo-lots.spec.ts';

test('S159 ระบบใหม่: เบิกใช้ภายในเกินล็อตเก่า ลงค่าใช้จ่ายตามทุน FIFO สองล็อต ทุนในทะเบียนเป็นทุนเฉลี่ยของที่เหลือ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S36, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // เตรียม: ล็อตเก่าของผ้าเบรกหน้า BR-001 เหลือ 19 ชิ้น ทุน 850 · ซื้อเพิ่ม 10 ชิ้น ทุน 870 เป็นล็อตใหม่
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  const grLine = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await grLine.getByRole('spinbutton').nth(0).fill('10');
  await grLine.getByRole('spinbutton').nth(1).fill('870');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('อนุมัติใบรับสินค้า MA-RC261000002 ผ้าเบรกหน้า 10 ชิ้น ทุน 870');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เบิกใช้ภายใน' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' }).click();
  await golden.step('ใบเบิกของใหม่');

  await page.getByLabel('ผู้เบิก *').filter({ visible: true }).selectOption({ label: 'EMP001 · ศักดิ์ชัย มั่นคง (หัวหน้าช่าง)' });
  await page.getByLabel('แผนก / งานที่นำไปใช้').filter({ visible: true }).fill('งานซ่อมรถของกิจการ');
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-001');
  await golden.step('ค้นหา BR-001 (คงเหลือ 29 ชิ้น)');

  await page.getByRole('option', { name: /BR-001 · ผ้าเบรกหน้า Toyota Revo/ }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').fill('21');
  await line.getByPlaceholder('เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ').fill('เปลี่ยนผ้าเบรกรถกระบะทั้งกองของอู่');
  await golden.step('เบิก 21 ชิ้น (มากกว่าล็อตเก่า 19 ชิ้น)');
  const cat = page.getByLabel('หมวดค่าใช้จ่าย').filter({ visible: true });
  await expect(cat).toHaveValue('ค่าซ่อมแซมและบำรุงรักษา');
  const fields = [page.getByLabel('แผนก / งานที่นำไปใช้').filter({ visible: true }).locator('..'), cat.locator('..')];
  await golden.screen('issue-21-filled', { mask: fields });

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await golden.step('หลังกดอนุมัติเอกสาร');
  const legacy = JSON.parse(legacyStateChange(S36, 'approve-issue-fifo'));
  legacy['DB.issues'].added[0].expCat = 'ค่าซ่อมแซมและบำรุงรักษา';
  await golden.stateChange('approve-issue-fifo', before, { 'DB.issues': legacy['DB.issues'], 'DB.stock[BR-001].cost': [856.9, 870] });
  const booked = page.getByText(/^ลงบัญชีตามทุน FIFO:/).filter({ visible: true });
  await expect(booked).toHaveText('ลงบัญชีตามทุน FIFO: ค่าใช้จ่ายหมวด ค่าซ่อมแซมและบำรุงรักษา 17,890.00 บาท');
  await golden.screen('issue-21-approved', { mask: [...fields, booked] });

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('ปิดหน้าต่างแจ้งอนุมัติ');
  golden.done();
});
