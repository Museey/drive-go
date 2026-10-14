import { test } from '../support/test';

test('S31 จ่ายชำระเจ้าหนี้ค่าสินค้าเงินเชื่อเต็มจำนวนด้วยการโอนเงิน', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // เตรียม: ซื้อผ้าเบรกหน้า 10 ชิ้น เงินเชื่อ 15 วัน จาก หจก. ไทยพาร์ท ซัพพลาย แล้วอนุมัติเข้าสต๊อก
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').nth(0).fill('10');
  await line.getByRole('spinbutton').nth(1).fill('870');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('อนุมัติใบรับสินค้าเงินเชื่อ MA-RC261000002 แล้ว');

  await page.getByText('บัญชี - การเงิน', { exact: true }).click();
  await page.getByRole('button', { name: 'เจ้าหนี้ (ค้างจ่าย)' }).click();
  await golden.step('รายการเจ้าหนี้ค้างจ่าย');

  await page.getByRole('button', { name: '+ ชำระเงินเจ้าหนี้' }).click();
  await golden.step('หน้าชำระเงินเจ้าหนี้');

  await page.getByRole('button').filter({ hasText: 'หจก. ไทยพาร์ท ซัพพลาย' }).filter({ visible: true }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-RC261000002' }).check();
  await golden.step('เลือกผู้ขายและติ๊กใบรับสินค้า MA-RC261000002');

  await page.getByRole('button', { name: 'โอนเต็มจำนวน' }).click();
  await page.getByLabel('โอนจากบัญชีร้าน *').filter({ visible: true })
    .selectOption({ label: 'ธนาคารกสิกรไทย 123-4-56789-0 (หจก.เอกหม้อน้ำ)' });
  await page.getByLabel('เลขอ้างอิง / เลขที่สลิป').filter({ visible: true }).fill('KB2610130001');
  await golden.step('โอนเต็มจำนวนจากบัญชีกสิกรไทย');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกจ่ายชำระ' }).click();
  await golden.step('หน้าตรวจก่อนบันทึก');
  await golden.screen('ap-confirm');

  await page.getByRole('button', { name: 'ยืนยันบันทึกจ่ายชำระ ฿9,309.00' }).click();
  await golden.step('หลังยืนยันบันทึกจ่ายชำระ');
  await golden.stateChange('pay-ap', before);

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('ปิดหน้าชำระเงินเจ้าหนี้');
  await golden.screen('ap-list-after');
});
