import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { hqOwnData } from '../support/hq-own-data';

test.use({ dataset: 'franchise-trial' });

// Replaces S305 in the new system (tests/intentional-changes.json, decision Q3, as S112 replaces S90): HQ works on its
// own data set, so HQ's screens show the chain's name, HQ's own (empty) menu badge and approval bell
// (tests/support/hq-own-data.ts): checked there and left out of the pictures. Every step and the rest of each screen
// are S305's.
const S305 = 'S305-hq-refresh-dashboard-and-home.spec.ts';

test('S454 ระบบใหม่: HQ (ข้อมูลของ HQ เอง) กดรีเฟรชแดชบอร์ดรวมทุกสาขา และรีเฟรชภาพรวมทั้งเครือที่หน้าแรก', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S305, { app, page, testInfo });
  await app.loginAsOwner();
  await expect(page.getByText('ยอดขายรวมทุกสาขา · เดือนนี้').filter({ visible: true })).toBeVisible();
  await golden.step('HQ เข้าสู่ระบบ เห็นแดชบอร์ดรวมทุกสาขา');

  const refresh = page.getByRole('button', { name: '⟳ รีเฟรช' }).filter({ visible: true });
  await refresh.click();
  await expect(page.getByText('ยอดขายรวมทุกสาขา · เดือนนี้').filter({ visible: true })).toBeVisible();
  await app.settle();
  await golden.step('กดรีเฟรชแดชบอร์ด');
  await golden.screen('hq-dashboard-refreshed', { mask: await hqOwnData(page) });

  await page.getByRole('row').filter({ hasText: 'B001 · สาขาหลัก รังสิต' }).getByRole('button', { name: 'เข้าดูสาขา' }).click();
  await expect(page.getByRole('heading', { name: 'กำลังดูข้อมูลสาขา B001' })).toBeVisible();
  await page.getByRole('button', { name: '← กลับไปดูยอดรวมทุกสาขา' }).click();
  await expect(page.getByRole('heading', { name: 'ภาพรวมทั้งเครือ · ทุกสาขารวมกัน' })).toBeVisible();
  await golden.step('เข้าดูสาขา B001 แล้วกลับไปดูยอดรวมทุกสาขาที่หน้าแรก');

  await refresh.click();
  await expect(page.getByRole('heading', { name: 'ภาพรวมทั้งเครือ · ทุกสาขารวมกัน' })).toBeVisible();
  await app.settle();
  await golden.step('กดรีเฟรชภาพรวมทั้งเครือ');
  await golden.screen('hq-home-refreshed', { mask: await hqOwnData(page) });
  golden.done();
});
