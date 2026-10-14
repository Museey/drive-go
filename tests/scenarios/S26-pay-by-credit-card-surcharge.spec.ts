import { test } from '../support/test';

test('S26 รับชำระด้วยบัตรเครดิตเต็มจำนวน พร้อมชาร์จเพิ่ม 3%', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // ตาราง "ลูกหนี้คงค้าง" ในหน้าแรก: MA-SA261000013 ลูกค้าทั่วไป (เงินสด) เกินกำหนด 1 วัน ยอดค้าง 7,276.00
  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000013' }).filter({ visible: true });
  await row.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await golden.step('หน้ารับชำระ MA-SA261000013');

  await page.getByRole('button', { name: 'บัตร แตะเพื่อเพิ่ม' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ยอดที่เหลือ' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'ธนาคาร / ผู้ให้บริการบัตร' }).filter({ visible: true })
    .selectOption({ label: 'เคทีซี (KTC)' });
  await page.getByRole('textbox', { name: 'รหัสบัตร 4 ตัวท้าย' }).filter({ visible: true }).fill('4321');
  await page.getByRole('textbox', { name: 'ชาร์จเพิ่ม (%)' }).filter({ visible: true }).fill('3');
  await page.getByRole('textbox', { name: 'เลขที่อนุมัติ / สลิป' }).filter({ visible: true }).fill('APV-889120');
  const fee = page.getByText('ค่าธรรมเนียม 218.28 บาท · ยอดที่ต้องรูดรวม 7,494.28 บาท').filter({ visible: true });
  await fee.waitFor();
  await fee.scrollIntoViewIfNeeded();
  await golden.step('บัตรเครดิต KTC 7,276.00 ชาร์จเพิ่ม 3%');
  await golden.screen('card-surcharge');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  await page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true }).waitFor();
  await golden.step('หลังบันทึกรับชำระ');
  await golden.stateChange('pay-card-surcharge', before);
  await golden.screen('after-pay');
});
