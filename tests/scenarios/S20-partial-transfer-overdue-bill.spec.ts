import { test } from '../support/test';

test('S20 รับชำระบางส่วนด้วยเงินโอนจากบิลที่เกินกำหนดในหน้าแรก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // ตาราง "ลูกหนี้คงค้าง" ในหน้าแรก: MA-SA261000005 บริษัท ขนส่งไทยรุ่งเรือง จำกัด เกินกำหนด 8 วัน ยอดค้าง 5,810.10
  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000005' }).filter({ visible: true });
  await row.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await golden.step('หน้ารับชำระ MA-SA261000005');

  await page.getByRole('button', { name: 'โอน แตะเพื่อเพิ่ม' }).click();
  await page.getByLabel('จำนวนเงิน').filter({ visible: true }).fill('3000');
  await page.getByLabel('ธนาคาร / บัญชีที่รับโอน').filter({ visible: true })
    .selectOption({ label: 'ธนาคารกสิกรไทย 123-4-56789-0 (หจก.เอกหม้อน้ำ)' });
  await page.getByText('รับน้อยกว่ายอดที่ต้องรับ 2,810.10 บาท').filter({ visible: true }).waitFor();
  await golden.step('กรอกเงินโอน 3,000 บาท');
  await golden.screen('pay-panel-transfer');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true }).waitFor();
  await golden.step('หลังบันทึกรับชำระ');
  await golden.stateChange('pay-transfer-partial', before);
  await golden.screen('after-pay');
});
