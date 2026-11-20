import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { openRealTestShop, setOwnPassword } from '../support/new-shop.mjs';
import { storageApi } from '../support/storage-api';

// New behaviour (team's check of 2026-11-18, the owner's decision of 2026-11-19, decision A1): the legacy file's
// test-copy links are not part of the system: "?freshTrial=1" (which replaced every document with a trial set after two
// questions) does nothing and leaves the address. A shop that is not a trial cannot load sample data even by calling
// its functions directly (seedDemoNow went past the server as an ordinary save). And the server refuses an ordinary save
// that removes many documents or master records at once (more than 20): only a wipe, restore, import or sample data
// replaces data wholesale, with a copy first (S100, S260).
test('S468 ระบบใหม่: ลิงก์ของสำเนาทดสอบ ?freshTrial=1 ไม่ทำอะไร ร้านที่ไม่ใช่ร้านทดลองเรียกโหลดข้อมูลตัวอย่างโดยตรงไม่ได้ และ server ไม่รับการลบเอกสารจำนวนมากในครั้งเดียว', async ({ app, page }) => {
  test.slow();
  const question = (title: string) => page.getByRole('heading', { name: title, exact: true }).filter({ visible: true });

  // The test's own shop (a trial): the link is dropped before the page's scripts read it; no question, nothing changes.
  await app.open('freshTrial=1');
  expect(new URL(page.url()).searchParams.has('freshTrial')).toBe(false);
  await app.login('dg1688', '123456');
  await app.settle();
  const before = await app.serverDB() as { stockCuts: unknown[]; receipts: unknown[]; cust: { id: string }[] };
  await page.waitForTimeout(9000);   // the legacy link acted after sign-in, then up to 8 s later
  await expect(question('สร้างข้อมูลทดลองชุดใหม่')).toHaveCount(0);
  await app.settle();
  const after = await app.serverDB() as typeof before;
  expect([after.stockCuts.length, after.receipts.length, after.cust.length]).toEqual([before.stockCuts.length, before.receipts.length, before.cust.length]);

  // Many master records removed in one ordinary save: refused, nothing removed.
  const api = storageApi(page);
  const removing = before.cust.slice(0, 21).map(c => ({ unit: 'DB.cust', key: c.id }));
  const refused = await api.removeRows('garage.v22', removing);
  expect([refused.status, refused.body]).toEqual([403, { error: 'not allowed', what: 'mass removal' }]);
  expect(((await app.serverDB()) as typeof before).cust.length).toBe(before.cust.length);

  // A pilot garage: calling the sample-data functions directly does nothing, and the link does nothing either.
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  const shop = await openRealTestShop({ pkg: 'biz', kind: 'pilot', name: 'อู่นำร่อง', owner: 'นำร่อง ทดสอบ' });
  const real = legacyApp(page, { dataset: 'biz-trial', url: `${LEGACY_ORIGIN}/${shop.code}/`, restore: async () => {} });
  await real.open('freshTrial=1');
  expect(new URL(page.url()).searchParams.has('freshTrial')).toBe(false);
  await real.login(shop.user, shop.password);
  await setOwnPassword(page);   // a password DriveGo's team issued: replaced at the first sign-in (owner 2026-11-20)
  const read = async () => (await api.read('garage.v22')).data as { shop: { name: string }; stock: unknown[]; cust: unknown[]; emp: unknown[] };
  const was = await read();
  expect(await page.evaluate('[seedDemoNow(), seedDemo36Now(), seedDemo(), seedDemo36()]')).toEqual([false, false, false, false]);
  await expect(question('โหลดข้อมูลตัวอย่าง')).toHaveCount(0);
  await page.waitForTimeout(500);
  const now = await read();
  expect([now.shop.name, now.stock.length, now.cust.length, now.emp.length]).toEqual([was.shop.name, was.stock.length, was.cust.length, was.emp.length]);
  expect(now.shop.name).toBe('อู่นำร่อง');
});
