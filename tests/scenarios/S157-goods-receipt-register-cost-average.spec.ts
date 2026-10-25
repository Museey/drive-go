import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S30 in the new system (tests/intentional-changes.json, task 3.6, decision F4 = R10-ง ค):
// the register cost of what is received becomes the average cost of what is left, not the last
// purchase price — brake pads: 19 left at 850 and 10 received at 870 → 24,850 / 29 = 856.90
// (the legacy app: 870), which the approved lines compare with. Every step, screen and other
// data change is S30's.
const S30 = 'S30-buy-goods-credit-receive.spec.ts';

test('S157 ระบบใหม่: ซื้อสินค้าเงินเชื่อและรับเข้าสต๊อก ทุนในทะเบียนเป็นทุนเฉลี่ยของที่เหลือ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S30, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await golden.step('ทะเบียนใบรับสินค้า / ซื้อสินค้า');

  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await golden.step('ใบรับสินค้าใหม่');

  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await golden.step('เลือกผู้ขาย หจก. ไทยพาร์ท ซัพพลาย (เครดิต 15 วัน)');

  await page.getByLabel('เลขที่ใบส่งของ/ใบกำกับผู้ขาย').filter({ visible: true }).fill('TP-2610-0451');

  const search = page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true });
  const lines = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });

  await search.click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  await lines.nth(0).getByRole('spinbutton').nth(0).fill('10');
  await lines.nth(0).getByRole('spinbutton').nth(1).fill('870');

  await search.click();
  await page.keyboard.type('SU-350');
  await page.getByText('SU-350 · ลูกหมากปีกนกล่าง').filter({ visible: true }).click();
  await lines.nth(1).getByRole('spinbutton').nth(0).fill('4');
  await golden.step('กรอกรายการสินค้า 2 รายการ');
  await golden.screen('gr-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await golden.step('หลังกดอนุมัติเอกสาร');
  // The lot of 10 is at 870 as before; the register cost is the average of the 29 left.
  await golden.stateChange('approve-gr', before, { 'DB.stock[BR-001].cost': [850, 856.9] });
  // The approved lines compare with the register: "เดิมในระบบ 856.90 ↑ 13.10" (the legacy app: 870.00),
  // which widens the cost column; the table is checked by its text, the rest of the screen is S30's.
  const items = page.getByRole('table').filter({ hasText: 'ราคาทุน/หน่วย' }).filter({ visible: true });
  await expect(items.getByRole('row').filter({ hasText: 'BR-001' })).toContainText('เดิมในระบบ 856.90 ↑ 13.10');
  await expect(items.getByRole('row').filter({ hasText: 'SU-350' })).toContainText('เดิมในระบบ 650.00');
  await golden.screen('gr-approved', { mask: [items] });

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('ปิดหน้าต่างแจ้งอนุมัติ');
  golden.done();
  const db = (await app.state()).DB;
  expect(db.stock.find((s: any) => s.code === 'BR-001')).toMatchObject({ qty: 29, cost: 856.9, pa: 1490, pb: 1380, pc: 1280 });
});
