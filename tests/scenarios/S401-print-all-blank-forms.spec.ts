import { test, expect } from '../support/test';

// "พิมพ์แบบฟอร์มเปล่า" on the home page: nothing ticked is refused, then all five blank forms (intake, quotation,
// receipt, goods received and the stock count sheet with today's items), two copies each (the count sheet once);
// then from the parts register filtered to one category, the count sheet of that category (its page ends in blank lines).
test('S401 พิมพ์แบบฟอร์มเปล่าทั้ง 5 ชนิด ชนิดละ 2 ชุด จากหน้าแรก (ไม่เลือกแบบฟอร์มจะถูกเตือน) และใบตรวจนับเฉพาะหมวดระบบเบรก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: 'พิมพ์แบบฟอร์มเปล่า' }).click();
  const dialog = page.locator('#mForm');
  await expect(dialog.getByRole('heading', { name: 'พิมพ์แบบฟอร์มเปล่าไปกรอกด้วยมือ' })).toBeVisible();
  await golden.step('หน้าต่างพิมพ์แบบฟอร์มเปล่า ยังไม่เลือกแบบฟอร์ม');

  await dialog.getByRole('button', { name: 'พิมพ์แบบฟอร์ม' }).click();
  await golden.step('กดพิมพ์โดยไม่เลือกแบบฟอร์ม');

  for (const label of ['ใบรับรถเข้าซ่อม / บันทึกข้อมูลลูกค้าใหม่', 'ใบเสนอราคา / ใบอนุมัติซ่อม (เปล่า)', 'ใบเสร็จรับเงิน (เปล่า)',
    'ใบรับสินค้า / บันทึกซื้อสินค้า (เปล่า)', 'ใบตรวจนับสต๊อก (พิมพ์รายการปัจจุบัน + ช่องนับจริง)'])
    await dialog.getByRole('checkbox', { name: label }).check();
  await dialog.getByRole('spinbutton').fill('2');
  await golden.step('เลือกครบ 5 แบบฟอร์ม ชนิดละ 2 ชุด');

  const before = await app.state();
  await dialog.getByRole('button', { name: 'พิมพ์แบบฟอร์ม' }).click();
  await expect(dialog).toBeHidden();
  await golden.step('กดพิมพ์แบบฟอร์ม');
  await golden.stateChange('print-forms', before);

  await page.emulateMedia({ media: 'print' });
  const stage = page.locator('#printStage');
  // Two copies of each blank form, the count sheet once (with today's items).
  for (const title of ['VEHICLE INTAKE FORM', 'QUOTATION / REPAIR ORDER', 'GOODS RECEIVED NOTE'])
    await expect(stage.getByText(title, { exact: true })).toHaveCount(2);
  await expect(stage.getByText(/^(RECEIPT \/ TAX INVOICE|OFFICIAL RECEIPT)$/)).toHaveCount(2);
  await expect(stage.getByText('STOCK COUNT SHEET', { exact: true }).first()).toBeAttached();
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('blank-forms-printed');
  await page.emulateMedia({ media: 'screen' });

  // The parts register filtered to ระบบเบรก: its count sheet lists those 5 items, then blank lines to count others.
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByLabel('หมวดอะไหล่').filter({ visible: true }).selectOption({ label: 'ระบบเบรก (5 รายการ)' });
  await golden.step('ทะเบียนอะไหล่เฉพาะหมวดระบบเบรก');
  await page.getByRole('button', { name: 'พิมพ์แบบฟอร์ม', exact: true }).filter({ visible: true }).click();
  await expect(dialog.getByRole('checkbox', { name: /ใบตรวจนับสต๊อก/ })).toBeChecked();
  await golden.step('หน้าต่างพิมพ์แบบฟอร์มเปล่า เลือกใบตรวจนับสต๊อกไว้แล้ว');
  await dialog.getByRole('button', { name: 'พิมพ์แบบฟอร์ม' }).click();
  await expect(dialog).toBeHidden();
  await golden.step('พิมพ์ใบตรวจนับสต๊อกหมวดระบบเบรก');
  await page.emulateMedia({ media: 'print' });
  await expect(stage.getByText('STOCK COUNT SHEET', { exact: true })).toHaveCount(1);
  await expect(stage.getByText('ผ้าเบรกหน้า Toyota Revo').first()).toBeAttached();
  await page.emulateMedia({ media: 'screen' });
});
