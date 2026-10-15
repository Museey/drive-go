import { readFile } from 'node:fs/promises';
import { test, expect } from '../support/test';

test('S75 ส่งออกไฟล์สำรองทั้งระบบ ล้างข้อมูลแล้วลองโหลดข้อมูลตัวอย่าง จากนั้นนำเข้าไฟล์สำรองกลับ ข้อมูลเดิมกลับมา', async ({ app, page, golden }) => {
  test.slow(); // many steps; each one waits for the saved data to settle
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  const openDataPage = async () => {
    await page.getByRole('button', { name: /11 ตั้งค่าเพิ่มเติม/ }).click();
    await page.getByRole('button', { name: /11\.3 นำเข้า \/ ส่งออกข้อมูล/ }).click();
    await expect(page.getByRole('heading', { name: '11.3 · นำเข้า / ส่งออกข้อมูล' })).toBeVisible();
  };

  await openDataPage();
  await golden.step('เมนู 11.3 นำเข้า / ส่งออกข้อมูล');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: /ส่งออกไฟล์สำรองทั้งระบบ/ }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('garage-backup-2026-10-13.json');
  // Handed back as content, not as a path: a file under the test's output folder (Thai test
  // title in the folder name) is silently not picked up by the file chooser.
  const file = { name: download.suggestedFilename(), mimeType: 'application/json', buffer: await readFile(await download.path()) };
  await golden.step('ส่งออกไฟล์สำรอง garage-backup-2026-10-13.json');

  // Counts are measured from an emptied shop: the order of the collections in the data the app
  // opened with depends on start-up timing, and the record-count referee keeps that order.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await golden.step('เมนู 10 ล้างข้อมูลทั้งหมด');

  await page.getByRole('button', { name: 'โหลดข้อมูลตัวอย่าง' }).click();
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible(); // back on the home page
  await golden.step('กดโหลดข้อมูลตัวอย่าง (ไม่มีถามยืนยัน)');
  await golden.counts('after-sample-data');
  await golden.screen('home-sample-data');

  await openDataPage();
  await page.getByRole('button', { name: /กู้คืนจากไฟล์สำรอง/ }).click();
  await golden.step('กดกู้คืนจากไฟล์สำรอง ระบบเตือนก่อนเลือกไฟล์');
  await golden.screen('import-warning');
  const choosing = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'เลือกไฟล์และนำเข้า' }).click();
  await (await choosing).setFiles(file);
  // The message fades after 2 seconds but its text stays on the page.
  await expect(page.getByText('นำเข้าข้อมูลเรียบร้อย', { exact: true })).toBeAttached();
  await golden.step('เลือกไฟล์ที่ส่งออกไว้ นำเข้าแล้ว');
  await golden.counts('after-import');
  await page.getByText('สำรอง / กู้คืนทั้งระบบ', { exact: true }).scrollIntoViewIfNeeded();
  await golden.screen('data-page-after-import'); // the "ในระบบ …" counts on the cards

  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await golden.step('หน้าแรกหลังนำเข้า');
  await golden.screen('home-after-import');
});
