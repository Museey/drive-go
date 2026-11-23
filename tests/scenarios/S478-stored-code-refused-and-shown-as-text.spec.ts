import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { restoreLocalStorage } from '../support/browser.mjs';
import { openTestShopWith } from '../support/new-shop.mjs';
import { storageApi } from '../support/storage-api';

// Security review 2026-11-23 (docs/SECURITY-AUDIT-2026-11.md ก5; the owner: "ทำข้อที่คุณทำเองได้ก่อนเลยครับ"): an employee
// could save, with a request made round the screens, a record whose id, a quotation's status, a capital entry's type or
// a product's picture carried code, which ran when the owner opened the menu. The server refuses such values
// (server/lib/formats.ts) and keeps what people type (quotes and & in names); the ProX knowledge room and the Coins
// table, which showed what was typed as HTML, show it as text (frontend/CHANGES.md 180–181). The shop's page may send
// requests only to the app itself.
const HIT = 'window.__xss=(window.__xss??0)+1';   // (no |: the Coins balance joins plate and name with it)
const TAG = `<img src=x onerror="${HIT}">`;
const DQ = `"><svg onload="${HIT}">`;

test.use({ dataset: 'prox-trial' });

test('S478 ระบบใหม่: server ไม่รับ id สถานะ ประเภท รูป และไฟล์ที่ฝังโค้ด ห้องข้อมูลเทคนิคและ DriveGo Coins แสดงข้อความที่มีแท็กเป็นตัวอักษร', async ({ page }) => {
  test.slow();
  const shop = await openTestShopWith('prox-trial', db => {
    db.px.learn[0].title = `บทความ ${TAG}`;
    db.px.learn[0].desc = `รายละเอียด ${DQ}`;
    db.px.learn[0].by = TAG;
    db.px.coins = [{ rcNo: TAG, plate: DQ, cust: `คุณ ${TAG}`, amt: 1500, earn: 15, date: '2026-10-12' }];
  });
  const app = legacyApp(page, { dataset: 'prox-trial', url: `${LEGACY_ORIGIN}/${shop.code}/`, restore: restoreLocalStorage });
  await app.loginAsOwner();
  const ran = () => page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0);

  // What was typed shows as typed.
  await page.getByRole('button', { name: /ห้องข้อมูลเทคนิค/ }).click();
  await page.getByRole('button', { name: '🌐 Publish Data · แบ่งปันเครือข่าย' }).click();
  await expect(page.getByText(`บทความ ${TAG}`, { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText(`รายละเอียด ${DQ}`, { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: 'เปิดดู' }).filter({ visible: true }).first().click();
  await expect(page.locator('#pxvBody').getByText(`รายละเอียด ${DQ}`, { exact: true })).toBeVisible();
  await page.locator('#mPxView').getByRole('button', { name: 'ปิด', exact: true }).click();
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await page.getByRole('button', { name: 'DriveGo Coins' }).click();
  const coin = page.locator('#pxCoinTbl tbody tr').first();
  await expect(coin).toContainText(TAG);
  await expect(coin).toContainText(DQ);
  await expect(page.locator('#pxCoinBalTbl tbody tr').first()).toContainText(`คุณ ${TAG}`);
  expect(await ran()).toBe(0);

  // Saves made round the screens: refused, each with what is wrong.
  const api = storageApi(page);
  const refused = (what: string) => ({ status: 403, body: { error: 'not allowed', what } });
  expect(await api.save('garage.v22', 'DB.quotes', "Q');x;('", { id: "Q');x;('" })).toEqual(refused("DB.quotes|Q');x;(': id"));
  expect(await api.save('garage.v22', 'DB.quotes', 'QX2', { id: 'QX2', no: 'QO-X', status: TAG })).toEqual(refused('DB.quotes|QX2: status: label'));
  expect(await api.save('garage.v22', 'DB.capital', 'KX1', { id: 'KX1', type: DQ, amt: 1 })).toEqual(refused('DB.capital|KX1: type: label'));
  // (a data: picture in a product is refused already: pictures are uploaded as files, task 3.11)
  expect(await api.save('garage.v22', 'DB.stock', 'SX1', { id: 'SX1', name: 'x', img: 'x" onerror="' + HIT })).toEqual(refused('DB.stock|SX1: img: picture'));
  expect(await api.save('garage.v22', 'DB.receipts', 'RX1', { id: 'RX1', custId: `C1${DQ}` })).toEqual(refused('DB.receipts|RX1: custId: id'));
  expect(await api.save('garage.v22', 'DB.px.learn', 'LX1', { id: 'LX1', title: 'x', kind: 'note', mime: '', fname: 'a.txt', data: 'javascript:' + HIT }))
    .toEqual(refused('DB.px.learn|LX1: data: file'));
  // What people type is kept: quotes, & and angle brackets in a name.
  const named = { id: 'CX1', name: 'หจก. ช่าง "ดี" & ลูก <สาขา 2>', tel: '', lineId: '@chang.d', vehicles: [] };
  expect(await api.save('garage.v22', 'DB.cust', 'CX1', named)).toMatchObject({ status: 200 });

  // The page's policy: requests to the app itself only (and the tests' chain stand-in), pictures from the app or the page.
  const csp = await page.evaluate(async () => (await fetch(location.href, { cache: 'no-store' })).headers.get('content-security-policy'));
  expect(csp).toContain("connect-src 'self' https://chain.drivego.test;");
  expect(csp).toContain("img-src 'self' data: blob:;");
  expect(csp).toContain("default-src 'self';");
  expect(await ran()).toBe(0);
});
