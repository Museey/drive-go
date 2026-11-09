import { test, expect } from '../support/test';

// The product window's header buttons no other scenario pressed: "⋯ เพิ่มเติม" (its two reports: goods received
// history and movement report, each with a date range and "ค้นหาข้อมูล", and a click on a goods received row),
// "บัตรสินค้า" (warranty, goods received rows that open the bill), "อัปโหลดรูป", and "ปิด" of each window.
test('S321 รายละเอียดสินค้า: เพิ่มเติม (ประวัติรับเข้าคลัง รายงานการเคลื่อนไหว) บัตรสินค้า และรูปสินค้า', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByText('EL-101', { exact: true }).click();
  await golden.step('เปิดรายละเอียดสินค้า EL-101');
  const close = () => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // ⋯ เพิ่มเติม → close.
  await page.getByRole('button', { name: '⋯ เพิ่มเติม' }).click();
  await golden.step('กด ⋯ เพิ่มเติม');
  await close();
  await golden.step('ปิดหน้าต่างเพิ่มเติม');

  // Goods received history, a range with nothing, then all, then open the bill.
  await page.getByRole('button', { name: '⋯ เพิ่มเติม' }).click();
  await page.getByRole('button', { name: 'ประวัติการนำสินค้าเข้าคลัง' }).click();
  await expect(page.getByText('MA-RC261000001').filter({ visible: true }).first()).toBeVisible();
  await golden.step('ประวัติการนำสินค้าเข้าคลังของ EL-101');
  await page.getByLabel('ตั้งแต่').filter({ visible: true }).fill('2026-10-14');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).last().click();
  await expect(page.getByText('ไม่พบประวัติการรับเข้าตามเงื่อนไขที่เลือก')).toBeVisible();
  await golden.step('ตั้งแต่ 14/10/2569 ไม่พบประวัติ');
  await page.getByLabel('ตั้งแต่').filter({ visible: true }).fill('');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).last().click();
  await page.getByRole('row', { name: /^MA-RC261000001 บริษัท อะไหล่ยนต์รุ่งเรือง/ }).filter({ visible: true }).click();
  await golden.step('กดแถว MA-RC261000001 เปิดใบรับสินค้า');
  await close();
  await golden.step('ปิดใบรับสินค้า');
  await close();
  await golden.step('ปิดประวัติการนำสินค้าเข้าคลัง');

  // Movement report with a range.
  await page.getByRole('button', { name: '⋯ เพิ่มเติม' }).click();
  await page.getByRole('button', { name: 'รายงานการเคลื่อนไหวสินค้า' }).click();
  await golden.step('รายงานการเคลื่อนไหวสินค้าของ EL-101');
  await page.getByLabel('ตั้งแต่').filter({ visible: true }).fill('2026-10-14');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).last().click();
  await expect(page.getByText('ยังไม่มีความเคลื่อนไหวในช่วงที่เลือก')).toBeVisible();
  await golden.step('ตั้งแต่ 14/10/2569 ยังไม่มีความเคลื่อนไหว');
  await page.getByLabel('ตั้งแต่').filter({ visible: true }).fill('');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).last().click();
  await golden.step('ล้างวันที่ แสดงความเคลื่อนไหวทั้งหมด');
  await close();
  await golden.step('ปิดรายงานการเคลื่อนไหว');

  // Product card: warranty, goods received row opens the bill.
  await page.getByRole('button', { name: 'บัตรสินค้า' }).click();
  await expect(page.locator('#mCard').getByText('รับประกันจากผู้ผลิต')).toBeVisible();
  await golden.step('บัตรสินค้า EL-101');
  await golden.screen('stock-card');
  await page.getByRole('row', { name: /^MA-RC261000001 บริษัท อะไหล่ยนต์รุ่งเรือง/ }).filter({ visible: true }).click();
  await golden.step('กดแถว MA-RC261000001 ในบัตรสินค้า');
  await close();
  await close();
  await golden.step('ปิดบัตรสินค้า');

  // Picture window, then close the product.
  await page.getByRole('button', { name: 'อัปโหลดรูป' }).click();
  await golden.step('กดอัปโหลดรูป');
  await close();
  await golden.step('ปิดหน้าต่างรูปสินค้า');
  await page.locator('#mStock').getByRole('button', { name: 'ปิด', exact: true }).filter({ hasText: 'ปิด' }).click();
  await golden.step('ปิดรายละเอียดสินค้า');
});
