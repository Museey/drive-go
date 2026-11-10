import { test, expect } from '../support/test';

// Buttons of the parts register (07) no other scenario pressed: "พิมพ์แบบฟอร์ม" (the blank count sheet), the category
// drop-down "หมวดอะไหล่" above the register, and "พิมพ์รายงานสินค้าคงเหลือ" with every choice of its window
// (category, scope, sort, direction, grouping): the line under the choices counts what will be printed.
test('S320 พิมพ์ใบตรวจนับเปล่า เลือกหมวดในทะเบียนอะไหล่ แล้วพิมพ์รายงานสินค้าคงเหลือตามเงื่อนไข', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await golden.step('ทะเบียนอะไหล่');

  // Blank count sheet: the window opens with the count sheet ticked.
  await page.getByRole('button', { name: 'พิมพ์แบบฟอร์ม', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('checkbox', { name: /ใบตรวจนับ/ })).toBeChecked();
  await golden.step('กดพิมพ์แบบฟอร์ม ใบตรวจนับถูกติ๊กไว้');
  let before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์แบบฟอร์ม', exact: true }).filter({ visible: true }).last().click();
  await golden.step('พิมพ์ใบตรวจนับเปล่า');
  await golden.stateChange('print-blank-count', before);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#printStage').getByText('อะไหล่แอร์').first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });

  // The category drop-down of the register.
  await page.getByRole('combobox', { name: 'หมวดอะไหล่', exact: true }).selectOption({ label: 'ระบบเบรก (5 รายการ)' });
  await golden.step('เลือกหมวดระบบเบรกในทะเบียนอะไหล่');

  // Inventory report: opens on the category chosen in the register.
  await page.getByRole('button', { name: 'พิมพ์รายงานสินค้าคงเหลือ' }).click();
  const info = page.locator('#rpInfo');
  await expect(info).toContainText('จะพิมพ์');
  await golden.step('หน้าต่างพิมพ์รายงานสินค้าคงเหลือ (หมวดระบบเบรก)');
  await page.getByRole('combobox', { name: 'ขอบเขตรายการ' }).selectOption({ label: 'พิมพ์เฉพาะที่ของหมด / ติดลบ' });
  await golden.step('ขอบเขต: เฉพาะที่ของหมด');
  await page.getByRole('combobox', { name: 'ขอบเขตรายการ' }).selectOption({ label: 'พิมพ์เฉพาะที่ถึงจุดสั่งซื้อ (Min)' });
  await golden.step('ขอบเขต: เฉพาะที่ถึงจุดสั่งซื้อ');
  await page.getByRole('combobox', { name: 'ขอบเขตรายการ' }).selectOption({ label: 'พิมพ์เฉพาะสินค้าค้างสต๊อก (Dead stock)' });
  await golden.step('ขอบเขต: สินค้าค้างสต๊อก');
  await page.getByRole('combobox', { name: 'ขอบเขตรายการ' }).selectOption({ label: 'พิมพ์เฉพาะที่มีสินค้าคงเหลือ' });
  await page.getByRole('combobox', { name: 'หมวดอะไหล่ที่ต้องการพิมพ์' }).selectOption({ value: '' });
  await golden.step('ทุกหมวด เฉพาะที่มีสินค้าคงเหลือ');
  for (const sort of ['จำนวนคงเหลือ', 'รหัสสินค้า', 'ชื่อสินค้า', 'พื้นที่จัดเก็บ (LO)']) {
    await page.getByRole('combobox', { name: 'เรียงลำดับตาม' }).selectOption({ label: sort });
  }
  await page.getByRole('combobox', { name: 'ทิศทางการเรียง' }).selectOption({ label: 'จากน้อยไปหามาก' });
  await golden.step('เรียงตามพื้นที่จัดเก็บ จากน้อยไปหามาก');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await golden.step('ปิดหน้าต่างรายงาน');

  // Again, sorted by value, grouped by category, printed.
  await page.getByRole('button', { name: 'พิมพ์รายงานสินค้าคงเหลือ' }).click();
  await page.getByRole('combobox', { name: 'หมวดอะไหล่ที่ต้องการพิมพ์' }).selectOption({ value: '' });
  await page.getByRole('combobox', { name: 'ขอบเขตรายการ' }).selectOption({ label: 'พิมพ์เฉพาะที่มีสินค้าคงเหลือ' });
  await page.getByRole('combobox', { name: 'รูปแบบการจัดกลุ่ม' }).selectOption({ label: 'แยกกลุ่มตามหมวด พร้อมยอดรวมแต่ละหมวด' });
  await golden.step('ทุกหมวด เฉพาะที่มีของ แยกกลุ่มตามหมวด');
  before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์รายงาน', exact: true }).click();
  await golden.step('กดพิมพ์รายงาน');
  await golden.stateChange('print-report', before);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('#printStage').getByText('รายงานสินค้าคงเหลือ').first()).toBeVisible();
  await expect(page.locator('#printStage').getByText('รวมหมวด ระบบเบรก').first()).toBeVisible();
  await golden.screen('stock-report-printed');
  await page.emulateMedia({ media: 'screen' });

  // Nothing to print: a category with no stock, only items in stock.
  await page.getByRole('button', { name: 'พิมพ์รายงานสินค้าคงเหลือ' }).click();
  await page.getByRole('combobox', { name: 'หมวดอะไหล่ที่ต้องการพิมพ์' }).selectOption({ label: 'อื่น ๆ (1 รายการ)' });
  await page.getByRole('combobox', { name: 'ขอบเขตรายการ' }).selectOption({ label: 'พิมพ์เฉพาะที่มีสินค้าคงเหลือ' });
  await page.getByRole('button', { name: 'พิมพ์รายงาน', exact: true }).click();
  await golden.step('หมวดอื่น ๆ ไม่มีของคงเหลือ กดพิมพ์ ระบบบอกว่าไม่มีสินค้าตรงเงื่อนไข');
});
