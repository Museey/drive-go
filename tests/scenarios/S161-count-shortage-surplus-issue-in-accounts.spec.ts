import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.6, decision R10-ก/ข/ค, owner's answer 2026-10-25 "คิดจากเอกสารสต๊อก"):
// what a stock count or an internal issue moved reaches the accounts at its FIFO cost, read from
// the documents (nothing is added to the expense register, cash does not move):
// a count's shortage is the expense "สินค้าขาดจากการตรวจนับ", its surplus other income at the
// register cost, an issue an expense of the category chosen on it. The count and issue windows
// say what they booked. A shortage can be sold to whoever is responsible ("เปิดใบขายให้ผู้รับผิดชอบ"):
// the sale takes the count's units back first, so stock is not cut twice and the cost moves from
// the expense to the cost of sales; while that sale stands the count cannot be cancelled, and
// cancelling the sale makes the items short again. The move report shows what leaves as minus,
// with its FIFO unit cost (finding 9). In the legacy app none of this reached the accounts.
const money = (t: string | null) => Number(String(t).replace(/[^\d.-]/g, ''));
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
async function statements(page: Page) {
  await go(page, /^08 บัญชี/, '└ งบการเงิน');
  const pl = page.locator('#plTbl');
  await expect(pl.getByRole('row').first()).toBeVisible();
  const value = async (label: string) => {
    const row = pl.getByRole('row').filter({ hasText: label });
    return (await row.count()) ? money(await row.getByRole('cell').last().textContent()) : null;
  };
  return {
    revenue: await value('รายได้จากการขายและบริการ'), cogs: await value('หัก ต้นทุนอะไหล่และวัสดุที่ขาย'),
    sga: await value('6000 ค่าใช้จ่ายในการขายและบริหาร'), shortage: await value('6190 สินค้าขาดจากการตรวจนับ'),
    opex: await value('รวมค่าใช้จ่ายดำเนินงาน'), otherIncome: await value('4030 บวก รายได้อื่น (สินค้าเกินจากการตรวจนับ)'),
    net: await value('กำไร (ขาดทุน) สุทธิก่อนภาษี'),
  };
}

test('S161 ระบบใหม่: ของขาด/เกินจากการตรวจนับและการเบิกใช้ลงบัญชีตามทุน FIFO ขายของที่ขาดให้ผู้รับผิดชอบได้', async ({ app, page }) => {
  await app.loginAsOwner();
  const start = (await app.state()).DB;
  const fs0 = await statements(page);
  expect(fs0.shortage).toBeNull();
  expect(fs0.otherIncome).toBeNull();

  // A stock count: AC-215 counted 17 of 19 (2 short at 120), AC-230 counted 20 of 19 (1 over, register cost 1,600).
  await go(page, /^07 สต๊อกอะไหล่/, '└ ตรวจนับสินค้า');
  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ visible: true }).getByRole('spinbutton').fill('17');
  await page.getByRole('row').filter({ hasText: 'AC-230' }).filter({ visible: true }).getByRole('spinbutton').fill('20');
  const booked = page.getByText(/^ลงบัญชีตามทุน FIFO:/).filter({ visible: true });
  await expect(booked).toHaveCount(0);
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await expect(booked).toContainText('ลงบัญชีตามทุน FIFO: ค่าใช้จ่ายสินค้าขาด 240.00 บาท · รายได้อื่น (สินค้าเกิน) 1,600.00 บาท');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // An internal issue booked under a category chosen on it.
  await go(page, /^07 สต๊อกอะไหล่/, '└ เบิกใช้ภายใน');
  await page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' }).click();
  await page.getByLabel('ผู้เบิก *').filter({ visible: true }).selectOption({ label: 'EMP003 · วิชัย ขยันงาน (ช่างซ่อมทั่วไป)' });
  const cat = page.getByLabel('หมวดค่าใช้จ่าย').filter({ visible: true });
  await expect(cat).toHaveValue('ค่าซ่อมแซมและบำรุงรักษา');
  await cat.selectOption('วัสดุสิ้นเปลืองสำนักงาน');
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025 · น้ำมันเบรก DOT4/ }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').fill('2');
  await line.getByPlaceholder('เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ').fill('ล้างอุปกรณ์ในห้องเครื่องมือ');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await expect(booked).toHaveText('ลงบัญชีตามทุน FIFO: ค่าใช้จ่ายหมวด วัสดุสิ้นเปลืองสำนักงาน 360.00 บาท');
  await app.settle();
  const afterIssue = (await app.state()).DB;
  expect(afterIssue.issues.find((d: any) => d.no === 'MA-WD261000001')).toMatchObject({ expCat: 'วัสดุสิ้นเปลืองสำนักงาน', deducted: true });
  expect(afterIssue.expenses).toEqual(start.expenses);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The profit-and-loss: the issue in the operating expenses, the shortage and the other income on rows of their own.
  const fs1 = await statements(page);
  expect(fs1.sga).toBeCloseTo(fs0.sga! + 360, 2);
  expect(fs1.shortage).toBe(240);
  expect(fs1.otherIncome).toBe(1600);
  expect(fs1.opex).toBeCloseTo(fs0.opex! + 360 + 240, 2);
  expect(fs1.net).toBeCloseTo(fs0.net! - 360 - 240 + 1600, 2);

  // The two filters short are sold to whoever is responsible: stock is not cut again.
  await go(page, /^07 สต๊อกอะไหล่/, '└ ตรวจนับสินค้า');
  await page.getByRole('row').filter({ hasText: 'MA-CT261000001' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'เปิดใบขายให้ผู้รับผิดชอบ' }).click();
  await expect(page.getByText('ดึงของที่ขาดจากใบตรวจนับ MA-CT261000001 แล้ว — เลือกลูกค้า (ผู้รับผิดชอบ) แล้วบันทึกการขาย', { exact: true }).filter({ visible: true })).toBeVisible();
  const saleRow = page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ has: page.getByRole('spinbutton') });
  await expect(saleRow.getByRole('spinbutton').nth(1)).toHaveValue('2');
  const custBox = page.getByPlaceholder('พิมพ์ชื่อลูกค้า / เบอร์โทร / ทะเบียน').filter({ visible: true });
  await custBox.fill('วิภา');
  await custBox.locator('..').getByText('วิภา ศรีสมบูรณ์').click();
  const beforeSale = (await app.state()).DB;
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await app.settle();
  const sold = (await app.state()).DB;
  const sale = sold.stockCuts.find((c: any) => !beforeSale.stockCuts.some((b: any) => b.id === c.id));
  expect(sale).toMatchObject({ no: 'MA-SA261000015', fromCount: 'MA-CT261000001', ref: 'MA-CT261000001' });
  const filter = (db: any) => db.stock.find((s: any) => s.code === 'AC-215');
  expect(filter(sold).qty).toBe(17);
  const count = sold.stockCounts.find((d: any) => d.no === 'MA-CT261000001');
  expect(count.sold).toEqual([{ no: 'MA-SA261000015', id: sale.id, stockId: filter(sold).id, qty: 2 }]);
  const left = (db: any, no: string) => db.fifo.allocs.filter((a: any) => a.refNo === no && a.stockId === filter(db).id)
    .reduce((t: number, a: any) => t + (a.qty - a.back) * a.cost, 0);
  expect(left(sold, 'MA-CT261000001')).toBe(0);
  expect(left(sold, 'MA-SA261000015')).toBe(240);
  expect(sold.audit.filter((a: any) => a.no === 'MA-CT261000001' && a.act === 'sale').map((a: any) => a.note))
    .toEqual(['ขายของที่ขาดให้ผู้รับผิดชอบ · ใบตัดสต็อก MA-SA261000015 · AC-215 × 2']);
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();

  const fs2 = await statements(page);
  expect(fs2.shortage).toBeNull();
  expect(fs2.cogs).toBeCloseTo(fs1.cogs! + 240, 2);
  expect(fs2.opex).toBeCloseTo(fs1.opex! - 240, 2);

  // While the sale stands, the count cannot be cancelled.
  await go(page, /^07 สต๊อกอะไหล่/, '└ ตรวจนับสินค้า');
  const countRow = page.getByRole('row').filter({ hasText: 'MA-CT261000001' }).filter({ visible: true });
  await countRow.click();
  await expect(booked).toContainText('ค่าใช้จ่ายสินค้าขาด 0.00 บาท');
  await expect(page.getByText('ขายของที่ขาดให้ผู้รับผิดชอบแล้ว: MA-SA261000015 (AC-215 × 2)', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'เปิดใบขายให้ผู้รับผิดชอบ' })).toHaveCount(0);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await countRow.getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(page.getByText('ใบตรวจนับ MA-CT261000001 มีใบขายของที่ขาด MA-SA261000015 — ยกเลิกใบขายก่อน', { exact: true }).filter({ visible: true })).toBeVisible();

  // Cancelling the sale makes the filters short again.
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000015', { exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true }).click();
  await page.getByText('ระบุเหตุผลที่ยกเลิก').locator('xpath=following-sibling::input[1]').fill('ผู้รับผิดชอบหาของคืนได้ไม่ครบ ยังไม่เก็บเงิน');
  await page.getByRole('button', { name: 'ยกเลิกและคืนสต๊อก' }).click();
  await expect(page.getByRole('button', { name: 'ทำฉบับแก้ไข' }).filter({ visible: true })).toBeHidden();
  await app.settle();
  const undone = (await app.state()).DB;
  expect(filter(undone).qty).toBe(17);
  expect(left(undone, 'MA-CT261000001')).toBe(240);
  expect(undone.stockCounts.find((d: any) => d.no === 'MA-CT261000001').sold).toEqual([expect.objectContaining({ no: 'MA-SA261000015', cancelled: true })]);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const fs3 = await statements(page);
  expect(fs3.shortage).toBe(240);

  // The move report of the brake fluid: the issue leaves as minus, at its FIFO unit cost.
  await go(page, /^07 สต๊อกอะไหล่/, '└ ทะเบียนอะไหล่');
  const find = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await find.fill('BR-025');
  await find.press('Enter');
  await page.getByRole('row').filter({ hasText: 'BR-025' }).filter({ visible: true }).getByText('BR-025', { exact: true }).first().click();
  await page.getByRole('button', { name: '⋯ เพิ่มเติม' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'รายงานการเคลื่อนไหวสินค้า' }).click();
  const issueMove = page.locator('#mMoveRepBody').getByRole('row').filter({ hasText: 'MA-WD261000001' });
  await expect(issueMove.getByRole('cell').nth(1)).toHaveText('ตัดออก');
  await expect(issueMove.getByRole('cell').nth(3)).toHaveText('-2');
  await expect(issueMove.getByRole('cell').nth(4)).toHaveText('180.00');
});
