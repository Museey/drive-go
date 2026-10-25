import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.6, decision R9-ข = จ, owner's answer 2026-10-25 "ใช้สิทธิ์อนุมัติที่มีอยู่"):
// selling more than is in stock ("ตัดสต็อก (ยอมติดลบ)") takes the owner or a staff member with
// at least one approval right. The front desk (EMP005, no approval right) is refused and nothing
// is saved; the head technician (EMP001, approves quotations only) may. What was sold short is
// costed at the register cost until goods arrive, then the bill takes the new lot's cost (R9-ก,
// as the legacy app does), and the register cost becomes the average cost of what is left (F4).
async function sellBrakePads(page: Page, qty: string) {
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อลูกค้า / เบอร์โทร / ทะเบียน').filter({ visible: true });
  await custBox.fill('วิภา');
  await custBox.locator('..').getByText('วิภา ศรีสมบูรณ์').click();
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001/ }).click();
  const row = page.getByRole('row').filter({ hasText: 'BR-001' }).filter({ has: page.getByRole('spinbutton') });
  await row.getByRole('spinbutton').nth(1).fill(qty);
  await row.getByRole('spinbutton').nth(1).press('Tab');
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
}
async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}
const brakePads = (db: any) => db.stock.find((s: any) => s.code === 'BR-001');

test('S160 ระบบใหม่: ขายเกินของที่มี (ยอมติดลบ) ได้เฉพาะเจ้าของหรือผู้มีสิทธิ์อนุมัติเอกสาร ต้นทุนชั่วคราวแก้เมื่อของเข้า', async ({ app, page }) => {
  await app.loginAsOwner();

  // The owner gives the front desk (no approval right) and the head technician (approves quotations) a login.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  for (const [code, pass] of [['EMP005', '5555'], ['EMP001', '1111']]) {
    const staff = page.getByRole('row').filter({ hasText: code });
    await staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
    await page.locator('input:focus').waitFor();
    await page.keyboard.type(pass);
    await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
    await expect(staff).toContainText('ใช้งานได้');
  }
  await signOut(page);

  // The front desk sells 25 brake pads; 19 are in stock: refused, nothing is cut or saved.
  await app.login('092-111-2233', '5555');
  const start = (await app.state()).DB;
  expect(brakePads(start)).toMatchObject({ qty: 19, cost: 850 });
  await sellBrakePads(page, '25');
  await expect(page.getByText('อะไหล่ 1 รายการมีไม่พอ — ตัดสต็อกติดลบได้เฉพาะเจ้าของหรือผู้มีสิทธิ์อนุมัติเอกสาร', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'สต๊อกไม่พอ' })).toBeHidden();
  await app.settle();
  const refused = (await app.state()).DB;
  expect(refused.stockCuts.length).toBe(start.stockCuts.length);
  expect(brakePads(refused).qty).toBe(19);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await signOut(page);

  // The head technician holds an approval right: asked, and may go negative.
  await app.login('081-555-1234', '1111');
  await sellBrakePads(page, '25');
  await expect(page.getByRole('heading', { name: 'สต๊อกไม่พอ' })).toBeVisible();
  await page.getByRole('button', { name: 'ตัดสต็อก (ยอมติดลบ)' }).click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await app.settle();
  const sold = (await app.state()).DB;
  const sale = sold.stockCuts.find((c: any) => !start.stockCuts.some((b: any) => b.id === c.id));
  expect(sale).toMatchObject({ no: 'MA-SA261000015', sellerName: 'ศักดิ์ชัย มั่นคง' });
  expect(brakePads(sold)).toMatchObject({ qty: -6, cost: 850 });
  const allocs = (db: any) => db.fifo.allocs.filter((a: any) => a.refNo === 'MA-SA261000015')
    .map((a: any) => ({ qty: a.qty - a.back, cost: a.cost, pending: a.pending }));
  // 19 from the lot at 850, 6 sold short at the register cost for now.
  expect(allocs(sold)).toEqual([{ qty: 19, cost: 850, pending: false }, { qty: 6, cost: 850, pending: true }]);
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();
  await signOut(page);

  // Goods arrive: 10 at 870. The six sold short take the new lot's cost; 4 are left at 870.
  await app.loginAsOwner();
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  const grLine = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await grLine.getByRole('spinbutton').nth(0).fill('10');
  await grLine.getByRole('spinbutton').nth(1).fill('870');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await app.settle();
  const received = (await app.state()).DB;
  expect(allocs(received)).toEqual([{ qty: 19, cost: 850, pending: false }, { qty: 6, cost: 870, pending: false }]);
  expect(brakePads(received)).toMatchObject({ qty: 4, cost: 870 });
});
