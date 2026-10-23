import { readFile } from 'node:fs/promises';
import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S75 in the new system (tests/intentional-changes.json, task 3.2,
// decisions A7, F1): wiping the data and loading the sample data keep the
// shop's 8 document counters (S75 had none left), so no number issued before
// is issued again. Every step, message, screen and every other record count
// is still S75's; importing the exported file brings back the same counters.
const S75 = 'S75-export-file-load-sample-import.spec.ts';

test('S132 ระบบใหม่: ส่งออกไฟล์สำรอง ล้างข้อมูล โหลดข้อมูลตัวอย่าง แล้วนำเข้าไฟล์กลับ ตัวนับเลขที่เอกสารไม่หายและไม่ย้อน', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S75, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');
  const counters = (await app.state()).DB.seq;
  expect(Object.keys(counters)).toHaveLength(8);

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
  const file = { name: download.suggestedFilename(), mimeType: 'application/json', buffer: await readFile(await download.path()) };
  await golden.step('ส่งออกไฟล์สำรอง garage-backup-2026-10-13.json');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await golden.step('เมนู 10 ล้างข้อมูลทั้งหมด');

  await page.getByRole('button', { name: 'โหลดข้อมูลตัวอย่าง' }).click();
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible();
  await golden.step('กดโหลดข้อมูลตัวอย่าง (ไม่มีถามยืนยัน)');
  await golden.counts('after-sample-data', { 'DB.seq': '{8 keys}' });
  expect((await app.state()).DB.seq).toEqual(counters);
  await golden.screen('home-sample-data');

  await openDataPage();
  await page.getByRole('button', { name: /กู้คืนจากไฟล์สำรอง/ }).click();
  await golden.step('กดกู้คืนจากไฟล์สำรอง ระบบเตือนก่อนเลือกไฟล์');
  await golden.screen('import-warning');
  const choosing = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'เลือกไฟล์และนำเข้า' }).click();
  await (await choosing).setFiles(file);
  await expect(page.getByText('นำเข้าข้อมูลเรียบร้อย', { exact: true })).toBeAttached();
  await golden.step('เลือกไฟล์ที่ส่งออกไว้ นำเข้าแล้ว');
  await golden.counts('after-import');
  expect((await app.state()).DB.seq).toEqual(counters);
  await page.getByText('สำรอง / กู้คืนทั้งระบบ', { exact: true }).scrollIntoViewIfNeeded();
  await golden.screen('data-page-after-import');

  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await golden.step('หน้าแรกหลังนำเข้า');
  await golden.screen('home-after-import');
  golden.done();
});
