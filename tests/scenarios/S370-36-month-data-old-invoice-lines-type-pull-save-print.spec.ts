import { test, expect } from '../support/test';

// After "ล้างข้อมูลทั้งหมด" + "โหลดข้อมูลทดสอบ 36 เดือน" the shop runs without "ระบบขายแบบใหม่" and has invoices of
// the original kind (DB.invoices), listed in the old 4.1 register; a row opens the original invoice form
// (#mInvoiceEdit). Its parts no other scenario used (docs/BEHAVIORS.md): a line's tick box, saving, "พิมพ์ใบแจ้งหนี้",
// the document type and "ดึงรายการทั้งหมด", and the search box at the top of the window.
test('S370 ข้อมูลทดสอบ 36 เดือน: ใบแจ้งหนี้แบบเดิม ติ๊กรายการ บันทึก พิมพ์ เปลี่ยนประเภทเอกสาร และดึงรายการทั้งหมด', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'โหลดข้อมูลทดสอบ 36 เดือน' }).click();
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible({ timeout: 240_000 });
  await golden.step('ล้างข้อมูลแล้วโหลดข้อมูลทดสอบ 36 เดือน');
  await golden.counts('after-36-months');

  // The old 4.1 register: the invoice IV.69-09-25-02.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.locator('#docOvDateMode').selectOption({ label: 'เลือกทั้งหมด' });
  const search = page.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า + Enter').filter({ visible: true });
  await search.fill('IV.69-09-25-02');
  await search.press('Enter');
  await page.getByText('IV.69-09-25-02', { exact: true }).filter({ visible: true }).first().click();
  const win = page.locator('#mInvoiceEdit');
  await expect(win.getByRole('button', { name: 'ดึงรายการทั้งหมด' })).toBeVisible();
  await golden.step('เปิดใบแจ้งหนี้ IV.69-09-25-02 (แบบเดิม)');
  await golden.screen('old-invoice');

  // Untick the last receipt, save, print.
  const ticks = win.getByRole('checkbox').filter({ visible: true });
  await ticks.last().uncheck();
  await golden.step('เอาติ๊กใบเสร็จใบสุดท้ายออก');
  let before = await app.state();
  await win.getByRole('button', { name: 'บันทึก', exact: true }).first().click();
  await app.settle();
  await golden.step('บันทึกใบแจ้งหนี้');
  await golden.stateChange('save-invoice', before);
  before = await app.state();
  await win.getByRole('button', { name: 'พิมพ์ใบแจ้งหนี้' }).click();
  await app.settle();
  await golden.step('กดพิมพ์ใบแจ้งหนี้');
  await golden.stateChange('print-invoice', before);

  // Another document type, then "ดึงรายการทั้งหมด".
  const type = win.getByRole('combobox').filter({ has: page.getByRole('option', { name: /ใบกำกับภาษี/ }) });
  await type.selectOption({ index: 1 });
  await golden.step('เปลี่ยนประเภทเอกสารที่ดึงมาวางบิล');
  await win.getByRole('button', { name: 'ดึงรายการทั้งหมด' }).click();
  await app.settle();
  await golden.step('กดดึงรายการทั้งหมด');

  // The search box at the top of the window lists the invoices.
  await win.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า').fill('IV.69-09');
  await expect(page.getByText('IV.69-09-25-01 ·', { exact: false }).filter({ visible: true }).first()).toBeVisible();
  await golden.step('พิมพ์ IV.69-09 ในช่องค้นหาที่หัวหน้าต่าง');
});
