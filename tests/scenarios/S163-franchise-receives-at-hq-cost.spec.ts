import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

test.use({ dataset: 'franchise-trial' });

// New behaviour (accountant review 4.2, the owner's decision of 2026-10-30; before it, task 3.6 R11 asked the
// branch the cost of an item new to it): HQ keeps a unit cost per item of its central stock ("ทุนต่อหน่วย"),
// shipping needs it for every item that goes and writes it on the request's lines, and the branch receives
// each line at that cost — the new item's register cost, its FIFO lot and its stock move — without being asked.
// In the legacy app the central stock had no cost and the item was created at cost 0.
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

test('S163 ระบบใหม่: HQ ใส่ทุนต่อหน่วยในคลังกลาง จัดส่งของที่ยังไม่มีทุนไม่ได้ ใบเบิกบันทึกทุน สาขารับสินค้าใหม่ตามทุนนั้นลงล็อต FIFO โดยไม่ต้องถาม', async ({ app, page }) => {
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

  // HQ cannot ship it before its central stock has the unit cost.
  await app.login('hq', '1234');
  await page.getByRole('button', { name: /📦 ใบขอเบิกจากสาขา/ }).click();
  const hqReq = page.getByRole('row').filter({ hasText: 'REQ-6910-0001' });
  const ship = async () => {
    await hqReq.getByRole('button', { name: 'ตรวจ / อนุมัติ' }).click();
    await page.getByRole('button', { name: '✔ อนุมัติและจัดส่ง (ตัดคลัง HQ)' }).click();
  };
  await ship();
  await expect(page.getByText('สินค้า 1 รายการในคลังกลางยังไม่มีทุนต่อหน่วย (EV-140) — ใส่ทุนในตารางคลังกลางก่อนจัดส่ง', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: '✕ ปิด' }).click();
  await expect(hqReq).toContainText('รอ HQ อนุมัติ');
  // 1,250.00 a metre in the central stock, then shipped: the line carries it.
  await page.getByRole('button', { name: '🏭 คลังกลาง HQ (Min-Max)' }).click();
  const hqCost = page.getByRole('spinbutton', { name: 'ทุนต่อหน่วย EV-140' });
  await hqCost.fill('1250'); await hqCost.press('Tab');
  await page.getByRole('button', { name: /📦 ใบขอเบิกจากสาขา/ }).click();
  await ship();
  await expect(hqReq).toContainText('HQ จัดส่งแล้ว — รอสาขายืนยันรับ');
  await app.settle();
  const FR = (await app.state()).FR;
  expect(FR.hqStock.find((h: any) => h.code === 'EV-140')).toMatchObject({ qty: 90, cost: 1250 });
  expect(FR.reqs.find((r: any) => r.no === 'REQ-6910-0001')).toMatchObject({ status: 'shipped', costed: true,
    items: [{ code: 'EV-140', qty: 10, apQty: 10, cost: 1250 }] });
  await signOut(page);

  // B001 receives the new item at HQ's cost: no question about it.
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
  const before = (await app.state()).DB;
  expect(before.stock.some((s: any) => s.code === 'EV-140')).toBe(false);
  await myReq.getByRole('button', { name: '✔ ยืนยันรับของเข้าสต๊อก' }).click();
  await page.getByRole('button', { name: 'รับของเข้าสต๊อก', exact: true }).click();
  await expect(myReq).toContainText('รับของเข้าสต๊อกแล้ว');
  await expect(page.getByText('ทุนของสินค้าใหม่', { exact: true })).toBeHidden();
  await app.settle();
  const after = (await app.state()).DB;
  const item = after.stock.find((s: any) => s.code === 'EV-140');
  expect(item).toMatchObject({ name: 'สายไฟแรงสูง EV (เมตร)', qty: 10, cost: 1250 });
  expect(after.fifo.lots.filter((l: any) => l.stockId === item.id).map((l: any) => ({ qty: l.qty, left: l.left, cost: l.cost, refNo: l.refNo })))
    .toEqual([{ qty: 10, left: 10, cost: 1250, refNo: 'REQ-6910-0001' }]);
  expect(after.moves.filter((m: any) => m.stockId === item.id).map((m: any) => ({ type: m.type, qty: m.qty, cost: m.cost, refNo: m.refNo })))
    .toEqual([{ type: 'in', qty: 10, cost: 1250, refNo: 'REQ-6910-0001' }]);
});
