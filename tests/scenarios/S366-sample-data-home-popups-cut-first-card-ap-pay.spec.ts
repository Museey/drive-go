import { test, expect } from '../support/test';

// After "ล้างข้อมูลทั้งหมด" + "โหลดข้อมูลตัวอย่าง" the shop runs without "ระบบขายแบบใหม่" (the sample data does not
// turn it on), so the home page's bill pop-ups are the original ones. Buttons no other scenario pressed
// (docs/BEHAVIORS.md): "ตรวจสอบเอกสาร" in the pop-up of a quote, a receipt and a goods receipt, "บันทึกรับชำระ" of a
// receipt, "บันทึกชำระเงินผู้ขาย" of a goods receipt, the "ยังไม่ได้ตัดสต็อก" card (Esc and "ไว้ทีหลัง") and "ชำระเงิน"
// in the payables register.
test('S366 ข้อมูลตัวอย่าง: ป๊อปอัพบิลหน้าแรก ตรวจสอบเอกสาร รับชำระ ชำระผู้ขาย การ์ดยังไม่ได้ตัดสต็อก และชำระเงินจากทะเบียนเจ้าหนี้', async ({ app, page, golden }) => {
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

  const popup = page.locator('#mBill');
  const closePopup = () => popup.getByRole('button', { name: 'ปิด', exact: true }).last().click();
  const home = () => page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  const closeAudit = async () => {
    await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
    await app.settle();
  };

  // A quote waiting to be billed: "ตรวจสอบเอกสาร".
  await home();
  await page.getByRole('row').filter({ hasText: 'QO.69-10-04-01' }).filter({ visible: true }).first().click();
  await expect(popup).toContainText('QO.69-10-04-01');
  await golden.step('ป๊อปอัพใบเสนอราคา QO.69-10-04-01');
  await popup.getByRole('button', { name: 'ตรวจสอบเอกสาร' }).click();
  await app.settle();
  await golden.step('กดตรวจสอบเอกสาร เปิดประวัติของใบเสนอราคา');
  await closeAudit();

  // The same quote: "เปิดใบเสร็จรับเงินจากบิลนี้" → the "ยังไม่ได้ตัดสต็อก" card: Esc, then again "ไว้ทีหลัง".
  await home();
  await page.getByRole('row').filter({ hasText: 'QO.69-10-04-01' }).filter({ visible: true }).first().click();
  await popup.getByRole('button', { name: 'เปิดใบเสร็จรับเงินจากบิลนี้' }).click();
  const card = page.getByRole('heading', { name: 'ยังไม่ได้ตัดสต็อก' });
  await expect(card).toBeVisible();
  await golden.step('กดเปิดใบเสร็จรับเงินจากบิลนี้ การ์ดบอกว่ายังไม่ได้ตัดสต็อก');
  await golden.screen('cut-first-card');
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  await golden.step('กด Esc การ์ดปิด');
  await home();
  await page.getByRole('row').filter({ hasText: 'QO.69-10-04-01' }).filter({ visible: true }).first().click();
  await popup.getByRole('button', { name: 'เปิดใบเสร็จรับเงินจากบิลนี้' }).click();
  await page.getByRole('button', { name: 'ไว้ทีหลัง' }).click();
  await expect(card).toBeHidden();
  await golden.step('เปิดอีกครั้งแล้วกดไว้ทีหลัง');

  // An unpaid receipt: "ตรวจสอบเอกสาร", then "บันทึกรับชำระ".
  await home();
  await page.getByRole('link', { name: 'RE.69-10-11-30' }).filter({ visible: true }).first().click();
  await expect(popup).toContainText('RE.69-10-11-30');
  await golden.step('ป๊อปอัพใบเสร็จ RE.69-10-11-30');
  await popup.getByRole('button', { name: 'ตรวจสอบเอกสาร' }).click();
  await app.settle();
  await golden.step('กดตรวจสอบเอกสาร เปิดประวัติของใบเสร็จ');
  await closeAudit();
  await home();
  await page.getByRole('link', { name: 'RE.69-10-11-30' }).filter({ visible: true }).first().click();
  await popup.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await expect(page.getByRole('heading', { name: 'รับชำระเงินลูกหนี้' }).filter({ visible: true })).toBeVisible();
  await golden.step('กดบันทึกรับชำระ เปิดหน้าต่างรับชำระเงินลูกหนี้');
  await page.locator('#mPartPay').getByRole('button', { name: 'ปิด', exact: true }).first().click();

  // An unpaid goods receipt: "ตรวจสอบเอกสาร", then "บันทึกชำระเงินผู้ขาย".
  await home();
  await page.getByRole('row').filter({ hasText: 'GR.69-10-10-30' }).filter({ visible: true }).first().click();
  await expect(popup).toContainText('GR.69-10-10-30');
  await golden.step('ป๊อปอัพใบรับสินค้า GR.69-10-10-30');
  await popup.getByRole('button', { name: 'ตรวจสอบเอกสาร' }).click();
  await app.settle();
  await golden.step('กดตรวจสอบเอกสาร เปิดประวัติของใบรับสินค้า');
  await closeAudit();
  await home();
  await page.getByRole('row').filter({ hasText: 'GR.69-10-10-30' }).filter({ visible: true }).first().click();
  await popup.getByRole('button', { name: 'บันทึกชำระเงินผู้ขาย' }).click();
  await expect(page.getByRole('heading', { name: 'ชำระเงินเจ้าหนี้' }).filter({ visible: true })).toBeVisible();
  await golden.step('กดบันทึกชำระเงินผู้ขาย เปิดหน้าต่างชำระเงินเจ้าหนี้');
  await page.locator('#mPartPay').getByRole('button', { name: 'ปิด', exact: true }).first().click();

  // 08 → เจ้าหนี้: search, then "ชำระเงิน" of GR.69-10-03-28.
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ เจ้าหนี้ (ค้างจ่าย)' }).click();
  await golden.step('ทะเบียนเจ้าหนี้');
  const row = page.getByRole('row').filter({ hasText: 'GR.69-10-03-28' }).filter({ visible: true });
  await row.getByRole('button', { name: 'ชำระเงิน', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'ชำระเงินเจ้าหนี้' }).filter({ visible: true })).toBeVisible();
  await golden.step('กดชำระเงินของ GR.69-10-03-28 เปิดหน้าต่างชำระเงินเจ้าหนี้');
  await page.locator('#mPartPay').getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await golden.step('ปิดหน้าต่างชำระเงิน');
});
