import { test, expect } from '../support/test';

test('S22 รับชำระจากลูกค้านิติบุคคลที่หักภาษี ณ ที่จ่าย 3% ของค่าแรง ด้วยเงินโอนเต็มจำนวน', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // ตาราง "ลูกหนี้คงค้าง" ในหน้าแรก: MA-SA261000009 บริษัท ผักสดเดลิเวอรี่ จำกัด (เงินเชื่อ 30 วัน)
  // ยอด 3,766.40 = อะไหล่ 520 + ค่าแรง 3,000 + VAT 7%
  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000009' }).filter({ visible: true });
  await row.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000009' }).waitFor();
  await golden.step('ป๊อปอัพรับชำระเงินลูกหนี้ พร้อมยอดหัก ณ ที่จ่าย');

  await page.getByRole('button', { name: 'ได้รับแล้ว' }).click();
  await page.getByRole('button', { name: 'โอนเต็มจำนวน' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'บัญชีร้านที่รับโอน' })
    .selectOption({ label: 'ธนาคารไทยพาณิชย์ 456-7-89012-3 (หจก.เอกหม้อน้ำ)' });
  await page.getByRole('textbox', { name: 'เลขอ้างอิง / เลขที่สลิป' }).fill('SCB-771020');
  await page.getByText('รับชำระ ฿3,676.40 · ตัดครบ 1 ใบ').filter({ visible: true }).waitFor();
  // เลื่อนให้เห็นตารางหัก ณ ที่จ่าย (ยอดที่หักจริง 90.00 และปุ่ม 50 ทวิ) ในภาพหน้าจอ
  await page.getByRole('button', { name: 'ได้รับแล้ว' }).scrollIntoViewIfNeeded();
  await golden.step('ได้รับ 50 ทวิ แล้ว และโอนเต็มจำนวน 3,676.40');
  await golden.screen('wht-transfer');

  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  const confirm = page.getByRole('button', { name: 'ยืนยันบันทึกรับชำระ ฿3,676.40' });
  await confirm.waitFor();
  await golden.step('ตรวจก่อนบันทึก');
  await golden.screen('confirm');

  const before = await app.state();
  await confirm.click();
  await expect(confirm).toBeHidden();
  await golden.step('หลังยืนยันบันทึกรับชำระ');
  await golden.stateChange('pay-with-wht', before);
});
