import { test, expect } from '../support/test';

test('S21 รับชำระหลายบิลของลูกค้ารายเดียวพร้อมกัน แบ่งจ่ายเงินสดและเงินโอน', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('บัญชี - การเงิน', { exact: true }).filter({ visible: true }).click();
  await page.getByText('ลูกหนี้ (ค้างรับ)', { exact: true }).filter({ visible: true }).click();
  await golden.step('ทะเบียนลูกหนี้');

  await page.getByRole('button', { name: '+ รับชำระเงิน' }).click();
  await golden.step('ป๊อปอัพรับชำระเงินลูกหนี้');

  // วิภา ศรีสมบูรณ์ ค้าง 2 ใบ: MA-SA261000004 (10,058.00) และ MA-SA261000014 (310.30) รวม 10,368.30
  await page.getByPlaceholder('พิมพ์ชื่อลูกค้า').filter({ visible: true }).fill('วิภา');
  await page.getByRole('button', { name: /^วิภา ศรีสมบูรณ์/ }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-SA261000004' }).waitFor();
  await golden.step('เลือกลูกค้า วิภา ศรีสมบูรณ์');

  await page.getByRole('checkbox', { name: 'เลือก MA-SA261000004' }).check();
  await page.getByRole('checkbox', { name: 'เลือก MA-SA261000014' }).check();
  await page.getByRole('button', { name: 'เงินสด แตะเพื่อเพิ่ม' }).filter({ visible: true }).click();
  await page.getByRole('textbox', { name: 'จำนวนเงินที่รับจริง เงินสด' }).fill('5000');
  await page.getByRole('button', { name: 'โอน แตะเพื่อเพิ่ม' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'บัญชีร้านที่รับโอน' })
    .selectOption({ label: 'ธนาคารกรุงเทพ 789-0-12345-6 (หจก.เอกหม้อน้ำ)' });
  await page.getByRole('textbox', { name: 'จำนวนเงินที่โอน รายการที่ 1' }).fill('5368.30');
  await page.getByRole('textbox', { name: 'เลขอ้างอิง / เลขที่สลิป' }).fill('BBL-240913');
  await page.getByText('รับชำระ ฿10,368.30 · ตัดครบ 2 ใบ').filter({ visible: true }).waitFor();
  await golden.step('ติ๊ก 2 บิล แบ่งจ่ายเงินสด 5,000 + โอน 5,368.30');
  await golden.screen('split-two-bills');

  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  const confirm = page.getByRole('button', { name: 'ยืนยันบันทึกรับชำระ ฿10,368.30' });
  await confirm.waitFor();
  await golden.step('ตรวจก่อนบันทึก');
  await golden.screen('confirm');

  const before = await app.state();
  await confirm.click();
  await expect(confirm).toBeHidden();
  await golden.step('หลังยืนยันบันทึกรับชำระ');
  await golden.stateChange('pay-two-bills-split', before);
});
