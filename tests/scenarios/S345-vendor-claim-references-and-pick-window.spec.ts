import { test, expect } from '../support/test';

// Parts of the vendor claim window no scenario used (docs/BEHAVIORS.md): "ดูทั้งหมด", the ✕ of the vendor, purchase
// and sale references, a sale reference that drops the purchase reference and fills the plate, "ดึงรายการจากใบที่อ้างอิง",
// and in "หยิบรายการเข้าใบเคลม": "ดึงรายการจาก", "แสดง … รายการ", the search box (typing, Enter adds the one found),
// a column header sorted from the keyboard, ✕; then × of a claim line.
test('S345 ใบเคลมผู้ขาย: เลือกและล้างใบอ้างอิง ค้นหาในหน้าต่างหยิบรายการ กด Enter เพิ่ม แล้วลบบรรทัดเคลม', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เคลมผู้ขาย' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเคลมใหม่' }).click();
  await golden.step('ใบเคลมสินค้าใหม่');

  await page.getByRole('button', { name: 'ดูทั้งหมด' }).filter({ visible: true }).click();
  await golden.step('กดดูทั้งหมด เห็นรายการใบเคลม');
  await page.getByRole('heading', { name: 'ใบเคลมสินค้า — ดูทั้งหมด' }).locator('xpath=ancestor::div[.//button][1]')
    .getByRole('button', { name: '✕' }).click();
  await golden.step('ปิดรายการใบเคลมทั้งหมด');

  const field = (label: string) => page.locator('label').filter({ hasText: label }).filter({ visible: true });
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('รุ่งเรือง');
  await page.getByText('บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด', { exact: true }).filter({ visible: true }).click();
  await field('ชื่อผู้ขาย *').getByTitle('ล้างผู้ขายที่เลือก').click();
  await golden.step('เลือกผู้ขายแล้วกด ✕ ล้างผู้ขาย');

  // อ้างอิงใบรับสินค้า → หน้าต่างหยิบรายการ
  await page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อผู้ขาย').filter({ visible: true }).click();
  await page.keyboard.type('MA-RC');
  await page.getByText('MA-RC261000001', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' })).toBeVisible();
  await golden.step('อ้างอิงใบรับสินค้า MA-RC261000001 เปิดหน้าหยิบรายการ');

  await page.getByLabel('ดึงรายการจาก').selectOption('all');
  await golden.step('ดึงรายการจากสินค้าทั้งคลัง');
  await page.getByLabel(/^แสดง/).filter({ visible: true }).last().selectOption('25');
  await golden.step('แสดงหน้าละ 25 รายการ');
  await page.getByRole('columnheader', { name: /^รหัสสินค้า/ }).focus();
  await page.keyboard.press('Enter');
  await golden.step('กด Enter ที่หัวคอลัมน์รหัสสินค้า เรียงตามรหัส');
  const q = page.getByPlaceholder('ค้นหา รหัส / OEM / ชื่อ / แบรนด์');
  await q.pressSequentially('EL-118');
  await golden.step('พิมพ์ค้นหา EL-118 เหลือแบตเตอรี่ 75Ah');
  await q.press('Enter');
  await expect(page.getByRole('button', { name: 'อยู่ในใบเคลมแล้ว' })).toBeVisible();
  await golden.step('กด Enter เพิ่มแบตเตอรี่เข้าใบเคลม');
  await golden.screen('pick-window');
  await page.getByRole('button', { name: /✕/ }).filter({ visible: true }).last().click();
  await golden.step('กด ✕ ปิดหน้าต่างหยิบรายการ');

  // อ้างอิงใบเสร็จขาย: ล้างอ้างอิงใบรับสินค้าให้ และดึงทะเบียนรถ
  await page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อลูกค้า / ทะเบียนรถ').filter({ visible: true }).click();
  await page.keyboard.type('MA-SA261000003');
  await page.getByText(/^MA-SA261000003/).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' })).toBeVisible();
  await golden.step('อ้างอิงใบเสร็จขาย MA-SA261000003 ล้างอ้างอิงใบรับสินค้า ดึงทะเบียนรถ');
  await page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' }).click();
  await golden.step('กลับไปที่ใบเคลม');
  await field('อ้างอิงใบเสร็จขาย (ถ้ามี)').getByTitle('ล้างใบที่เลือก').click();
  await golden.step('กด ✕ ล้างใบเสร็จที่อ้างอิง ทะเบียนรถว่าง');

  await page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อผู้ขาย').filter({ visible: true }).click();
  await page.keyboard.type('MA-RC');
  await page.getByText('MA-RC261000001', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' }).click();
  await page.getByRole('button', { name: 'ดึงรายการจากใบที่อ้างอิง' }).click();
  await expect(page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' })).toBeVisible();
  await golden.step('อ้างอิงใบรับสินค้าอีกครั้ง แล้วกดดึงรายการจากใบที่อ้างอิง');
  await page.getByRole('row').filter({ hasText: 'EL-101' }).getByRole('button', { name: '+ เคลมชิ้นนี้' }).click();
  await page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' }).click();
  await field('อ้างอิงใบซื้อสินค้า / ใบรับเข้า (ถ้ามี)').getByTitle('ล้างใบที่เลือก').click();
  await golden.step('หยิบไดชาร์จ EL-101 แล้วกด ✕ ล้างใบรับสินค้าที่อ้างอิง');

  const lines = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await expect(lines).toHaveCount(2);
  await lines.filter({ hasText: 'EL-118' }).getByRole('button', { name: '×' }).click();
  await expect(lines).toHaveCount(1);
  await golden.step('กด × เอาแบตเตอรี่ออกจากใบเคลม');

  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('รุ่งเรือง');
  await page.getByText('บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด', { exact: true }).filter({ visible: true }).click();
  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('บันทึกใบเคลม');
  await golden.stateChange('save-claim', before);
});
