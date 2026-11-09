import { test, expect } from '../support/test';

// After "ล้างข้อมูลทั้งหมด" + "โหลดข้อมูลตัวอย่าง" "ระบบขายแบบใหม่" is off, so a receipt opens in the original receipt
// form (#mReceiptEdit), here from "เปิดในหน้าใบเสร็จ" in the home page's bill pop-up. Parts of that form no other
// scenario used (docs/BEHAVIORS.md): the amount boxes that appear when several payment methods are ticked (cash,
// transfer, card, cheque) and the card's ชาร์จเพิ่ม (%), the payment panel ("เปิดหน้าชำระเงิน": a method tile, typing an
// amount, Esc, "โอนชำระเต็มจำนวน", the bank, "บันทึกการรับชำระ"), and the toolbar's print options and print menu.
test('S420 ข้อมูลตัวอย่าง: ใบเสร็จแบบเดิมจากป๊อปอัพหน้าแรก ช่องยอดแบ่งจ่าย หน้าชำระเงิน รับชำระ และพิมพ์ตามตัวเลือกการพิมพ์', async ({ app, page, golden }) => {
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

  const form = page.locator('#mReceiptEdit');
  const openFromHome = async () => {
    await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
    await page.getByRole('link', { name: 'RE.69-10-11-30' }).filter({ visible: true }).first().click();
    await page.locator('#mBill').getByRole('button', { name: 'เปิดในหน้าใบเสร็จ' }).click();
    await expect(form.getByText('เลขที่ RE.69-10-11-30').first()).toBeVisible();
  };

  // The bill pop-up's "เปิดในหน้าใบเสร็จ" opens the receipt in the original form.
  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  await page.getByRole('link', { name: 'RE.69-10-11-30' }).filter({ visible: true }).first().click();
  await golden.step('ป๊อปอัพใบเสร็จ RE.69-10-11-30');
  await page.locator('#mBill').getByRole('button', { name: 'เปิดในหน้าใบเสร็จ' }).click();
  await expect(form.getByText('เลขที่ RE.69-10-11-30').first()).toBeVisible();
  await golden.step('กดเปิดในหน้าใบเสร็จ เปิดใบเสร็จในฟอร์มแบบเดิม');

  // Several methods ticked: an amount box per method; the card has its ชาร์จเพิ่ม (%).
  await form.getByLabel('เงินสด', { exact: true }).check();
  await form.getByLabel('เงินโอน', { exact: true }).check();
  await form.getByLabel('จำนวนเงินสด').fill('1000');
  await form.getByLabel('จำนวนเงินโอน').fill('1568');
  await golden.step('ติ๊กเงินสดและเงินโอน ใส่ยอดเงินสด 1,000 เงินโอน 1,568');
  await form.getByLabel('เงินโอน', { exact: true }).uncheck();
  await form.getByLabel('บัตรเครดิต', { exact: true }).check();
  await form.getByLabel('ยอดที่รูดบัตร (ก่อนค่าธรรมเนียม)').fill('1568');
  await form.getByLabel('ชาร์จเพิ่ม (%)').filter({ visible: true }).fill('3');
  await golden.step('เปลี่ยนเงินโอนเป็นบัตรเครดิต ใส่ยอดรูดบัตร 1,568 ชาร์จเพิ่ม 3%');
  await form.getByLabel('บัตรเครดิต', { exact: true }).uncheck();
  await form.getByLabel('เช็ค', { exact: true }).check();
  await form.getByLabel('จำนวนเงินตามเช็ค').fill('1568');
  await golden.step('เปลี่ยนบัตรเครดิตเป็นเช็ค ใส่ยอดตามเช็ค 1,568');
  await golden.screen('pay-boxes');
  await form.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'ปิดโดยไม่บันทึก' }).click();
  await golden.step('ปิดโดยไม่บันทึก');

  // The payment panel: a tile, an amount, Esc; opened again, "โอนชำระเต็มจำนวน", the bank, save.
  await openFromHome();
  const pay = page.getByRole('dialog', { name: 'ชำระเงิน', exact: true });
  await form.getByRole('button', { name: 'เปิดหน้าชำระเงิน' }).click();
  await expect(pay).toBeVisible();
  await golden.step('กดเปิดหน้าชำระเงิน');
  await pay.getByRole('button', { name: /^เงินสด/ }).click();
  await pay.getByLabel(/ยอดที่ชำระด้วยเงินสด/).fill('1000');
  await expect(pay.getByText('ยังขาด', { exact: true })).toBeVisible();
  await golden.step('แตะเงินสด พิมพ์ยอด 1,000 (ยังขาด)');
  await page.keyboard.press('Escape');
  await expect(pay).toBeHidden();
  await golden.step('กด Esc หน้าชำระเงินปิด');
  await form.getByRole('button', { name: 'เปิดหน้าชำระเงิน' }).click();
  await expect(pay.getByLabel(/ยอดที่ชำระด้วยเงินสด/)).toHaveValue('1000');
  await golden.step('เปิดหน้าชำระเงินอีกครั้ง ยอดที่พิมพ์ไว้ยังอยู่');
  await pay.getByRole('button', { name: 'โอนชำระเต็มจำนวน' }).click();
  await pay.getByLabel(/ธนาคาร \/ บัญชีที่รับโอน/).selectOption({ index: 1 });
  await expect(pay.getByText('✓ ครบแล้ว', { exact: true })).toBeVisible();
  await golden.step('กดโอนชำระเต็มจำนวน แล้วเลือกบัญชีที่รับโอน');
  await golden.screen('pay-panel');
  let before = await app.state();
  await pay.getByRole('button', { name: 'บันทึกการรับชำระ' }).click();
  await expect(pay).toBeHidden();
  await app.settle();
  await golden.step('กดบันทึกการรับชำระ');
  await golden.stateChange('pay-by-transfer', before);

  // Toolbar: print options, then the print menu.
  await form.getByLabel('รหัสสินค้าบนเอกสาร').selectOption({ label: 'รหัสอ้างอิง OEM' });
  await form.getByLabel('ไม่แสดงหัวเอกสาร (ใช้กระดาษหัวจดหมายของร้าน)').check();
  await golden.step('ตัวเลือกการพิมพ์: รหัส OEM และไม่แสดงหัวเอกสาร');
  await form.getByRole('button', { name: 'พิมพ์เอกสาร ▾' }).click();
  await golden.step('กดพิมพ์เอกสาร เมนูพิมพ์เปิด');
  before = await app.state();
  await form.getByRole('button', { name: 'ใบเสร็จรับเงิน / ใบแจ้งหนี้', exact: true }).click();
  await app.settle();
  await golden.step('กดพิมพ์ใบเสร็จรับเงิน / ใบแจ้งหนี้');
  await golden.stateChange('print-receipt', before);
});
