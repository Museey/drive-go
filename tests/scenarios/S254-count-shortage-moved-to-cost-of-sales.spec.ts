import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant review 4.3, the owner's decision of 2026-10-28 to follow accountant B, docs/ACCOUNTANT-ANSWERS.md):
// a count's shortage that turns out to be goods sold or used on a job earlier without their cost is moved, by whoever may
// approve stock counts and with a reason, from the expense "สินค้าขาดจากการตรวจนับ" to the cost of goods sold. The stock does
// not change; the net profit stays the same. Here AC-215 is counted 17 of 19 (2 short at 120): one of them was used on a job.
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
  return { cogs: await value('หัก ต้นทุนอะไหล่และวัสดุที่ขาย'), shortage: await value('6190 สินค้าขาดจากการตรวจนับ'), net: await value('กำไร (ขาดทุน) สุทธิก่อนภาษี') };
}

test('S254 ระบบใหม่: ผู้อนุมัติใบตรวจนับปรับของขาดที่ใช้ไปแล้วแต่ไม่ได้ลงต้นทุนเป็นต้นทุนขาย พร้อมเหตุผล สต๊อกไม่เปลี่ยน กำไรสุทธิเท่าเดิม', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await go(page, /^07 สต๊อกอะไหล่/, '└ ตรวจนับสินค้า');
  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ visible: true }).getByRole('spinbutton').fill('17');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  const booked = page.getByText(/^ลงบัญชีตามทุน FIFO:/).filter({ visible: true });
  await expect(booked).toContainText('ลงบัญชีตามทุน FIFO: ค่าใช้จ่ายสินค้าขาด 240.00 บาท · รายได้อื่น (สินค้าเกิน) 0.00 บาท');
  await app.settle();
  const before = (await app.state()).DB;
  const no = before.stockCounts.at(-1).no;
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const fs0 = await statements(page);

  // One AC-215 was used on a job: moved to the cost of goods sold.
  await go(page, /^07 สต๊อกอะไหล่/, '└ ตรวจนับสินค้า');
  await page.getByText(no, { exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'ปรับของขาดเป็นต้นทุนขาย' }).click();
  const dlg = page.locator('div').filter({ has: page.getByText('ปรับของขาดเป็นต้นทุนขาย · ใบตรวจนับ ' + no, { exact: true }) }).last();
  await expect(dlg.getByRole('row').filter({ hasText: 'AC-215' }).getByRole('cell').nth(2)).toHaveText('2');
  await dlg.getByRole('spinbutton', { name: 'จำนวนที่ปรับ AC-215' }).fill('1');
  await dlg.getByLabel('เหตุผล (ต้องกรอก)').fill('ใช้ซ่อมรถลูกค้าไปแล้วแต่ไม่ได้ลงในบิล');
  await dlg.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText('ปรับของขาดเป็นต้นทุนขายแล้ว · AC-215 × 1', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(booked).toContainText('ลงบัญชีตามทุน FIFO: ค่าใช้จ่ายสินค้าขาด 120.00 บาท · ต้นทุนขาย 120.00 บาท · รายได้อื่น (สินค้าเกิน) 0.00 บาท');
  await expect(page.getByText('ปรับเป็นต้นทุนขายแล้ว: AC-215 × 1 (ใช้ซ่อมรถลูกค้าไปแล้วแต่ไม่ได้ลงในบิล)', { exact: true })).toBeVisible();
  await app.settle();
  const after = (await app.state()).DB;
  const count = after.stockCounts.find((d: any) => d.no === no);
  expect(count.toCogs).toEqual([expect.objectContaining({ code: 'AC-215', qty: 1, reason: 'ใช้ซ่อมรถลูกค้าไปแล้วแต่ไม่ได้ลงในบิล', date: '2026-10-13', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' })]);
  expect(after.stock).toEqual(before.stock);   /* the stock does not change */
  expect(after.audit.at(-1)).toMatchObject({ kind: 'count', act: 'cogs', note: 'ปรับของขาดเป็นต้นทุนขาย AC-215 × 1 — ใช้ซ่อมรถลูกค้าไปแล้วแต่ไม่ได้ลงในบิล' });
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The statements: the shortage 120 less, the cost of goods sold 120 more, the net profit as it was.
  const fs1 = await statements(page);
  expect(fs1.shortage).toBeCloseTo(fs0.shortage! - 120, 2);
  expect(fs1.cogs).toBeCloseTo(fs0.cogs! + 120, 2);
  expect(fs1.net).toBeCloseTo(fs0.net!, 2);
});
