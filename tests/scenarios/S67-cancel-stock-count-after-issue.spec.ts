import { test, expect } from '../support/test';

test('S67 ยกเลิกใบตรวจนับหลังมีการเบิกสินค้าตัวเดียวกันไปแล้ว', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // เตรียม 1: ตรวจนับหมวดอะไหล่แอร์ AC-215 นับได้ 17 (ระบบ 19) แล้วอนุมัติ (แบบเดียวกับ S32 แต่ปรับรายการเดียว)
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'ตรวจนับสินค้า' }).click();
  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ visible: true }).getByRole('spinbutton').fill('17');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('อนุมัติใบตรวจนับ MA-CT261000001 แล้ว (AC-215 19 → 17)');

  // เตรียม 2: เบิกกรองแอร์ AC-215 ใช้ภายใน 1 ชิ้น (17 → 16)
  await page.getByRole('button', { name: 'เบิกใช้ภายใน' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' }).click();
  await page.getByLabel('ผู้เบิก *').filter({ visible: true }).selectOption({ label: 'EMP003 · วิชัย ขยันงาน (ช่างซ่อมทั่วไป)' });
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('AC-215');
  await page.getByRole('option', { name: /AC-215/ }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').fill('1');
  await line.getByPlaceholder('เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ').fill('เปลี่ยนกรองแอร์ห้องรับรองลูกค้า');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('อนุมัติใบเบิก MA-WD261000001 แล้ว (AC-215 17 → 16)');

  await page.getByRole('button', { name: 'ตรวจนับสินค้า' }).click();
  const row = page.getByRole('row').filter({ hasText: 'MA-CT261000001' }).filter({ visible: true });
  await expect(row).toBeVisible();
  await golden.step('ทะเบียนใบตรวจนับ');

  await row.getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(page.getByText('ใบนี้ปรับยอดสต๊อกไปแล้ว ระบบจะคืนยอดกลับไปเป็นก่อนตรวจนับ', { exact: false })).toBeVisible();
  await golden.step('ถามเหตุผลที่ยกเลิก และแจ้งว่าจะคืนยอดกลับไปเป็นก่อนตรวจนับ');
  await golden.screen('confirm-cancel-count');

  // ช่องเหตุผลอยู่ใต้ข้อความถามในป๊อปอัพ
  await page.getByText(/^ระบุเหตุผลที่ยกเลิก/).locator('..').getByRole('textbox').fill('นับผิดชั้นวาง');
  const before = await app.state();
  await page.getByRole('button', { name: 'ยืนยันยกเลิก' }).click();
  await expect(row.getByRole('button', { name: 'ยกเลิก' })).toHaveCount(0);
  await golden.step('หลังยกเลิกใบตรวจนับ');
  await golden.stateChange('cancel-count', before);
  // Legacy behaviour: the count form opens again after cancelling from the list.
  await golden.screen('count-form-after-cancel');

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await row.scrollIntoViewIfNeeded();
  await golden.step('ทะเบียนใบตรวจนับหลังยกเลิก');
  await golden.screen('count-list-after-cancel');
});
