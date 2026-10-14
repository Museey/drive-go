import { test } from '../support/test';

test('S32 ตรวจนับสินค้าหมวดอะไหล่แอร์ นับขาดและนับเกิน แล้วอนุมัติปรับยอดสต๊อก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'ตรวจนับสินค้า' }).click();
  await golden.step('ทะเบียนใบตรวจนับสินค้า');

  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await golden.step('ใบตรวจนับสินค้าใหม่');

  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await golden.step('ดึงสินค้าหมวดอะไหล่แอร์ 4 รายการ');

  // กรองแอร์นับได้ 17 (ระบบ 19) · น้ำยาแอร์นับได้ 20 (ระบบ 19) · อีก 2 รายการตรงกับระบบ
  await page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ visible: true }).getByRole('spinbutton').fill('17');
  await page.getByRole('row').filter({ hasText: 'AC-230' }).filter({ visible: true }).getByRole('spinbutton').fill('20');
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('ตรวจนับประจำเดือน');
  await golden.step('กรอกยอดนับได้จริง');
  await golden.screen('count-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await golden.step('หลังกดอนุมัติเอกสาร');
  await golden.stateChange('approve-count', before);

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('กลับไปที่ทะเบียนใบตรวจนับ');
  await golden.screen('count-list');
});
