import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { confirmWithWord } from '../support/whole-data';

// New behaviour (team's check of 2026-11-18, the owner's decision of 2026-11-19): restoring a backup point replaces the
// whole data. The legacy app merged the point into the data (Object.assign), so kinds the point does not have stayed:
// a credit note made after the point stayed while the stock it returned and its refund went back. Now the restored data
// is the point's, credit notes included (an import of a file works the same way, 03.js dbReplace).
const form = (page: Page) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: /ใบลดหนี้/ }) });

test('S469 ระบบใหม่: สร้างจุดสำรอง ออกใบลดหนี้คืนสินค้า แล้วกู้คืนจุดสำรอง ใบลดหนี้หายไปพร้อมสต๊อกและเงินคืน ข้อมูลไม่ขัดกัน', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const start = (await app.state()).DB;
  const qty = (db: any) => db.stock.find((s: any) => s.code === 'BR-001').qty;
  expect(start.creditNotes).toBeUndefined();

  // A backup point of today, before any credit note.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const backups = page.getByLabel('จุดสำรองอัตโนมัติในเครื่อง (เก็บ 5 วันล่าสุด)');
  await page.getByRole('button', { name: 'สร้างจุดสำรองเดี๋ยวนี้' }).click();
  await expect(backups.getByRole('option')).toHaveText(['13/10/2569']);

  // A credit note: one brake pad set back from a paid sale, cash refunded (S142).
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await page.getByRole('button', { name: '+ ออกใบลดหนี้' }).click();
  await form(page).getByLabel('ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า').fill('MA-SA261000010');
  await form(page).getByRole('row').filter({ hasText: 'MA-SA261000010' }).getByRole('button', { name: 'เลือก' }).click();
  await form(page).getByRole('spinbutton', { name: 'จำนวนที่คืน BR-001' }).fill('1');
  await form(page).getByLabel('เหตุผล (ต้องกรอก)').fill('ลูกค้านำผ้าเบรกที่ยังไม่ได้ใช้มาคืน');
  await form(page).getByRole('button', { name: 'บันทึกใบลดหนี้' }).click();
  await expect(form(page).getByRole('heading', { name: 'ใบลดหนี้ MA-CN261000001' })).toBeVisible();
  await app.settle();
  const made = (await app.state()).DB;
  expect(made.creditNotes.map((x: any) => x.no)).toEqual(['MA-CN261000001']);
  expect(qty(made)).toBe(qty(start) + 1);
  await form(page).getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The point restored: the credit note goes with its stock and refund, in the browser and on the server.
  await page.getByRole('button', { name: /^10 ตั้งค่าองค์กร/ }).click();
  await backups.selectOption({ label: '13/10/2569' });
  await page.getByRole('button', { name: 'กู้คืนข้อมูลจากจุดสำรองที่เลือก' }).click();
  await confirmWithWord(page, 'กู้คืน');
  await expect(page.getByText('กู้คืนข้อมูลเรียบร้อยแล้ว')).toBeVisible();
  await app.settle();
  const restored = (await app.state()).DB;
  expect(restored.creditNotes).toBeUndefined();
  expect(qty(restored)).toBe(qty(start));
  const server = await app.serverDB() as any;
  expect([server.creditNotes, qty(server)]).toEqual([undefined, qty(start)]);
  // The sale is as before the credit note: no adjustment left on it.
  const sale = (db: any) => db.stockCuts.find((x: any) => x.no === 'MA-SA261000010');
  expect(sale(restored).adj ?? []).toEqual(sale(start).adj ?? []);
});
