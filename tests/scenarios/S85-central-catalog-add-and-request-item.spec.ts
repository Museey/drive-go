import { test, expect } from '../support/test';

test.use({ dataset: 'prox-trial' });

test('S85 คลังกลาง ProX: เพิ่มสินค้าเข้าทะเบียนอะไหล่ และแจ้งขอสินค้าใหม่จน HeadAdmin อนุมัติ (จำลอง)', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: '★ คลังกลาง ProX' }).click();
  await golden.step('แท็บคลังกลาง ProX');

  const add = '+ เพิ่มเข้าทะเบียนอะไหล่';
  const cf03 = page.getByRole('row', { name: /PX-CF03/ });
  let before = await app.state();
  await cf03.getByRole('button', { name: add }).click();
  await cf03.getByText('อยู่ในทะเบียนแล้ว', { exact: true }).waitFor();
  await golden.step('หลังเพิ่ม PX-CF03 เข้าทะเบียนอะไหล่');
  await golden.stateChange('add-catalog-item', before);

  await page.getByRole('button', { name: '+ แจ้งเพิ่มรายการสินค้าใหม่' }).click();
  await golden.step('ฟอร์มแจ้งเพิ่มรายการสินค้าใหม่');

  const send = page.getByRole('button', { name: '📨 ส่งคำขอถึง HeadAdmin DriveGo' });
  await send.click();
  await golden.step('กดส่งโดยยังไม่กรอกชื่อสินค้า');

  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await field('ชื่อสินค้า *').fill('กรองแอร์ Protect Filter — Mazda 2 / CX-3');
  await field('เบอร์ OEM / เบอร์อ้างอิง').fill('D09W-61-J6X');
  await page.getByLabel('หมวดสินค้า').filter({ visible: true }).selectOption('ไส้กรอง');
  await field('ทุนโดยประมาณ (฿)').fill('110');
  await field('รุ่นรถที่ใช้ / เหตุผลที่ขอเพิ่ม').fill('ลูกค้า Mazda 2 เข้าบ่อย เดือนละ 6-8 คัน');
  await golden.step('กรอกคำขอสินค้าใหม่');
  await golden.screen('request-form');

  // ระบบเดิมจำลองว่า HeadAdmin อนุมัติเองหลังส่งประมาณ 8 วินาที (นับตามเวลาจริง)
  // จึงตรวจสถานะ "รออนุมัติ" ทันทีหลังกดส่ง แล้วบันทึกขั้นตอนและข้อมูลที่เปลี่ยนหลังอนุมัติแล้วเท่านั้น
  // ไม่อย่างนั้นผลจะขึ้นกับความเร็วเครื่อง
  before = await app.state();
  await send.click();
  await expect(page.getByText('⏳ รอ HeadAdmin อนุมัติ', { exact: true })).toBeVisible();
  const approved = page.getByText('✓ อนุมัติแล้ว · PX-NEW01', { exact: true });
  await approved.waitFor({ timeout: 60_000 });
  await golden.step('หลังส่งคำขอ และ HeadAdmin อนุมัติแล้ว');
  await golden.stateChange('send-and-approve-request', before);
  const newRow = page.getByRole('row', { name: /PX-NEW01/ });
  await approved.scrollIntoViewIfNeeded();
  await golden.screen('catalog-after-approval');

  before = await app.state();
  await newRow.getByRole('button', { name: add }).click();
  await newRow.getByText('อยู่ในทะเบียนแล้ว', { exact: true }).waitFor();
  await golden.step('หลังเพิ่ม PX-NEW01 เข้าทะเบียนอะไหล่');
  await golden.stateChange('add-approved-item', before);

  await page.getByText('ทะเบียนอะไหล่', { exact: true }).filter({ visible: true }).click();
  const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await search.fill('PX-');
  await search.press('Enter');
  const found = page.getByRole('row', { name: /PX-NEW01/ }).filter({ visible: true });
  await found.scrollIntoViewIfNeeded();
  await golden.step('ค้นหา PX- ในทะเบียนอะไหล่');
  await golden.screen('stock-list-px-items');
});
