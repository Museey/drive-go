import { test, expect } from '../support/test';

// Buttons and boxes no other scenario used (docs/BEHAVIORS.md): the home page's shortcut buttons and rows, the search
// box (Enter, cleared) and "ช่วงวันที่" of 01 ลูกค้าสัมพันธ์, "ช่วงวันที่" of 08 ลูกหนี้, and "เปิดใบเสนอราคา" / "ลบ" in
// 02's "★ สรุปชื่อลูกค้าตามเกรดดาว".
test('S277 ปุ่มลัดหน้าแรก ตัวกรองทะเบียนนัดหมายและลูกหนี้ และปุ่มในหน้าสรุปลูกค้าตามเกรดดาว', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  const home = () => page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  const shortcut = async (name: string, step: string) => {
    await home();
    await page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
    await app.settle();
    await golden.step(step);
  };

  await shortcut('เปิดเมนูลูกค้าสัมพันธ์', 'หน้าแรก → เปิดเมนูลูกค้าสัมพันธ์');
  await shortcut('ดูนัดหมายทั้งหมด', 'หน้าแรก → ดูนัดหมายทั้งหมด');
  await shortcut('ดูนัดตรวจเช็ก', 'หน้าแรก → ดูนัดตรวจเช็ก');
  await shortcut('ดูทั้งหมด', 'หน้าแรก → ดูทั้งหมด (นัดหมาย)');
  await shortcut('ดูงานค้างส่งมอบ', 'หน้าแรก → ดูงานค้างส่งมอบ');
  await shortcut('เปิดหน้าสต๊อก', 'หน้าแรก → เปิดหน้าสต๊อก');
  await shortcut('ดูรายละเอียด', 'หน้าแรก → ดูรายละเอียด (สต๊อก)');
  await shortcut('เปิดหน้าเคลมสินค้า', 'หน้าแรก → เปิดหน้าเคลมสินค้า');

  // A category row and a Min/Max row of the home page open the stock register filtered.
  await home();
  await page.getByRole('row').filter({ hasText: 'อะไหล่แอร์' }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('หน้าแรก → แถวหมวดอะไหล่แอร์ เปิดทะเบียนอะไหล่');
  await home();
  await page.getByRole('row').filter({ hasText: 'BD-701' }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('หน้าแรก → แถว BD-701 ในแจ้งเตือน Min / Max เปิดทะเบียนอะไหล่');

  // 01: the register's search (Enter, then cleared) and its date range.
  await page.getByRole('button', { name: /01 ลูกค้าสัมพันธ์/ }).click();
  const q = page.getByPlaceholder('ค้นหา ชื่อลูกค้า / ทะเบียนรถ / เบอร์โทร + Enter');
  await q.fill('ไม่มีชื่อนี้');
  await q.press('Enter');
  await app.settle();
  await golden.step('ทะเบียนนัดหมาย ค้นหาชื่อที่ไม่มี กด Enter');
  await q.fill('');
  await app.settle();
  await golden.step('ลบคำค้นหา ทะเบียนแสดงทั้งหมดอีกครั้ง');
  await page.getByLabel('ช่วงวันที่').filter({ visible: true }).selectOption({ label: 'วันปัจจุบัน' });
  await app.settle();
  await golden.step('ทะเบียนนัดหมาย ช่วงวันที่ วันปัจจุบัน');
  await golden.screen('crm-today');

  // 08 ลูกหนี้: its date range.
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ลูกหนี้ (ค้างรับ)' }).click();
  await page.getByLabel('ช่วงวันที่').filter({ visible: true }).selectOption({ label: 'วันปัจจุบัน' });
  await app.settle();
  await golden.step('ทะเบียนลูกหนี้ ช่วงวันที่ วันปัจจุบัน');

  // 02 ★ สรุปชื่อลูกค้าตามเกรดดาว: a quotation for a customer, then delete another one.
  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await page.getByRole('button', { name: '★ สรุปชื่อลูกค้าตามเกรดดาว' }).click();
  const row = (name: string) => page.getByRole('row').filter({ hasText: name })
    .filter({ has: page.getByRole('button', { name: 'เปิดใบเสนอราคา' }) }).filter({ visible: true });
  await golden.step('หน้าสรุปชื่อลูกค้าตามเกรดดาว');
  await row('ชูชาติ อินทร์จันทร์').getByRole('button', { name: 'เปิดใบเสนอราคา' }).click();
  await app.settle();
  await golden.step('กดเปิดใบเสนอราคาให้ชูชาติ อินทร์จันทร์');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'ปิดโดยไม่บันทึก' }).click();
  await golden.step('ปิดใบเสนอราคาใหม่โดยไม่บันทึก');
  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await page.getByRole('button', { name: '★ สรุปชื่อลูกค้าตามเกรดดาว' }).click();
  await row('บุญมี แสงทอง').getByRole('button', { name: 'ลบ', exact: true }).click();
  await golden.step('กดลบบุญมี แสงทอง ระบบถามยืนยัน');
  const before = await app.state();
  await page.getByRole('heading', { name: 'ลบลูกค้า', exact: true }).locator('xpath=ancestor::div[.//button][1]')
    .getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(row('บุญมี แสงทอง')).toHaveCount(0);
  await golden.step('ลบลูกค้าแล้ว');
  await golden.stateChange('delete-customer-from-grade', before);
});
