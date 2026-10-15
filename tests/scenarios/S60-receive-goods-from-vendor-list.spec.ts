import { test, expect } from '../support/test';

test('S60 เปิดใบรับสินค้าจากหน้าข้อมูลผู้ขาย แล้วอนุมัติรับสินค้าเข้าสต๊อก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '05 ข้อมูลผู้ขาย' }).click();
  await golden.step('หน้าข้อมูลผู้ขาย');

  // หจก. ไทยพาร์ท ซัพพลาย มีเครดิต 15 วัน (S30 เลือกผู้ขายในใบรับสินค้าแล้วได้เงื่อนไขเครดิต 15 วัน)
  await page.getByRole('row').filter({ hasText: 'หจก. ไทยพาร์ท ซัพพลาย' }).filter({ visible: true })
    .getByRole('button', { name: 'เปิดใบรับสินค้า' }).click();
  const vendor = page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true });
  await expect(vendor).toHaveValue(/^หจก\. ไทยพาร์ท ซัพพลาย/);
  // Legacy behaviour reported to the owner: opened this way the payment term stays "cash".
  await expect(page.getByLabel('เงื่อนไขชำระ').filter({ visible: true })).toHaveValue('cash');
  await golden.step('ใบรับสินค้าใหม่ที่เลือกผู้ขายไว้ให้แล้ว');
  await golden.screen('gr-from-vendor');

  await page.getByLabel('เลขที่ใบส่งของ/ใบกำกับผู้ขาย').filter({ visible: true }).fill('TP-2610-0460');
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').nth(0).fill('5');
  await line.getByRole('spinbutton').nth(1).fill('850');
  await golden.step('กรอกผ้าเบรกหน้า 5 ชิ้น ทุน 850');
  await golden.screen('gr-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await golden.step('หลังกดอนุมัติเอกสาร');
  await golden.stateChange('approve-gr', before);

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const row = page.getByRole('row').filter({ hasText: 'MA-RC261000002' }).filter({ visible: true });
  await expect(row).toContainText('4,547.50');
  await row.scrollIntoViewIfNeeded();
  await golden.step('ทะเบียนใบรับสินค้ามี MA-RC261000002');
  await golden.screen('gr-list');
});
