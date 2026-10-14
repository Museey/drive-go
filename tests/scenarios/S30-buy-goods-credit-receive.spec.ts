import { test } from '../support/test';

test('S30 ซื้อสินค้าเงินเชื่อจากผู้ขายและอนุมัติใบรับสินค้าเข้าสต๊อก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await golden.step('ทะเบียนใบรับสินค้า / ซื้อสินค้า');

  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await golden.step('ใบรับสินค้าใหม่');

  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await golden.step('เลือกผู้ขาย หจก. ไทยพาร์ท ซัพพลาย (เครดิต 15 วัน)');

  await page.getByLabel('เลขที่ใบส่งของ/ใบกำกับผู้ขาย').filter({ visible: true }).fill('TP-2610-0451');

  const search = page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true });
  const lines = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });

  // ผ้าเบรกหน้า 10 ชิ้น ราคาใหม่ 870 (เดิม 850)
  await search.click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  await lines.nth(0).getByRole('spinbutton').nth(0).fill('10');
  await lines.nth(0).getByRole('spinbutton').nth(1).fill('870');

  // ลูกหมากปีกนกล่าง 4 ชิ้น ราคาเดิม 650
  await search.click();
  await page.keyboard.type('SU-350');
  await page.getByText('SU-350 · ลูกหมากปีกนกล่าง').filter({ visible: true }).click();
  await lines.nth(1).getByRole('spinbutton').nth(0).fill('4');
  await golden.step('กรอกรายการสินค้า 2 รายการ');
  await golden.screen('gr-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await golden.step('หลังกดอนุมัติเอกสาร');
  await golden.stateChange('approve-gr', before);
  await golden.screen('gr-approved');

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('ปิดหน้าต่างแจ้งอนุมัติ');
});
