import { readFile } from 'node:fs/promises';
import { test, expect } from '../support/test';

// The window "สร้างใบเสร็จรับเงิน — เลือกใบตัดสต็อก" (4.3 "+ สร้างใบเสร็จรับเงิน") shows 50 stock cuts a page; its page
// buttons ‹ 2 › appear only with more than 50 cuts to pick, and the trial shop has 15. The shop's backup file is
// exported (11.3), 45 copies of the unpaid counter sale MA-SA261000003 are added to the file (as another branch's
// data or an older backup could hold), and the file is imported back with "กู้คืนจากไฟล์สำรอง". No other scenario
// pressed the page buttons (docs/BEHAVIORS.md).
test('S425 หน้าต่างเลือกใบตัดสต็อกที่มีมากกว่า 50 ใบ (นำเข้าจากไฟล์สำรอง): ปุ่มหน้า 2 ‹ และ ›', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  const openDataPage = async () => {
    await page.getByRole('button', { name: /11 ตั้งค่าเพิ่มเติม/ }).click();
    await page.getByRole('button', { name: /11\.3 นำเข้า \/ ส่งออกข้อมูล/ }).click();
    await expect(page.getByRole('heading', { name: '11.3 · นำเข้า / ส่งออกข้อมูล' })).toBeVisible();
  };

  // Export the backup file and add 45 unpaid counter sales to it.
  await openDataPage();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: /ส่งออกไฟล์สำรองทั้งระบบ/ }).click();
  const data = JSON.parse(await readFile(await (await downloading).path(), 'utf8'));
  await golden.step('ส่งออกไฟล์สำรองทั้งระบบ');
  const cut = data.stockCuts.find((c: any) => c.no === 'MA-SA261000003');
  const led = data.receipts.find((r: any) => r.id === cut.ledId);
  for (let i = 1; i <= 45; i++) {
    const no = 'MA-SA26100' + String(100 + i).padStart(4, '0');
    const id = 's425cut' + String(i).padStart(3, '0'), ledId = 's425led' + String(i).padStart(3, '0');
    data.stockCuts.push({ ...structuredClone(cut), id, no, moveRef: no, ledId });
    data.receipts.push({ ...structuredClone(led), id: ledId, no, saleId: id });
  }

  await page.getByRole('button', { name: /กู้คืนจากไฟล์สำรอง/ }).click();
  const choosing = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'เลือกไฟล์และนำเข้า' }).click();
  await (await choosing).setFiles({ name: 'garage-backup-2026-10-13.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await expect(page.getByText('นำเข้าข้อมูลเรียบร้อย', { exact: true })).toBeAttached();
  await app.settle();
  await golden.step('นำเข้าไฟล์สำรองที่มีใบตัดสต็อกค้างชำระเพิ่ม 45 ใบ');
  await golden.counts('after-import');

  // 4.3 "+ สร้างใบเสร็จรับเงิน": 55 cuts, page 1 of 2.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.3 ใบเสร็จรับเงิน' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสร็จรับเงิน' }).filter({ visible: true }).click();
  const pick = page.locator('#mSalePick');
  const info = pick.getByText(/^พบ 55 รายการ/).first();
  await expect(info).toHaveText('พบ 55 รายการ · แสดง 1–50 · หน้า 1/2');
  await golden.step('หน้าต่างเลือกใบตัดสต็อก 55 ใบ หน้า 1/2');
  const pager = pick.locator('.pgbar').first();
  await pager.getByRole('button', { name: '2', exact: true }).click();
  await expect(info).toHaveText('พบ 55 รายการ · แสดง 51–55 · หน้า 2/2');
  await golden.step('กดหน้า 2');
  await golden.screen('pick-page-2');
  await pager.getByRole('button', { name: '‹' }).click();
  await expect(info).toHaveText('พบ 55 รายการ · แสดง 1–50 · หน้า 1/2');
  await golden.step('กด ‹ กลับหน้า 1');
  await pager.getByRole('button', { name: '›' }).click();
  await expect(info).toHaveText('พบ 55 รายการ · แสดง 51–55 · หน้า 2/2');
  await golden.step('กด › ไปหน้า 2');
});
