import { test, expect } from '../support/test';

// Buttons of 06 รายจ่าย / ซื้อสินค้า no scenario pressed (docs/BEHAVIORS.md): "พิมพ์ฟอร์มเปล่า" of the goods receipt
// register and of the goods receipt window, "ค้นหาข้อมูล" and Enter in the register's search box, "ดูทั้งหมด" and the
// "ค้นหา เลขที่ / ผู้ขาย / ยอดเงิน" box of the window; then the expense shortcuts "+ ค่าน้ำ", "+ ค่าโทรศัพท์ / เน็ต",
// "พิมพ์ใบจ่ายเงินเดือน", "+ เครื่องมือช่างมูลค่าต่ำ" and "+ วัสดุสำนักงาน".
test('S342 ทะเบียนใบรับสินค้า: ฟอร์มเปล่า ค้นหา เปิดใบเดิมจากช่องค้นหา และปุ่มลัดบันทึกค่าน้ำ ค่าโทรศัพท์ เครื่องมือช่าง', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await golden.step('ทะเบียนใบรับสินค้า');
  const closeTop = () => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  await page.getByRole('button', { name: 'พิมพ์ฟอร์มเปล่า' }).filter({ visible: true }).click();
  await golden.step('พิมพ์ฟอร์มเปล่าจากทะเบียน');
  await closeTop();

  const search = page.getByPlaceholder('ค้นหา เลขที่ / ผู้ขาย / เลขใบกำกับ + Enter');
  await search.fill('รุ่งเรือง');
  await search.press('Enter');
  await golden.step('ค้นหา "รุ่งเรือง" กด Enter');
  await search.fill('ไม่มีใบนี้');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await expect(page.getByText('ยังไม่มีประวัติการซื้อสินค้า')).toBeVisible();
  await golden.step('ค้นหา "ไม่มีใบนี้" กดค้นหาข้อมูล ไม่พบ');
  await search.fill('');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await golden.step('ล้างคำค้นแล้วกดค้นหาข้อมูล');

  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByRole('button', { name: 'พิมพ์ฟอร์มเปล่า' }).filter({ visible: true }).last().click();
  await golden.step('พิมพ์ฟอร์มเปล่าจากหน้าต่างใบรับสินค้า');
  await closeTop();
  await page.getByRole('button', { name: 'ดูทั้งหมด' }).filter({ visible: true }).last().click();
  await golden.step('ดูใบรับสินค้าทั้งหมด');
  await page.getByRole('banner').filter({ has: page.getByRole('heading', { name: /ดูทั้งหมด$/ }) })
    .getByRole('button', { name: 'ปิด' }).click();
  await page.getByPlaceholder('ค้นหา เลขที่ / ผู้ขาย / ยอดเงิน').filter({ visible: true }).click();
  await page.keyboard.type('MA-RC261000001');
  await page.getByText('MA-RC261000001 · 01/10/2569', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบรับสินค้า' })).toBeVisible();
  await golden.step('เปิดใบรับสินค้า MA-RC261000001 จากช่องค้นหาในหน้าต่าง');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // ปุ่มลัดรายจ่าย
  await page.getByRole('button', { name: '2 · ค่าน้ำค่าไฟ' }).click();
  await page.getByRole('button', { name: '+ ค่าน้ำ', exact: true }).click();
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('ค่าน้ำประปา');
  await golden.step('กด + ค่าน้ำ ฟอร์มตั้งหมวดค่าน้ำประปา');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: '+ ค่าโทรศัพท์ / เน็ต' }).click();
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('ค่าโทรศัพท์และอินเทอร์เน็ต');
  await golden.step('กด + ค่าโทรศัพท์ / เน็ต');
  await page.getByLabel('รายละเอียดค่าใช้จ่าย *', { exact: true }).filter({ visible: true }).fill('ค่าอินเทอร์เน็ตอู่ เดือน ตุลาคม 2569');
  await page.getByPlaceholder('หรือพิมพ์ชื่อเอง').fill('บริษัท ทรู อินเทอร์เน็ต จำกัด');
  await page.getByLabel('มูลค่าก่อนภาษี (บาท) *', { exact: true }).filter({ visible: true }).fill('599');
  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByRole('row').filter({ hasText: 'ค่าอินเทอร์เน็ตอู่ เดือน ตุลาคม 2569' }).filter({ visible: true })).toBeVisible();
  await golden.step('บันทึกค่าอินเทอร์เน็ต 599 บาท');
  await golden.stateChange('save-internet', before);

  await page.getByRole('button', { name: '4 · จ่ายเงินเดือน' }).click();
  await page.getByRole('button', { name: 'พิมพ์ใบจ่ายเงินเดือน' }).click();
  await golden.step('กดพิมพ์ใบจ่ายเงินเดือน');

  await page.getByRole('button', { name: '5 · อุปกรณ์สำนักงาน' }).click();
  await page.getByRole('button', { name: '+ เครื่องมือช่างมูลค่าต่ำ' }).click();
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('เครื่องมือช่างมูลค่าต่ำ');
  await golden.step('กด + เครื่องมือช่างมูลค่าต่ำ');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: '+ วัสดุสำนักงาน' }).click();
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('วัสดุสิ้นเปลืองสำนักงาน');
  await golden.step('กด + วัสดุสำนักงาน');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('ปิดฟอร์ม');
});
