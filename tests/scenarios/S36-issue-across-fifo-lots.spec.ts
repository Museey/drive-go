import { test } from '../support/test';

test('S36 ซื้อผ้าเบรกเพิ่มราคาใหม่แล้วเบิกใช้ภายในเกินล็อตเก่า ตัดต้นทุนตาม FIFO สองล็อต', async ({ app, page, golden }) => {
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
  await golden.screen('issue-21-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await golden.step('หลังกดอนุมัติเอกสาร');
  await golden.stateChange('approve-issue-fifo', before);
  await golden.screen('issue-21-approved');

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('ปิดหน้าต่างแจ้งอนุมัติ');
});
