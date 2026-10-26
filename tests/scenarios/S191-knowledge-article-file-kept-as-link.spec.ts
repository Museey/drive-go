import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { fetchFile, fileState, linkOfFile, sha256 } from '../support/files';

test.use({ dataset: 'prox-trial' });

// Replaces S86 in the new system (tests/intentional-changes.json, task 3.11, decision R19-ค): the picture
// attached to a knowledge article is kept by the server as a file; the article's data field holds its link
// (/api/files/<SHA-256 of the file>) instead of the picture. Every step and screen is S86's (the article shows
// the same picture, loaded from the link); deleting the article deletes the file (restorable for 30 days).
const S86 = 'S86-knowledge-library-article-lifecycle.spec.ts';
const ASSET = 'tests/assets/S86-ac-gauge-reading.png';
const PICTURE = 'data:image/png;base64,' + readFileSync(ASSET).toString('base64');
const LINK = linkOfFile(ASSET);
// S86's data change with the link where the picture was.
const withLink = (name: string) => JSON.parse(legacyStateChange(S86, name).split(PICTURE).join(LINK));

test('S191 ระบบใหม่: ไฟล์ที่แนบในบทความคลังความรู้เก็บเป็นไฟล์ที่ server บทความเก็บลิงก์ หน้าจอเหมือน S86 ลบบทความแล้วไฟล์ถูกลบ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S86, { app, page, testInfo });
  const confirms: string[] = [];
  page.on('dialog', dialog => { confirms.push(`${dialog.type()}: ${dialog.message()}`); dialog.accept(); });

  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  const fillSamples = page.getByRole('button', { name: '▶ เติมชุดความรู้ตัวอย่าง (P2)' });
  let before = await app.state();
  await fillSamples.click();
  await golden.step('เมนู P1 กดเติมชุดความรู้ตัวอย่าง');
  await golden.stateChange('sample-knowledge', before);

  await fillSamples.click();
  await golden.step('กดเติมชุดความรู้ตัวอย่างซ้ำ');

  await page.getByRole('button', { name: /ห้องข้อมูลเทคนิค/ }).click();
  await page.getByRole('button', { name: '🌐 Publish Data · แบ่งปันเครือข่าย' }).click();
  await page.getByRole('button', { name: '+ เพิ่มบทความ / อัปโหลดคลิป' }).click();
  await golden.step('P2 แท็บ Publish Data เปิดฟอร์มเพิ่มบทความ');

  const save = page.getByRole('button', { name: 'บันทึกเข้าคลังความรู้' });
  await save.click();
  await golden.step('กดบันทึกโดยยังไม่กรอกชื่อเรื่อง');

  const title = 'ค่าแรงดันน้ำยาแอร์ที่วัดได้ Toyota Yaris ATIV';
  await page.getByLabel('ชื่อเรื่อง *').fill(title);
  await page.getByLabel('หมวดหมู่').filter({ visible: true }).selectOption('ปริมาณน้ำมันคอมพ์');
  await save.click();
  await golden.step('กดบันทึกโดยยังไม่แนบไฟล์และไม่มีคำอธิบาย');

  await page.getByLabel('แนบไฟล์บทความ (PDF / รูป / เอกสาร) หรือคลิปวิดีโอ').setInputFiles(ASSET);
  await expect(page.getByText('✓ แนบ S86-ac-gauge-reading.png', { exact: false })).toBeVisible();
  await page.getByLabel('คำอธิบาย / สรุปเนื้อหา (ไม่แนบไฟล์ก็บันทึกเป็นบทความข้อความได้)')
    .fill('รอบเดินเบา แอร์เปิดสุด: ฝั่งต่ำ 30–35 psi ฝั่งสูง 180–200 psi ที่อุณหภูมิ 32°C');

  before = await app.state();
  await save.click();
  const del = page.getByRole('button', { name: 'ลบ', exact: true }).filter({ visible: true });
  await expect(del).toHaveCount(1);
  await golden.step('แนบรูป กรอกคำอธิบาย แล้วบันทึกเข้าคลังความรู้');
  await golden.stateChange('save-article', before, withLink('save-article'));
  // The file is the attached one, byte for byte, kept under its SHA-256 with its name, never sniffed or run.
  const file = await fetchFile(page, LINK);
  expect({ status: file.status, type: file.type, nosniff: file.nosniff, sandbox: /sandbox/.test(file.csp || ''), sha: sha256(file.bytes) })
    .toEqual({ status: 200, type: 'image/png', nosniff: 'nosniff', sandbox: true, sha: LINK.slice('/api/files/'.length) });
  await golden.screen('published-article');

  await page.getByRole('button', { name: 'เปิดดู', exact: true }).filter({ visible: true }).click();
  await expect(page.locator('#pxvBody img')).toHaveAttribute('src', LINK);
  await golden.step('เปิดดูบทความ');
  await golden.screen('view-article');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).click();

  before = await app.state();
  await page.getByTitle('คลิกเพื่อสลับการมองเห็น').click();
  await expect(del).toHaveCount(0);
  await golden.step('ปิดหน้าดูบทความ แล้วกดสลับเป็น Private');
  await golden.stateChange('toggle-private', before);

  await page.getByRole('button', { name: '🔒 Private Data · เฉพาะภายในอู่' }).click();
  await expect(del).toHaveCount(1);
  await golden.step('แท็บ Private Data');

  before = await app.state();
  await del.click();
  await expect(del).toHaveCount(0);
  await golden.step('หลังกดลบและยืนยัน');
  await golden.stateChange('delete-article', before, withLink('delete-article'));
  expect(await fileState(page, LINK.slice('/api/files/'.length))).toBe('deleted');

  expect(confirms.join('\n') + '\n').toBe(readFileSync(new URL(`../golden/${S86}/confirm-dialogs.txt`, import.meta.url), 'utf8'));
  golden.done();
});
