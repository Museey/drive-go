import { test, expect } from '../support/test';

test('S25 รับชำระตามใบวางบิลด้วยเงินสด ลูกค้าหัก ณ ที่จ่าย (ยังไม่ได้ 50 ทวิ) แยกใบเสร็จตามบิล', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('ใบเสร็จรับเงิน / ใบกำกับภาษี', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: '4.5 ใบวางบิล' }).click();
  await golden.step('4.5 ใบวางบิล');

  // MA-BL261000001 หจก. บางมดขนส่ง: MA-SA261000007 (620.60) + MA-SA261000008 (2,728.50 มีค่าแรง 1,500)
  await page.getByRole('row').filter({ hasText: 'MA-BL261000001' }).filter({ visible: true })
    .getByRole('button', { name: 'ไปหน้าตัดชำระลูกหนี้' }).click();
  await page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000008' }).waitFor();
  await golden.step('หน้าตัดชำระลูกหนี้ของใบวางบิล MA-BL261000001');

  await page.getByRole('button', { name: 'เงินสดเต็มจำนวน' }).filter({ visible: true }).click();
  await page.getByRole('radio', { name: 'แยกใบเสร็จตามบิล' }).check();
  await page.getByText('รับชำระ ฿3,304.10 · ตัดครบ 2 ใบ').filter({ visible: true }).waitFor();
  // เลื่อนให้เห็นตารางหัก ณ ที่จ่าย (45.00) และสถานะ 50 ทวิ ในภาพหน้าจอ
  await page.getByRole('button', { name: 'ยังไม่ได้รับ — ตามทีหลัง' }).scrollIntoViewIfNeeded();
  await golden.step('เงินสดเต็มจำนวน 3,304.10 แยกใบเสร็จตามบิล');
  await golden.screen('settle-billing');

  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  const confirm = page.getByRole('button', { name: 'ยืนยันบันทึกรับชำระ ฿3,304.10' });
  await confirm.waitFor();
  await golden.step('ตรวจก่อนบันทึก');

  const before = await app.state();
  await confirm.click();
  await expect(confirm).toBeHidden();
  await golden.step('หลังยืนยันบันทึกรับชำระ');
  await golden.stateChange('settle-billing-note', before);

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('row').filter({ hasText: 'MA-BL261000001' }).filter({ visible: true })
    .getByText('รับชำระแล้ว').waitFor();
  await golden.step('กลับรายการใบวางบิล');
  await golden.screen('billing-list-paid');
});
