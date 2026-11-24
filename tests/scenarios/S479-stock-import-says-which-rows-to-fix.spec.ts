import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (owner 2026-11-24 "ทำข้อ 1 เลยครับ"; frontend/CHANGES.md 182): a shop's file of 1,320 parts was skipped
// whole with only "ข้าม 1319 แถว (ตัวเลขไม่ถูกต้อง)". The parts import now says where: the file's row (as Excel numbers
// it), the column's letter and name and what is in it, for the first 5 rows.
// · tests/assets/S479-stock-bad-numbers.csv: what Excel writes for an accounting or currency format ("-" for 0, "฿250.00")
//   and a unit typed after a number, in 7 rows, and one row with no name: nothing is added, the window says so and lists
//   rows 2–6 and "และอีก 2 แถว".
// · tests/assets/S473-stock.csv: the confirmation lists its three rows (a quantity, a price, a Min below 0).
// · tests/assets/S479-stock-no-header.csv: with no header row the first row is row 1.
const choose = async (page: Page, file: string) => {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /^นำเข้าสินค้าใหม่จากไฟล์ CSV/ }).click();
  await (await chooser).setFiles(file);
};
const ask = (page: Page) => page.locator('div.panel, .modal, [role=dialog]')
  .filter({ has: page.getByRole('heading', { name: 'นำเข้าสินค้าจาก CSV', exact: true }) }).filter({ visible: true }).first();

test('S479 ระบบใหม่: นำเข้าสินค้าจาก CSV บอกแถว คอลัมน์ และค่าที่ต้องแก้ของแถวที่ข้ามเพราะตัวเลข', async ({ app, page }) => {
  await app.loginAsOwner();
  const start = (await app.state()).DB;
  await page.getByRole('button', { name: '11 ตั้งค่าเพิ่มเติม' }).click();
  await page.getByRole('button', { name: '11.3 นำเข้า / ส่งออกข้อมูล' }).click();

  // Nothing to add: a window (not a passing message) with the rows to fix, and only "ตกลง".
  await choose(page, 'tests/assets/S479-stock-bad-numbers.csv');
  const none = ask(page);
  for (const line of [
    'ไม่มีรายการใหม่ให้เพิ่ม',
    'ข้าม 1 แถว (ข้อมูลไม่ครบหรือรหัสซ้ำ)',
    'ข้าม 7 แถว (ตัวเลขไม่ถูกต้อง)',
    'แถวที่ต้องแก้ (เลขแถวตาม Excel):',
    'แถว 2 คอลัมน์ J ราคาขาย C: -',
    'แถว 3 คอลัมน์ I ราคาขาย B: -, คอลัมน์ J ราคาขาย C: -',
    'แถว 4 คอลัมน์ H ราคาขาย A: ฿250.00',
    'แถว 5 คอลัมน์ K จุดสั่งซื้อ Min: -, คอลัมน์ L สต๊อกสูงสุด Max: -',
    'แถว 6 คอลัมน์ K จุดสั่งซื้อ Min: 10 ชิ้น',
    'และอีก 2 แถว',
  ]) await expect(none).toContainText(line);
  await expect(none).not.toContainText('แถว 7');
  await expect(none.getByRole('button', { name: 'ยังไม่ตอนนี้', exact: true })).toBeHidden();
  await none.getByRole('button', { name: 'ตกลง', exact: true }).click();
  await expect(none).toBeHidden();
  await app.settle();
  expect((await app.state()).DB.stock).toHaveLength(start.stock.length);

  // Some to add: the confirmation lists the rows it skips.
  await choose(page, 'tests/assets/S473-stock.csv');
  const some = ask(page);
  await expect(some).toContainText('พบสินค้าใหม่ 1 รายการ');
  for (const line of [
    'แถว 2 คอลัมน์ F จำนวนคงเหลือ: abc',
    'แถว 3 คอลัมน์ H ราคาขาย A: 12abc',
    'แถว 4 คอลัมน์ K จุดสั่งซื้อ Min: -1',
  ]) await expect(some).toContainText(line);
  await expect(some).not.toContainText('และอีก');
  await some.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await expect(some).toBeHidden();

  // No header row: the first row is row 1.
  await choose(page, 'tests/assets/S479-stock-no-header.csv');
  const bare = ask(page);
  await expect(bare).toContainText('แถว 1 คอลัมน์ H ราคาขาย A: abc');
  await bare.getByRole('button', { name: 'ตกลง', exact: true }).click();
  await app.settle();
  expect((await app.state()).DB.stock).toHaveLength(start.stock.length);
});
