import { test } from '../support/test';

test('S35 เพิ่มอะไหล่ใหม่ในทะเบียนพร้อมยอดยกมาและราคาขาย 3 ระดับจากกำไร %', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await golden.step('ทะเบียนอะไหล่');

  await page.getByRole('button', { name: '+ เพิ่มอะไหล่' }).click();
  await golden.step('หน้ารายละเอียดสินค้า (เพิ่มรายการใหม่)');

  await page.getByLabel('รหัสสินค้าของอู่ *').filter({ visible: true }).fill('BR-030');
  await page.getByLabel('รหัสสินค้าอ้างอิง (OEM)').filter({ visible: true }).fill('04465-0K290');
  await page.getByLabel('ชื่อสินค้า *').filter({ visible: true }).fill('ผ้าเบรกหน้า Isuzu D-Max');
  // ช่องหมวดอะไหล่ในหน้าต่างนี้ (ไม่ใช่ตัวกรอง "ทุกหมวด" ของหน้าทะเบียนที่อยู่ด้านหลัง)
  await page.getByRole('combobox')
    .filter({ has: page.getByRole('option', { name: 'ระบบเบรก', exact: true }) })
    .filter({ hasNot: page.getByRole('option', { name: /ทุกหมวด/ }) })
    .filter({ visible: true })
    .selectOption('ระบบเบรก');
  await page.getByLabel('ราคาซื้อ (ต้นทุน)').filter({ visible: true }).fill('900');
  const margin = page.getByPlaceholder('กำไร %').filter({ visible: true });
  await margin.nth(0).fill('75');
  await margin.nth(1).fill('60');
  await margin.nth(2).fill('50');
  await page.getByLabel('ปริมาณคงคลัง').filter({ visible: true }).fill('6');
  await page.getByLabel('Min — จุดสั่งซื้อ (เตือนสีเหลือง)').filter({ visible: true }).fill('2');
  await page.getByLabel('Max — ระดับสูงสุด (เตือนสีแดงอ่อน)').filter({ visible: true }).fill('10');
  await golden.step('กรอกรหัส ชื่อ หมวด ต้นทุน 900 กำไร 75/60/50% ยอด 6 ชิ้น');
  await golden.screen('item-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await golden.step('หลังกดบันทึก');
  await golden.stateChange('save-item', before);

  await page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true }).fill('BR-030');
  await page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true }).press('Enter');
  await golden.step('ค้นหา BR-030 ในทะเบียนอะไหล่');
  await golden.screen('item-in-list');
});
