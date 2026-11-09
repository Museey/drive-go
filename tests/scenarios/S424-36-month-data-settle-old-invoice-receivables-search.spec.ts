import { test, expect } from '../support/test';

// After "ล้างข้อมูลทั้งหมด" + "โหลดข้อมูลทดสอบ 36 เดือน" "ระบบขายแบบใหม่" is off and the shop has invoices of the
// original kind (DB.invoices). What no other scenario did (docs/BEHAVIORS.md): typing in the search box of 08 ลูกหนี้ and
// 08 เจ้าหนี้, "ชำระเงิน" of an original invoice in the receivables register (one confirmation settles the invoice), and
// in the original invoice form (#mInvoiceEdit) the box "ค้นหาเลขที่เอกสาร" over its lines and the header's "ปิด".
test('S424 ข้อมูลทดสอบ 36 เดือน: ค้นหาในทะเบียนลูกหนี้/เจ้าหนี้ รับชำระใบแจ้งหนี้แบบเดิม และค้นเลขที่เอกสารในใบแจ้งหนี้', async ({ app, page, golden }) => {
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

  // 08 ลูกหนี้: type the invoice number; its "ชำระเงิน" asks once, then settles it.
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ลูกหนี้ (ค้างรับ)' }).click();
  await golden.step('ทะเบียนลูกหนี้');
  const arSearch = page.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า').filter({ visible: true });
  await arSearch.fill('IV.69-09');
  await expect(page.getByRole('row').filter({ hasText: 'IV.69-09-25-02' }).filter({ visible: true })).toBeVisible();
  await golden.step('พิมพ์ IV.69-09 ในช่องค้นหา เหลือใบแจ้งหนี้ 2 ใบ');
  await arSearch.fill('IV.69-09-25-01');
  const row = page.getByRole('row').filter({ hasText: 'IV.69-09-25-01' }).filter({ visible: true });
  await expect(page.getByRole('row').filter({ hasText: 'IV.69-09-25-02' }).filter({ visible: true })).toBeHidden();
  await golden.step('พิมพ์ IV.69-09-25-01 เหลือใบเดียว');
  await row.getByRole('button', { name: 'ชำระเงิน' }).click();
  await expect(page.getByRole('heading', { name: 'รับชำระใบแจ้งหนี้' })).toBeVisible();
  await golden.step('กดชำระเงิน ระบบถามยืนยันรับชำระใบแจ้งหนี้');
  await golden.screen('settle-invoice-ask');
  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).last().click();
  await app.settle();
  await golden.step('กดบันทึกรับชำระ ใบแจ้งหนี้ IV.69-09-25-01 ชำระแล้ว');
  await golden.stateChange('settle-invoice', before);

  // 08 เจ้าหนี้: the same search box.
  await page.getByRole('button', { name: '└ เจ้าหนี้ (ค้างจ่าย)' }).click();
  await golden.step('ทะเบียนเจ้าหนี้');
  await page.getByPlaceholder(/ค้นหา เลขที่/).filter({ visible: true }).first().fill('บางนา');
  await app.settle();
  await golden.step('พิมพ์ บางนา ในช่องค้นหาของทะเบียนเจ้าหนี้');

  // The other invoice in the original form: "ค้นหาเลขที่เอกสาร", then the header's ปิด.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.locator('#docOvDateMode').selectOption({ label: 'เลือกทั้งหมด' });
  const search = page.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า + Enter').filter({ visible: true });
  await search.fill('IV.69-09-25-02');
  await search.press('Enter');
  await page.getByText('IV.69-09-25-02', { exact: true }).filter({ visible: true }).first().click();
  const win = page.locator('#mInvoiceEdit');
  await expect(win.getByRole('button', { name: 'ดึงรายการทั้งหมด' })).toBeVisible();
  await golden.step('เปิดใบแจ้งหนี้ IV.69-09-25-02 (แบบเดิม)');
  await win.getByPlaceholder('ค้นหาเลขที่เอกสาร').fill('RE.69-09');
  await golden.step('พิมพ์ RE.69-09 ในช่องค้นหาเลขที่เอกสาร');
  await win.getByPlaceholder('ค้นหาเลขที่เอกสาร').fill('ไม่มีเลขนี้');
  await golden.step('พิมพ์คำที่ไม่ตรงกับเอกสารใด');
  await win.getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await expect(win).toBeHidden();
  await golden.step('กดปิดที่หัวหน้าต่าง');
});
