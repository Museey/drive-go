import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant round 3, J30; the owner's decision of 2026-11-11, docs/ACCOUNTANT-ANSWERS.md): the part
// given to a customer in place of a claimed one is a cost of sales (Dr 5010 Cr 1040) on the day it left the stock; it
// was only cut from the stock before. The claim of S280 (MA-SA261000003, one AC-215 air filter replaced): the profit and
// loss has the filter's FIFO cost in its cost of sales and that much less net profit, the trial balance has it on
// 5010, and the general ledger shows the claim's number.
const money = (t: string | null) => Number(String(t).replace(/[^\d.-]/g, ''));
const r2 = (v: number) => Math.round(v * 100) / 100;
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
async function books(page: Page) {
  await go(page, /^08 บัญชี/, '└ งบการเงิน');
  const pl = page.locator('#plTbl');
  await expect(pl.getByRole('row').first()).toBeVisible();
  const value = async (label: string) => money(await pl.getByRole('row').filter({ hasText: label }).getByRole('cell').last().textContent());
  const cogs = await value('หัก ต้นทุนอะไหล่และวัสดุที่ขาย'), net = await value('กำไร (ขาดทุน) สุทธิก่อนภาษี');
  await go(page, /^08 บัญชี/, '└ ผังบัญชี');
  const row = page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: '5010', exact: true }) });
  return { cogs, net, tb: money(await row.getByRole('cell').nth(3).textContent()) };
}

test('S290 ระบบใหม่: เปลี่ยนสินค้าให้ลูกค้าตามเคลมเป็นต้นทุนขายในงบกำไรขาดทุน งบทดลอง และบัญชีแยกประเภท', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const before = await books(page);

  // The claim of S280: one AC-215 air filter replaced.
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เคลมสินค้าลูกค้า' }).click();
  await page.getByRole('button', { name: '+ รับเคลมสินค้าจากลูกค้า' }).click();
  await page.getByLabel('อ้างอิงใบเสร็จ / ใบแจ้งหนี้ที่ขาย').filter({ visible: true })
    .selectOption({ label: 'MA-SA261000003 · 10/10/2569 · ปรีชา ทองสุข' });
  await page.getByRole('button', { name: /^\+ AC-215/ }).click();
  const line = page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByPlaceholder('เช่น มีเสียง / รั่ว / ไม่ทำงาน').fill('กรองขาด ฝุ่นเข้าช่องแอร์');
  await page.getByRole('toolbar', { name: 'เครื่องมือ' }).filter({ visible: true }).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบรับเคลม' })).toBeVisible();
  await page.getByRole('button', { name: 'เปลี่ยนสินค้าให้ลูกค้า (ตัดสต๊อก)' }).click();
  const card = page.getByRole('heading', { name: /เปลี่ยนสินค้า/ }).filter({ visible: true }).last().locator('xpath=ancestor::div[.//button][1]');
  await card.getByRole('button').last().click();
  await app.settle();
  const db = (await app.state()).DB;
  const cost = r2(db.fifo.allocs.filter((a: any) => a.refNo === 'MA-CC261000001').reduce((t: number, a: any) => t + (a.qty - (a.back || 0)) * a.cost, 0));
  expect(cost).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The cost of sales, the net profit and 5010 move by the filter's cost.
  const after = await books(page);
  expect(r2(after.cogs - before.cogs)).toBe(cost);
  expect(r2(before.net - after.net)).toBe(cost);
  expect(r2(after.tb - before.tb)).toBe(cost);

  // The general ledger: the claim's number, the customer, on 5010.
  await page.getByRole('button', { name: '└ บัญชีแยกประเภท', exact: true }).click();
  const ledger = page.locator('#a-ledger');
  await ledger.getByLabel('บัญชี', { exact: true }).selectOption('5010');
  await expect(ledger.getByRole('row').filter({ hasText: 'MA-CC261000001' }).getByRole('cell').nth(2)).toHaveText('เปลี่ยนสินค้าตามเคลมลูกค้า · ปรีชา ทองสุข');
  await expect(ledger.getByRole('row').filter({ hasText: 'MA-CC261000001' }).getByRole('cell').nth(3)).toHaveText(cost.toLocaleString('en-US', { minimumFractionDigits: 2 }));
});
