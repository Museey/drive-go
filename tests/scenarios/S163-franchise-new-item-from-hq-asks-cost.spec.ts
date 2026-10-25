import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

test.use({ dataset: 'franchise-trial' });

// New behaviour (task 3.6, decision R11 = ก, owner's answer 2026-10-25 "ถามทุนตอนรับของ"):
// HQ's central stock has no cost, and goods from it take the receiving branch's register cost.
// An item the branch does not have yet has none: confirming the receipt first asks its unit
// cost (every new item, more than 0), and that cost is the new item's register cost, its FIFO
// lot and its stock move. In the legacy app the item was created at cost 0, so it sold at a
// cost of 0 and its cost could not be set later (locked once a lot exists).
async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}
async function answerPrompt(page: Page, value: string, button: string) {
  const ok = page.getByRole('button', { name: button, exact: true }).filter({ visible: true });
  await ok.waitFor();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type(value);
  await ok.click();
}

test('S163 ระบบใหม่: สาขาแฟรนไชส์รับสินค้าใหม่จากคลังกลางครั้งแรก ระบบถามทุนต่อหน่วยแล้วลงล็อต FIFO ตามทุนนั้น', async ({ app, page }) => {
  test.slow();
  // HQ has 100 metres of a cable no branch has.
  await app.loginAsOwner();
  await page.getByRole('button', { name: '🏭 คลังกลาง HQ (Min-Max)' }).click();
  await page.getByRole('button', { name: '+ เพิ่มสินค้า' }).click();
  await answerPrompt(page, 'EV-140', 'ต่อไป');
  await answerPrompt(page, 'สายไฟแรงสูง EV (เมตร)', 'บันทึก');
  const cable = page.getByRole('row').filter({ hasText: 'สายไฟแรงสูง EV (เมตร)' });
  const hqQty = cable.getByRole('spinbutton').first();
  await hqQty.fill('100'); await hqQty.press('Tab');
  await signOut(page);

  // B001 asks for 10.
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดเอง' }).click();
  const line = page.getByRole('table').filter({ hasText: 'จำนวนขอเบิก' }).getByRole('row').nth(1);
  const code = line.getByRole('combobox');
  await code.fill('EV-140'); await code.press('Tab');
  const name = line.getByRole('textbox').first();
  await name.fill('สายไฟแรงสูง EV (เมตร)'); await name.press('Tab');
  const qty = line.getByRole('spinbutton');
  await qty.fill('10'); await qty.press('Tab');
  await page.getByRole('button', { name: '📨 ส่งใบขอเบิกไป HQ' }).click();
  const myReq = page.getByRole('row').filter({ hasText: 'REQ-6910-0001' });
  await expect(myReq).toContainText('รอ HQ อนุมัติ');
  await signOut(page);

  // HQ approves and ships.
  await app.login('hq', '1234');
  await page.getByRole('button', { name: /📦 ใบขอเบิกจากสาขา/ }).click();
  const hqReq = page.getByRole('row').filter({ hasText: 'REQ-6910-0001' });
  await hqReq.getByRole('button', { name: 'ตรวจ / อนุมัติ' }).click();
  await page.getByRole('button', { name: '✔ อนุมัติและจัดส่ง (ตัดคลัง HQ)' }).click();
  await expect(hqReq).toContainText('HQ จัดส่งแล้ว — รอสาขายืนยันรับ');
  await signOut(page);

  // B001 receives: asked the unit cost of the new item first.
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
  const before = (await app.state()).DB;
  expect(before.stock.some((s: any) => s.code === 'EV-140')).toBe(false);
  const receive = async () => {
    await myReq.getByRole('button', { name: '✔ ยืนยันรับของเข้าสต๊อก' }).click();
    await page.getByRole('button', { name: 'รับของเข้าสต๊อก', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ทุนของสินค้าใหม่' })).toBeVisible();
    await expect(page.getByText('สินค้า 1 รายการยังไม่มีในทะเบียนของสาขา — กรอกทุนต่อหน่วย (ใช้เป็นต้นทุน FIFO และทุนในทะเบียน)', { exact: true })).toBeVisible();
  };
  // Without a cost: refused, nothing received.
  await receive();
  await page.getByRole('button', { name: 'รับของเข้าสต๊อก', exact: true }).click();
  await expect(page.getByText('กรอกทุนต่อหน่วยของสินค้าใหม่ให้ครบทุกรายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(myReq).toContainText('HQ จัดส่งแล้ว — รอสาขายืนยันรับ');
  // With 1,250.00 a metre.
  await receive();
  await page.getByLabel('ทุนต่อหน่วย EV-140').fill('1250');
  await page.getByRole('button', { name: 'รับของเข้าสต๊อก', exact: true }).click();
  await expect(myReq).toContainText('รับของเข้าสต๊อกแล้ว');
  await app.settle();
  const after = (await app.state()).DB;
  const item = after.stock.find((s: any) => s.code === 'EV-140');
  expect(item).toMatchObject({ name: 'สายไฟแรงสูง EV (เมตร)', qty: 10, cost: 1250 });
  expect(after.fifo.lots.filter((l: any) => l.stockId === item.id).map((l: any) => ({ qty: l.qty, left: l.left, cost: l.cost, refNo: l.refNo })))
    .toEqual([{ qty: 10, left: 10, cost: 1250, refNo: 'REQ-6910-0001' }]);
  expect(after.moves.filter((m: any) => m.stockId === item.id).map((m: any) => ({ type: m.type, qty: m.qty, cost: m.cost, refNo: m.refNo })))
    .toEqual([{ type: 'in', qty: 10, cost: 1250, refNo: 'REQ-6910-0001' }]);
});
