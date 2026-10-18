import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';
import { legacyGolden } from '../support/legacy-golden';
import { hqOwnData } from '../support/hq-own-data';

test.use({ dataset: 'franchise-trial' });

// Replaces S91 in the new system (tests/intentional-changes.json, decision Q3):
// HQ works on its own data set, so HQ's screens show the chain's name, its own
// licence line and its own badges (tests/support/hq-own-data.ts). The import
// still copies the first branch's register, as the test copy did when HQ
// worked on that branch's data. Every step, data change and the rest of every
// screen are still S91's.
const S91 = 'S91-hq-central-stock.spec.ts';

async function answerPrompt(page: Page, value: string, button: string) {
  const ok = page.getByRole('button', { name: button, exact: true }).filter({ visible: true });
  await ok.waitFor();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type(value);
  await ok.click();
}

test('S113 ระบบใหม่: สำนักงานใหญ่ (ข้อมูลของ HQ เอง) ตั้งคลังกลาง นำเข้าทะเบียนจากสาขาแรก เพิ่มสินค้า แก้ยอด Min Max และลบรายการ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S91, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('HQ เข้าสู่ระบบ');

  await page.getByRole('button', { name: '🏭 คลังกลาง HQ (Min-Max)' }).click();
  await expect(page.getByText('คลังกลางยังว่าง', { exact: false }).filter({ visible: true })).toBeVisible();
  await golden.step('เปิดคลังกลาง HQ ยังว่าง');
  const before = await app.state();
  // HQ's own register is empty: the import still takes the first branch's (B001's) 52 items.
  expect((before as any).DB.stock).toEqual([]);

  await page.getByRole('button', { name: '⇪ นำเข้ารายการจากทะเบียนสาขาที่เปิดอยู่' }).click();
  await expect(page.getByText('52 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('นำเข้า 52 รายการจากทะเบียนสาขา');
  await golden.stateChange('import-from-branch', before);
  await golden.screen('hq-stock-imported', { mask: await hqOwnData(page) });

  const beforeEdit = await app.state();
  await page.getByRole('button', { name: '+ เพิ่มสินค้า' }).click();
  await golden.step('กดเพิ่มสินค้า ถามรหัสสินค้า');
  await answerPrompt(page, 'EV-140', 'ต่อไป');
  await golden.step('ถามชื่อสินค้า');
  await answerPrompt(page, 'สายไฟแรงสูง EV (เมตร)', 'บันทึก');
  const added = page.getByRole('row').filter({ hasText: 'สายไฟแรงสูง EV (เมตร)' });
  await expect(added).toBeVisible();
  await golden.step('เพิ่มสินค้าใหม่ในคลัง HQ แล้ว');

  const [qty, min, max] = [0, 1, 2].map(i => added.getByRole('spinbutton').nth(i));
  await qty.fill('100'); await qty.press('Tab');
  await min.fill('20'); await min.press('Tab');
  await max.fill('200'); await max.press('Tab');
  await golden.step('ตั้งยอดคงคลัง 100 Min 20 Max 200');

  await page.getByRole('row').filter({ hasText: 'OT-999' }).getByRole('button', { name: '✕' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'OT-999' })).toHaveCount(0);
  await expect(page.getByText('52 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('ลบรายการ OT-999 ออกจากคลัง HQ');
  await added.scrollIntoViewIfNeeded();
  await golden.screen('hq-stock-after-edit', { mask: await hqOwnData(page) });
  await golden.stateChange('add-edit-delete', beforeEdit);
  golden.done();
});
