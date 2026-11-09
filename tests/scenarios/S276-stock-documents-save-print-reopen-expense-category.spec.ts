import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S275 in the new system (tests/intentional-changes.json, task 3.6, decision R10-ค, as S158 replaces S33):
// the internal issue keeps its expense category (expCat, "ค่าซ่อมแซมและบำรุงรักษา" unless changed) when saved.
// Every step and every other data change is S275's.
const S275 = 'S275-stock-documents-save-print-reopen.spec.ts';

test('S276 ระบบใหม่: ใบเบิก (มีหมวดค่าใช้จ่าย) ใบตรวจนับ ใบเคลม บันทึกที่แถบข้าง พิมพ์ แล้วเปิดใบเดิมจากปุ่ม "เปิด" ในทะเบียน', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S275, { app, page, testInfo });
  test.slow();
  await app.loginAsOwner();
  const rail = page.getByRole('toolbar', { name: 'เครื่องมือ' }).filter({ visible: true });
  const close = () => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const reg = (no: string) => page.getByRole('row').filter({ hasText: no }).filter({ visible: true }).first();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });

  // Internal issue: save as pending with the rail, print, close, open again from the register.
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เบิกใช้ภายใน' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' }).click();
  await page.getByLabel('ผู้เบิก *').filter({ visible: true }).selectOption({ label: 'EMP003 · วิชัย ขยันงาน (ช่างซ่อมทั่วไป)' });
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025 · น้ำมันเบรก DOT4/ }).click();
  await line.getByRole('spinbutton').fill('1');
  await line.getByPlaceholder('เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ').fill('เติมน้ำมันเบรกรถกระบะของอู่');
  await golden.step('กรอกใบเบิกน้ำมันเบรก DOT4 1 ชิ้น');
  let before = await app.state();
  await rail.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('button', { name: /^พิมพ์ใบเบิก/ })).toBeVisible();
  await golden.step('บันทึกใบเบิกด้วยปุ่มบันทึกที่แถบข้าง');
  const legacy = JSON.parse(legacyStateChange(S275, 'save-issue'));
  legacy['DB.issues'].added[0].expCat = 'ค่าซ่อมแซมและบำรุงรักษา';
  await golden.stateChange('save-issue', before, { 'DB.issues': legacy['DB.issues'] });
  before = await app.state();
  await page.getByRole('button', { name: /^พิมพ์ใบเบิก/ }).click();
  await golden.step('กดพิมพ์ใบเบิก');
  await golden.stateChange('print-issue', before);
  await close();
  await reg('MA-WD261000001').getByRole('button', { name: 'เปิด', exact: true }).click();
  await expect(page.getByRole('button', { name: /^พิมพ์ใบเบิก/ })).toBeVisible();
  await golden.step('กด "เปิด" ที่ MA-WD261000001 ในทะเบียนใบเบิก');
  await close();

  // Stock count.
  await page.getByRole('button', { name: 'ตรวจนับสินค้า' }).click();
  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await golden.step('ใบตรวจนับใหม่ ดึงหมวดอะไหล่แอร์');
  before = await app.state();
  await rail.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('button', { name: /^พิมพ์ใบตรวจนับ/ })).toBeVisible();
  await golden.step('บันทึกใบตรวจนับด้วยปุ่มบันทึกที่แถบข้าง');
  await golden.stateChange('save-count', before);
  before = await app.state();
  await page.getByRole('button', { name: /^พิมพ์ใบตรวจนับ/ }).click();
  await golden.step('กดพิมพ์ใบตรวจนับ');
  await golden.stateChange('print-count', before);
  await close();
  await reg('MA-CT261000001').getByRole('button', { name: 'เปิด', exact: true }).click();
  await expect(page.getByRole('button', { name: /^พิมพ์ใบตรวจนับ/ })).toBeVisible();
  await golden.step('กด "เปิด" ที่ MA-CT261000001 ในทะเบียนใบตรวจนับ');
  await close();

  // Vendor claim: save, print, open again.
  await page.getByRole('button', { name: 'เคลมผู้ขาย' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเคลมใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('รุ่งเรือง');
  await page.getByText('บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อผู้ขาย').filter({ visible: true }).click();
  await page.keyboard.type('MA-RC');
  await page.getByText('MA-RC261000001', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('row').filter({ hasText: 'EL-101' }).getByRole('button', { name: '+ เคลมชิ้นนี้' }).click();
  await page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' }).click();
  await line.getByRole('spinbutton').fill('1');
  await line.getByPlaceholder('เช่น ชำรุดจากการผลิต / ผิดรุ่น / แตกหักระหว่างขนส่ง').fill('ชาร์จไฟไม่เข้าตั้งแต่แกะกล่อง');
  await golden.step('กรอกใบเคลมไดชาร์จ EL-101 1 ชิ้น');
  before = await app.state();
  await rail.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('button', { name: /^พิมพ์ใบเคลม/ })).toBeVisible();
  await golden.step('บันทึกใบเคลม');
  await golden.stateChange('save-claim', before);
  before = await app.state();
  await page.getByRole('button', { name: /^พิมพ์ใบเคลม/ }).click();
  await golden.step('กดพิมพ์ใบเคลม');
  await golden.stateChange('print-claim', before);
  await close();
  await reg('MA-CL261000001').getByRole('button', { name: 'เปิด', exact: true }).click();
  await expect(page.getByRole('button', { name: /^พิมพ์ใบเคลม/ })).toBeVisible();
  await golden.step('กด "เปิด" ที่ MA-CL261000001 ในทะเบียนใบเคลม');
  golden.done();
});
