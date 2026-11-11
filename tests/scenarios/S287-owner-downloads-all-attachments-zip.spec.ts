import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { restoreLocalStorage } from '../support/browser.mjs';
import { openTestShopWith, readTestShop } from '../support/new-shop.mjs';
import { linkOfFile } from '../support/files';
import { readZip } from '../support/zip';

// New behaviour (owner's answer 11.5, "เริ่มแก้ XSS แล้วทำปุ่ม .zip ต่อเลยครับ" 2026-11-11; docs/NOTES.md "ไฟล์แนบทั้งหมด
// เป็น .zip"): the JSON backup keeps links to the attachments (/api/files/<id>), so menu 10 has a button under the file
// space that downloads every attachment of the shop as one .zip: a folder per kind, each file under the name the
// data gave it, and a list that maps each link of the JSON file to its file. The same picture on two products is one
// file. For the owner, like the backup file: an employee's direct call is refused.
const PICTURE = 'tests/assets/S52-fuel-system-cleaner.png', PICTURE2 = 'tests/assets/S86-ac-gauge-reading.png', SLIP = 'tests/assets/S192-transfer-slip.png';
const dataUrl = (path: string) => 'data:image/png;base64,' + readFileSync(path).toString('base64');

test('S287 ระบบใหม่: เจ้าของร้านดาวน์โหลดไฟล์แนบทั้งหมดเป็น .zip จากเมนู 10 ได้โฟลเดอร์ตามชนิดไฟล์ ชื่อไฟล์ตามข้อมูล และรายการที่จับคู่ลิงก์ในไฟล์สำรอง พนักงานดาวน์โหลดไม่ได้', async ({ page }) => {
  test.slow();
  const shop = await openTestShopWith('biz-trial', db => {
    db.stock[0].img = dataUrl(PICTURE);                       // ไดชาร์จ Toyota Revo
    db.stock[1].img = dataUrl(PICTURE2);
    db.stock[1].name = 'ไดสตาร์ท D-Max 12V/2.0kW';
    db.stock[2].img = dataUrl(PICTURE);                       // the same picture: one file
    db.paySlips = { 'PAY-S287': [{ url: dataUrl(SLIP), name: 'สลิปโอน 13-10.png' }] };
  });
  const app = legacyApp(page, { dataset: 'biz-trial', url: `${LEGACY_ORIGIN}/${shop.code}/`, restore: restoreLocalStorage });
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const info = page.locator('#storeInfo');
  await expect(info).toContainText('ใช้พื้นที่ไฟล์');
  const button = info.getByRole('button', { name: 'ดาวน์โหลดไฟล์แนบทั้งหมด (.zip)' });

  const download = page.waitForEvent('download');
  await button.click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('garage-files-2026-10-13.zip');
  const zip = readZip(readFileSync((await file.path())!));
  const byName = Object.fromEntries(zip.map(e => [e.name, e.bytes]));
  expect(zip.map(e => e.name).sort()).toEqual([
    'รายการไฟล์แนบ.csv',
    'รูปสินค้า/ไดชาร์จ Toyota Revo.png',
    'รูปสินค้า/ไดสตาร์ท D-Max 12V_2.0kW.png',
    'หลักฐานทางบัญชี/สลิปโอน 13-10.png',
  ].sort());
  expect(zip[0].name).toBe('รายการไฟล์แนบ.csv');
  expect(byName['รูปสินค้า/ไดชาร์จ Toyota Revo.png'].equals(readFileSync(PICTURE))).toBe(true);
  expect(byName['รูปสินค้า/ไดสตาร์ท D-Max 12V_2.0kW.png'].equals(readFileSync(PICTURE2))).toBe(true);
  expect(byName['หลักฐานทางบัญชี/สลิปโอน 13-10.png'].equals(readFileSync(SLIP))).toBe(true);

  // The list: each link the data (and so the JSON backup) holds, with its file in the zip.
  const data = await readTestShop(shop.code);
  expect(data.stock[0].img).toBe(linkOfFile(PICTURE));
  expect(data.stock[2].img).toBe(linkOfFile(PICTURE));
  const list = byName['รายการไฟล์แนบ.csv'].toString('utf8');
  expect(list.startsWith('﻿ไฟล์ในชุดนี้,ลิงก์ในไฟล์สำรอง (JSON),ชนิดไฟล์,ขนาด (ไบต์),วันที่แนบ\r\n')).toBe(true);
  const rows = list.trim().split('\r\n').slice(1).map(l => l.split(','));
  expect(rows.map(r => [r[0], r[1], r[2], Number(r[3])]).sort()).toEqual([
    ['รูปสินค้า/ไดชาร์จ Toyota Revo.png', linkOfFile(PICTURE), 'image/png', readFileSync(PICTURE).length],
    ['รูปสินค้า/ไดสตาร์ท D-Max 12V_2.0kW.png', linkOfFile(PICTURE2), 'image/png', readFileSync(PICTURE2).length],
    ['หลักฐานทางบัญชี/สลิปโอน 13-10.png', linkOfFile(SLIP), 'image/png', readFileSync(SLIP).length],
  ].sort());

  // The cashier (EMP008) gets an account, as in S121: the server refuses them the download.
  const cashier = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashier.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('88888888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await app.settle();
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('0923334455', '88888888');
  const refused = await page.evaluate(async () => {
    const r = await fetch('/api/files/zip?key=garage.v22');
    return { status: r.status, body: await r.json() };
  });
  expect(refused).toEqual({ status: 403, body: { error: 'not allowed' } });
});
