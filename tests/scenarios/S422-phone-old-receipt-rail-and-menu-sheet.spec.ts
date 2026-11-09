import { test, expect } from '../support/test';

// A phone (390 px) after "ล้างข้อมูลทั้งหมด" + "โหลดข้อมูลตัวอย่าง": "ระบบขายแบบใหม่" is off, so receipts open in the
// original receipt form (#mReceiptEdit). On a phone it has the corner ✕ and a floating rail (✓ บันทึก, ▲ บนสุด,
// ▼ ล่างสุด, ⋯ เมนู) whose sheet prints the receipt or the tax invoice, starts a new receipt and closes the window.
// No other scenario pressed them (docs/BEHAVIORS.md).
test.use({ viewport: { width: 390, height: 844 } });

test('S422 ใบเสร็จแบบเดิมบนมือถือ: ปุ่ม ✕ ปุ่มบันทึก ขึ้นบนสุด/ลงล่างสุด และเมนู ⋯ พิมพ์ใบเสร็จ พิมพ์ใบกำกับภาษี สร้างใบใหม่ ปิดหน้าต่าง', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '☰' }).click();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'โหลดข้อมูลตัวอย่าง' }).click();
  await app.settle();
  await golden.step('ล้างข้อมูลแล้วโหลดข้อมูลตัวอย่าง');
  await golden.counts('sample-data');

  const form = page.locator('#mReceiptEdit');
  const menu = page.getByRole('button', { name: /^⋯\s*เมนู$/ });
  const sheet = page.locator('div').filter({ has: page.getByRole('button', { name: 'ปิดหน้าต่าง', exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'พิมพ์ใบเสร็จ / ใบแจ้งหนี้', exact: true }) }).last();

  // A new receipt from 4.1, closed with the corner ✕.
  await page.getByRole('button', { name: '☰' }).click();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: /4\.1 ใบแจ้งหนี้/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสร็จรับเงิน / ใบแจ้งหนี้' }).click();
  await expect(menu).toBeVisible();
  await golden.step('ใบเสร็จใหม่บนมือถือ');
  await form.getByRole('button', { name: '✕' }).click();
  await expect(form).toBeHidden();
  await golden.step('แตะ ✕ ที่มุมจอ ฟอร์มว่างปิด');

  // RE.69-09-05-01 (it has a tax invoice) from the home page's bill pop-up.
  await page.getByRole('button', { name: '☰' }).click();
  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  await page.getByRole('link', { name: 'RE.69-09-05-01' }).filter({ visible: true }).first().click();
  await page.locator('#mBill').getByRole('button', { name: 'เปิดในหน้าใบเสร็จ' }).click();
  await expect(form.getByText('เลขที่ RE.69-09-05-01').first()).toBeVisible();
  await golden.step('เปิดใบเสร็จ RE.69-09-05-01 จากป๊อปอัพหน้าแรก');

  // The rail: ▼, ▲.
  await page.getByRole('button', { name: /^▼\s*ล่างสุด$/ }).click();
  await page.waitForTimeout(800);
  await golden.step('แตะ ▼ ลงล่างสุด');
  await page.getByRole('button', { name: /^▲\s*บนสุด$/ }).click();
  await page.waitForTimeout(800);
  await golden.step('แตะ ▲ ขึ้นบนสุด');

  // ⋯ → print the receipt, then the tax invoice.
  await menu.click();
  await expect(sheet).toBeVisible();
  await golden.step('แตะ ⋯ เมนู');
  await golden.screen('menu-sheet');
  let before = await app.state();
  await sheet.getByRole('button', { name: 'พิมพ์ใบเสร็จ / ใบแจ้งหนี้', exact: true }).click();
  await app.settle();
  await golden.step('แตะพิมพ์ใบเสร็จ / ใบแจ้งหนี้');
  await golden.stateChange('print-receipt', before);
  await menu.click();
  before = await app.state();
  await sheet.getByRole('button', { name: 'พิมพ์ใบกำกับภาษี', exact: true }).click();
  await app.settle();
  await golden.step('แตะ ⋯ แล้วพิมพ์ใบกำกับภาษี');
  await golden.stateChange('print-tax-invoice', before);

  // ✓ บันทึก on the rail.
  await page.getByRole('textbox', { name: 'หมายเหตุ' }).filter({ visible: true }).first().fill('ลูกค้านัดชำระสิ้นเดือน');
  before = await app.state();
  await page.getByRole('button', { name: /^✓\s*บันทึก$/ }).click();
  await app.settle();
  await golden.step('ใส่หมายเหตุ แล้วแตะ ✓ บันทึก');
  await golden.stateChange('save-receipt', before);

  // ⋯ → สร้างใบใหม่, then ⋯ → ปิดหน้าต่าง.
  await menu.click();
  await sheet.getByRole('button', { name: 'สร้างใบใหม่', exact: true }).click();
  await expect(form.getByText('เอกสารใหม่', { exact: false }).first()).toBeVisible();
  await golden.step('แตะ ⋯ แล้วสร้างใบใหม่');
  await menu.click();
  await sheet.getByRole('button', { name: 'ปิดหน้าต่าง', exact: true }).click();
  await expect(form).toBeHidden();
  await golden.step('แตะ ⋯ แล้วปิดหน้าต่าง');
});
