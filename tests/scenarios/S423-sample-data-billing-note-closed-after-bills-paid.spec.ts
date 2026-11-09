import { test, expect } from '../support/test';

// After "ล้างข้อมูลทั้งหมด" + "โหลดข้อมูลตัวอย่าง" "ระบบขายแบบใหม่" is off. A billing note whose receipts were all paid
// one by one then shows "ชำระครบแล้ว" and the button "ปิดใบวางบิล" in the 4.2 register (with the switch on the button
// is hidden and the note closes by itself). No other scenario pressed it (docs/BEHAVIORS.md).
test('S423 ข้อมูลตัวอย่าง: ใบวางบิลที่ใบเสร็จถูกรับชำระรายใบครบแล้ว กดปิดใบวางบิล', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'โหลดข้อมูลตัวอย่าง' }).click();
  await expect(page.getByRole('button', { name: /^00 Mr\.DriveGo/ })).toBeVisible();
  await app.settle();
  await golden.step('ล้างข้อมูลแล้วโหลดข้อมูลตัวอย่าง');
  await golden.counts('sample-data');

  // A billing note for ปรีชา ทองสุข with his three unpaid receipts.
  const note = page.locator('#mBillingEdit');
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: /4\.2 ใบวางบิล/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบวางบิลใหม่' }).click();
  const cust = page.getByPlaceholder('พิมพ์ชื่อ / บริษัท / เบอร์โทร / ทะเบียนรถ').filter({ visible: true });
  await cust.fill('ปรีชา');
  await cust.press('Enter');
  await page.getByRole('button', { name: 'ดึงใบเสร็จค้างชำระ' }).click();
  await expect(note.getByRole('row').filter({ hasText: 'RE.69-10-11-30' })).toBeVisible();
  await golden.step('ใบวางบิลใหม่ให้ปรีชา ทองสุข ดึงใบเสร็จค้างชำระ 3 ใบ');
  let before = await app.state();
  await note.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(note.getByText('MA-BL261000001').first()).toBeVisible();
  await app.settle();
  await golden.step('บันทึกใบวางบิล MA-BL261000001');
  await golden.stateChange('save-billing-note', before);
  const open = note.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า').filter({ visible: true });
  await open.fill('MA-BL261000001');
  await open.press('Enter');
  await app.settle();
  await golden.step('พิมพ์ MA-BL261000001 ในช่องค้นหาที่หัวหน้าต่าง + Enter');
  await note.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('ปิดใบวางบิล กลับมาที่ทะเบียน 4.2 (รอรับชำระ)');

  // The three receipts paid one by one from the home page's bill pop-up.
  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  await page.getByRole('link', { name: 'RE.69-10-11-30' }).filter({ visible: true }).first().click();
  await page.locator('#mBill').getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  const pp = page.locator('#mPartPay');
  for (const no of ['RE.69-09-29-27', 'RE.69-09-09-24']) await pp.getByRole('row').filter({ hasText: no }).getByRole('checkbox').check();
  await pp.getByRole('button', { name: 'เงินสดเต็มจำนวน' }).click();
  await golden.step('รับชำระเงินลูกหนี้ ติ๊กครบ 3 ใบ เงินสดเต็มจำนวน');
  await pp.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).last().click();
  before = await app.state();
  await page.getByRole('button', { name: /^ยืนยันบันทึกรับชำระ/ }).click();
  await app.settle();
  await golden.step('ยืนยันรับชำระ 3 ใบ');
  await golden.stateChange('pay-three-bills', before);
  await pp.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // 4.2: the note shows ชำระครบแล้ว and "ปิดใบวางบิล".
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: /4\.2 ใบวางบิล/ }).click();
  const row = page.getByRole('row').filter({ hasText: 'MA-BL261000001' }).filter({ visible: true });
  await expect(row.getByRole('button', { name: 'ปิดใบวางบิล' })).toBeVisible();
  await golden.step('ทะเบียนใบวางบิล MA-BL261000001 ชำระครบแล้ว มีปุ่มปิดใบวางบิล');
  await golden.screen('billing-all-paid');
  before = await app.state();
  await row.getByRole('button', { name: 'ปิดใบวางบิล' }).click();
  await app.settle();
  await golden.step('กดปิดใบวางบิล');
  await golden.stateChange('close-billing-note', before);
});
