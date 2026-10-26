import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';
import { confirmWithShopName } from '../support/whole-data';
import { LINK, fetchFile, linkOfFile } from '../support/files';

// New behaviour (task 3.11, decision R19-ค, owner's answer 11.5): a backup file of the legacy app keeps its
// pictures inside the data. Imported into the new system, they are uploaded as files on the way to the server
// and the data keeps their links; the shop logo stays inside the data. A backup file exported from the new
// system keeps the links (the separate "ดาวน์โหลดไฟล์แนบทั้งหมด (.zip)" comes later, NOTES.md).
const PICTURE = 'tests/assets/S52-fuel-system-cleaner.png';
const SLIP = 'tests/assets/S192-transfer-slip.png';
const dataUrl = (path: string) => 'data:image/png;base64,' + readFileSync(path).toString('base64');

test('S197 ระบบใหม่: นำเข้าไฟล์สำรองของระบบเดิมที่มีรูปอยู่ในข้อมูล รูปถูกแยกเป็นไฟล์ ข้อมูลเก็บลิงก์ ส่งออกอีกครั้งได้ลิงก์ โลโก้อยู่ในข้อมูลเหมือนเดิม', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const shopName = (await app.state() as any).DB.shop.name;
  const openDataPage = async () => {
    await page.getByRole('button', { name: /11 ตั้งค่าเพิ่มเติม/ }).click();
    await page.getByRole('button', { name: /11\.3 นำเข้า \/ ส่งออกข้อมูล/ }).click();
  };
  const exportFile = async () => {
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: /ส่งออกไฟล์สำรองทั้งระบบ/ }).click();
    return JSON.parse(await readFile(await (await downloading).path(), 'utf8'));
  };

  // A file as the legacy app exports it, with a product picture, a payment slip and the logo inside.
  await openDataPage();
  const legacy = await exportFile();
  const item = legacy.stock.find((s: any) => s.code === 'MS-995');
  item.img = dataUrl(PICTURE);
  legacy.paySlips = { STold1: [{ url: dataUrl(SLIP), name: 'สลิปเดิม.png', line: null }] };
  legacy.shop.logo = dataUrl(SLIP);

  await page.getByRole('button', { name: /กู้คืนจากไฟล์สำรอง/ }).click();
  const choosing = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'เลือกไฟล์และนำเข้า' }).click();
  await (await choosing).setFiles({ name: 'garage-backup-legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy, null, 2)) });
  await confirmWithShopName(page, shopName, 'นำเข้า');
  await expect(page.getByText('นำเข้าข้อมูลเรียบร้อย', { exact: true })).toBeAttached();
  await app.settle();

  const db = (await app.state() as any).DB;
  expect(db.stock.find((s: any) => s.code === 'MS-995').img).toBe(linkOfFile(PICTURE));
  expect(db.paySlips.STold1).toEqual([{ url: linkOfFile(SLIP), name: 'สลิปเดิม.png', line: null }]);
  expect(db.shop.logo).toBe(dataUrl(SLIP));
  const server = await app.serverDB();
  expect([server.stock.find((s: any) => s.code === 'MS-995').img, server.paySlips.STold1, server.shop.logo])
    .toEqual([linkOfFile(PICTURE), db.paySlips.STold1, dataUrl(SLIP)]);
  for (const [link, path] of [[linkOfFile(PICTURE), PICTURE], [linkOfFile(SLIP), SLIP]]) {
    const f = await fetchFile(page, link);
    expect([f.status, f.type, f.bytes.equals(readFileSync(path))]).toEqual([200, 'image/png', true]);
  }

  // Exported again: links, not pictures (the logo stays inside).
  const again = await exportFile();
  expect(again.stock.find((s: any) => s.code === 'MS-995').img).toMatch(LINK);
  expect(again.paySlips.STold1[0].url).toMatch(LINK);
  expect(JSON.stringify({ ...again, shop: {} })).not.toContain('data:image');
});
