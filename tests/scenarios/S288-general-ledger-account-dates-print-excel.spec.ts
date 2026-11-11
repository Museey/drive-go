import { readFileSync } from 'node:fs';
import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant B's answer 8.2 — a general ledger before the pilot; the posting rules J01–J36 B checked in
// round 3; the owner's decisions of 2026-11-11, docs/ACCOUNTANT-ANSWERS.md): 08 บัญชี - การเงิน → บัญชีแยกประเภท. The
// journal is built from the documents (frontend/js/71-ledger.js); an account between two days shows the balance
// brought forward, each entry with its running balance and the totals; every account that moved can be shown, printed
// and saved as Excel. Every entry balances. For the owner and the staff with "ดูสรุปการเงิน ภาษี และเงินเดือน" (doc.fin).
// The words as the user reads them: each cell (and each piece of text) apart.
const text = (l: Locator) => l.evaluate(el => {
  const out: string[] = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const t = (w.currentNode.textContent || '').trim(); if (t) out.push(t); }
  return out.join(' ').replace(/\s+/g, ' ');
});
async function recordPrints(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__printed = [];
    window.print = () => { window.dispatchEvent(new Event('beforeprint')); w.__printed.push(document.title); window.dispatchEvent(new Event('afterprint')); };
    // The name the page gives a saved file: Chromium keeps a Thai name only when the machine's locale is UTF-8.
    w.__saved = [];
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) { if (this.download) w.__saved.push(this.download); return click.call(this); };
  });
}
const ledger = (page: Page) => page.locator('#a-ledger');
const table = (page: Page, account: string) => ledger(page).locator('h3', { hasText: account }).locator('xpath=following-sibling::div[1]//table');

test('S288 ระบบใหม่: บัญชีแยกประเภท เลือกบัญชีและช่วงวันที่ ยอดยกมา ยอดคงเหลือทุกรายการ ทุกบัญชีที่มีรายการ พิมพ์ และส่งออก Excel พนักงานเห็นเมื่อมีสิทธิ์ดูสรุปการเงิน', async ({ app, page }) => {
  test.slow();
  await recordPrints(page);
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ บัญชีแยกประเภท' }).click();
  await expect(ledger(page).getByRole('heading', { name: 'บัญชีแยกประเภท' })).toBeVisible();
  // This year up to today; the cash account first.
  await expect(ledger(page).getByLabel('บัญชี', { exact: true })).toHaveValue('1010');
  await expect(ledger(page).getByLabel('ตั้งแต่วันที่')).toHaveValue('2026-01-01');
  await expect(ledger(page).getByLabel('ถึงวันที่')).toHaveValue('2026-10-13');

  // Receivables: each sale, then its payment the same day; the balance runs on.
  await ledger(page).getByLabel('บัญชี', { exact: true }).selectOption('1030');
  const ar = table(page, '1030 ลูกหนี้การค้า');
  const rows = ar.locator('tbody tr');
  expect(await text(rows.nth(0))).toBe('ยอดยกมา 0.00');
  expect(await text(rows.nth(1))).toBe('03/10/2569 MA-SA261000001 ขาย 5,820.80 5,820.80');
  expect(await text(rows.nth(2))).toBe('03/10/2569 MA-RE261000001 รับชำระ MA-SA261000001 5,820.80 0.00');
  expect(await text(rows.nth(3))).toBe('04/10/2569 MA-SA261000002 ขาย · สมชาย ใจดี 663.40 663.40');
  // To today: what the trial balance says the customers owe.
  await expect(rows.last()).toContainText('รวม · ยอดคงเหลือยกไป');
  await expect(rows.last()).toContainText('43,577.95');

  // From 5 October: what was owed at the end of the 4th is brought forward.
  await ledger(page).getByLabel('ตั้งแต่วันที่').fill('2026-10-05');
  await expect(rows.nth(0)).toHaveText(/ยอดยกมา\s*2,546\.60/);
  await expect(rows.nth(1)).toContainText('05/10/2569');
  await expect(rows.last()).toContainText('43,577.95');

  // Every account that moved: revenue, cost of sales, VAT, …; printed and saved as Excel.
  await ledger(page).getByLabel('บัญชี', { exact: true }).selectOption('');
  for (const a of ['1010 เงินสด', '1030 ลูกหนี้การค้า', '1040 สินค้าคงเหลือ (อะไหล่)', '2030 ภาษีขาย', '4010 รายได้จากการขายอะไหล่', '5010 ต้นทุนอะไหล่และวัสดุที่ขาย'])
    await expect(ledger(page).getByRole('heading', { name: a })).toBeVisible();
  // This month's depreciation up to today, the month as people say it.
  await expect(ledger(page).getByRole('row').filter({ hasText: 'ค่าเสื่อมราคา ตุลาคม 2569' }).first()).toContainText('13/10/2569');
  await ledger(page).getByRole('button', { name: 'พิมพ์' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__printed.length)).toBe(1);
  const printed = await text(page.locator('#printStage .sheetpage'));
  for (const t of ['รายงานภายใน', 'บัญชีแยกประเภท', 'INTERNAL REPORT', 'ตั้งแต่วันที่ 05/10/2569 ถึงวันที่ 13/10/2569', '1030 ลูกหนี้การค้า', 'ยอดยกมา 2,546.60', '4010 รายได้จากการขายอะไหล่'])
    expect(printed).toContain(t);
  const download = page.waitForEvent('download');
  await ledger(page).getByRole('button', { name: 'ส่งออก Excel' }).click();
  const file = await download;
  expect(await page.evaluate(() => (window as any).__saved)).toEqual(['บัญชีแยกประเภท 2026-10-05 ถึง 2026-10-13.xlsx']);
  const xlsx = readFileSync((await file.path())!, 'utf8');   // the workbook's parts are stored, not compressed
  for (const t of ['บัญชีแยกประเภท', 'รหัสบัญชี', 'ยอดคงเหลือ', '1030', 'ลูกหนี้การค้า', 'ยอดยกมา', 'MA-SA261000005']) expect(xlsx).toContain(t);

  // Every entry balances, and so does the whole journal.
  const sums = await page.evaluate(() => {
    const L = (window as any).PKG_LEDGER, es = L.entries(), b = L.balances('2026-10-13', es);
    return { bad: L.check(es).length, dr: b.reduce((t: number, x: any) => t + x.debit, 0).toFixed(2), cr: b.reduce((t: number, x: any) => t + x.credit, 0).toFixed(2) };
  });
  expect(sums.bad).toBe(0);
  expect(sums.dr).toBe(sums.cr);

  // The cashier (EMP008) may open 08 but has no "ดูสรุปการเงิน ภาษี และเงินเดือน": no general ledger; with it, there it is.
  const rights = async (label: string) => {
    await page.getByRole('button', { name: '09 งานบุคคล' }).click();
    await page.getByRole('row').filter({ hasText: 'EMP008' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
    await page.getByRole('checkbox', { name: label, exact: true }).check();
    await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  };
  const signOut = async () => {
    await app.settle();
    await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
    await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  };
  const asCashier = async () => {
    await app.login('0923334455', '88888888');
    await page.getByRole('button', { name: /^08 บัญชี/ }).click();
    await expect(page.getByRole('button', { name: '└ ผังบัญชี' })).toBeVisible();
  };
  await rights('08 · ผังบัญชี · เข้าดู');
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const cashier = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashier.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('88888888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await signOut();
  await asCashier();
  await expect(page.getByRole('button', { name: '└ บัญชีแยกประเภท' })).toHaveCount(0);
  await signOut();
  await app.loginAsOwner();
  await rights('ดูสรุปการเงิน ภาษี และเงินเดือน');
  await signOut();
  await asCashier();
  await page.getByRole('button', { name: '└ บัญชีแยกประเภท' }).click();
  await expect(ledger(page).getByLabel('บัญชี', { exact: true })).toHaveValue('1010');
});
