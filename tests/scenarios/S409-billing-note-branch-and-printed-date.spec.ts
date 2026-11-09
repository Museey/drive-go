import { test, expect } from '../support/test';

// With a second branch: a new billing note's "คลัง / สาขาของเอกสารนี้" moved to the new branch (a fresh note of that
// branch) and back, and its optional "วันที่ในเอกสาร" (the date printed on it) filled in; saved, the note keeps it.
test('S409 ใบวางบิลใหม่ เปลี่ยนคลัง / สาขาของเอกสารไปสาขาใหม่แล้วกลับ และกรอกวันที่ในเอกสารก่อนบันทึก', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('เพิ่มสาขา BN สาขาบางนา');

  await page.getByText('ใบเสร็จรับเงิน / ใบกำกับภาษี', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: '4.5 ใบวางบิล' }).click();
  await page.getByRole('button', { name: '+ สร้างใบวางบิลใหม่' }).click();
  await golden.step('ใบวางบิลใหม่ของสาขาหลัก');

  const branch = page.getByLabel('คลัง / สาขาของเอกสารนี้').filter({ visible: true });
  await branch.selectOption({ label: 'BN · สาขาบางนา' });
  await expect(branch).toHaveValue(/./);
  await golden.step('เปลี่ยนเอกสารไปสาขาบางนา');
  await branch.selectOption({ label: 'MA · สาขาหลัก' });
  await golden.step('เปลี่ยนเอกสารกลับสาขาหลัก');

  await page.getByPlaceholder('พิมพ์ชื่อ / บริษัท / เบอร์โทร / ทะเบียนรถ').filter({ visible: true }).fill('วิภา');
  await page.getByText('วิภา ศรีสมบูรณ์', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ดึงใบเสร็จค้างชำระ' }).click();
  await page.getByText('เลือกแล้ว 2 ใบ · ยอดรวม 10,368.30 บาท').filter({ visible: true }).waitFor();
  await page.getByLabel('วันที่ในเอกสาร').filter({ visible: true }).fill('2026-10-15');
  await golden.step('ดึงบิลค้างชำระ 2 ใบ และกรอกวันที่ในเอกสาร 15/10/2569');
  await golden.screen('billing-with-printed-date');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await page.getByText('ใบวางบิลเป็นเอกสารแสดงยอดค้างของลูกค้า').filter({ visible: true }).waitFor();
  await golden.step('บันทึกใบวางบิลพร้อมวันที่ในเอกสาร');
  await golden.stateChange('save-billing', before);
});
