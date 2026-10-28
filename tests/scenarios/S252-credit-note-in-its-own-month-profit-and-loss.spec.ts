import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant review 1.10, the owner's decision of 2026-10-28 to follow accountant B,
// docs/ACCOUNTANT-ANSWERS.md): the profit and loss takes a credit note in the month it is made, as the sales tax report
// does. On 2 November a customer brings back a brake pad set (BR-001) of the paid sale MA-SA261000010 of October:
// October's sales and cost of goods stay as they were, November's go down by the credit note's 1,380.00 before VAT and
// by the cost of the pad set that went back into stock; the trial balance's parts revenue (4010), which credit notes
// never lowered, goes down by 1,380.00 in the year of the credit note.
const form = (page: Page) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: /ใบลดหนี้/ }) });
const num = (s: string) => Number(s.replace(/,/g, ''));
const money = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}

test('S252 ระบบใหม่: ใบลดหนี้ลดยอดขายและต้นทุนของสินค้าที่รับคืนในเดือนที่ออกใบลดหนี้ เดือนที่ขายยังเป็นยอดตามที่ขาย งบทดลองลดรายได้ค่าอะไหล่', async ({ app, page }) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-02T09:00:00+07:00'));
  await app.loginAsOwner();
  const month = async (label: string) => {
    await go(page, /^08 บัญชี/, '└ สุขภาพการเงิน');
    return (await page.locator('#pnlMonthTbl').getByRole('row').filter({ hasText: label }).getByRole('cell').allTextContents()).map(s => s.trim());
  };
  const parts = async () => {
    await go(page, /^08 บัญชี/, '└ ผังบัญชี');
    const cells = await page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: '4010', exact: true }) }).getByRole('cell').allTextContents();
    return num(cells.at(-1)!.trim());
  };
  const oct = await month('ต.ค. 69'), nov = await month('พ.ย. 69'), rev4010 = await parts();

  // The credit note, made on 2 November.
  await go(page, /^04 ใบเสร็จรับเงิน/, '└ 4.6 ใบกำกับภาษี');
  await page.getByRole('button', { name: '+ ออกใบลดหนี้' }).click();
  await form(page).getByLabel('ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า').fill('MA-SA261000010');
  await form(page).getByRole('row').filter({ hasText: 'MA-SA261000010' }).getByRole('button', { name: 'เลือก' }).click();
  await form(page).getByRole('spinbutton', { name: 'จำนวนที่คืน BR-001' }).fill('1');
  await form(page).getByLabel('เหตุผล (ต้องกรอก)').fill('ลูกค้านำผ้าเบรกที่ยังไม่ได้ใช้มาคืน');
  await form(page).getByRole('button', { name: 'บันทึกใบลดหนี้' }).click();
  await expect(form(page).getByRole('heading', { name: 'ใบลดหนี้ MA-CN261100001' })).toBeVisible();
  await form(page).getByRole('button', { name: 'ปิด' }).click();
  await app.settle();
  const db = (await app.state()).DB;
  const cn = db.creditNotes[0];
  expect(cn).toMatchObject({ date: '2026-11-02', base: 1380, lines: [expect.objectContaining({ code: 'BR-001', qty: 1, stock: 'back' })] });
  // which allocation of the sale the pad set went back to (no cost is kept on the credit note)
  expect(cn.backs).toHaveLength(1);
  const alloc = db.fifo.allocs.find((a: any) => a.id === cn.backs[0].id);
  expect(alloc).toMatchObject({ stockId: db.stock.find((s: any) => s.code === 'BR-001').id, refNo: 'MA-SA261000010' });
  expect(cn.backs[0].qty).toBe(1);
  const cost = alloc.cost;

  // October as it was; November down by the credit note and the cost of what came back.
  expect(await month('ต.ค. 69')).toEqual(oct);
  const after = await month('พ.ย. 69');
  expect(after[1]).toBe(money(num(nov[1]) - 1380));
  expect(after[2]).toBe(money(num(nov[2]) - cost));
  expect(after[3]).toBe(money(num(nov[3]) - 1380 + cost));
  expect(await parts()).toBeCloseTo(rev4010 - 1380, 2);
});
