import { test } from '../support/test';

test('S34 ส่งเคลมสินค้าชำรุดคืนผู้ขายอ้างอิงใบรับสินค้าและอนุมัติตัดสต๊อก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เคลมผู้ขาย' }).click();
  await golden.step('ทะเบียนใบเคลมผู้ขาย');

  await page.getByRole('button', { name: '+ สร้างใบเคลมใหม่' }).click();
  await golden.step('ใบเคลมสินค้าใหม่');

  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('รุ่งเรือง');
  await page.getByText('บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อผู้ขาย').filter({ visible: true }).click();
  await page.keyboard.type('MA-RC');
  await page.getByText('MA-RC261000001', { exact: true }).filter({ visible: true }).click();
  await golden.step('อ้างอิงใบรับสินค้า MA-RC261000001 (เปิดหน้าหยิบรายการ)');

  await page.getByRole('row').filter({ hasText: 'EL-101' }).getByRole('button', { name: '+ เคลมชิ้นนี้' }).click();
  await page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' }).click();
  await golden.step('หยิบไดชาร์จ EL-101 เข้าใบเคลม');

  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').fill('1');
  await line.getByPlaceholder('เช่น ชำรุดจากการผลิต / ผิดรุ่น / แตกหักระหว่างขนส่ง').fill('ชาร์จไฟไม่เข้าตั้งแต่แกะกล่อง');
  await page.getByLabel('สถานะการเคลม').filter({ visible: true }).selectOption({ label: 'ส่งเคลมแล้ว' });
  await page.getByLabel('ผู้รับเคลม (ฝ่ายผู้ขาย)').filter({ visible: true }).fill('คุณสมพงษ์');
  await page.getByLabel('ผู้ทำเอกสาร').filter({ visible: true }).fill('ศักดิ์ชัย มั่นคง');
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('ผู้ขายรับเคลมและจะส่งของใหม่ภายใน 7 วัน');
  await golden.step('กรอกจำนวน 1 ชิ้น สาเหตุ และสถานะส่งเคลมแล้ว');
  await golden.screen('claim-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await golden.step('หลังกดอนุมัติเอกสาร');
  await golden.stateChange('approve-claim', before);
  await golden.screen('claim-approved');

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('ปิดหน้าต่างแจ้งอนุมัติ');
});
