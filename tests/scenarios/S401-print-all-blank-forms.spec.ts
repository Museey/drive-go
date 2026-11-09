import { test, expect } from '../support/test';

// "พิมพ์แบบฟอร์มเปล่า" on the home page: nothing ticked is refused, then all five blank forms (intake, quotation,
// receipt, goods received and the stock count sheet with today's items), two copies each (the count sheet once).
test('S401 พิมพ์แบบฟอร์มเปล่าทั้ง 5 ชนิด ชนิดละ 2 ชุด จากหน้าแรก (ไม่เลือกแบบฟอร์มจะถูกเตือน)', async ({ app, page, golden }) => {
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
  for (const title of ['ใบรับรถเข้าซ่อม', 'ใบเสนอราคา', 'ใบเสร็จรับเงิน', 'ใบรับสินค้า', 'ใบตรวจนับสต๊อก'])
    await expect(stage.getByText(title).first()).toBeAttached();
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('blank-forms-printed');
  await page.emulateMedia({ media: 'screen' });
});
