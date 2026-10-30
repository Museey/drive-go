import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';

test.use({ dataset: 'franchise-trial' });

// Replaces S98 in the new system (tests/intentional-changes.json, decision Q3):
// HQ works on its own data set, so turning the franchise mode off switches the
// screen from HQ's data to the first branch's (B001's), which the test copy
// already showed. What the switch changes is therefore S98's data change plus
// the swap of data sets: compared from B001's data, it is exactly S98's.
// Every step, every screen (all on B001's data) and the other data changes are
// still S98's.
// Task 3.15: the licence row of menu 10 is the server's (dates read-only, so no calendar button, and no
// "ต่ออายุ" buttons): left out of the screen where it shows (without the test copy's bar, owner's decision of
// 2026-10-30, the row comes up into the screen after the activation panel goes).
const S98 = 'S98-hq-turns-franchise-mode-off-and-on.spec.ts';

const ALL_MENUS = `
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button /00 Mr\\.DriveGo/
      - button /01 ลูกค้าสัมพันธ์/
      - button /P1 DriveGo ProX · Ecosystem/
      - button /02 ข้อมูลลูกค้า/
      - button /03 ใบเสนอราคา \\/ อนุมัติซ่อม/
      - button /04 ใบเสร็จรับเงิน \\/ ใบกำกับภาษี/
      - button /05 ข้อมูลผู้ขาย/
      - button /06 รายจ่าย \\/ ซื้อสินค้า/
      - button /07 สต๊อกอะไหล่/
      - button /08 บัญชี - การเงิน/
      - button /09 งานบุคคล/
      - button /P2 ห้องข้อมูลเทคนิค/
      - button /10 ตั้งค่าองค์กร/
      - button /11 ตั้งค่าเพิ่มเติม/
  `;

// B001's data as the server holds it (the branch HQ worked on in the test copy).
const b001Data = (page: Page) => page.evaluate(async () => {
  const r = await fetch('/api/storage/garage.v22', { cache: 'no-store' });
  const body = await r.text();
  return JSON.parse(body.slice(body.indexOf('\n') + 1));
});

test('S119 ระบบใหม่: สำนักงานใหญ่ (ข้อมูลของ HQ เอง) ปิดโหมดแฟรนไชส์ (เดโม) เห็นข้อมูลสาขาแรก แล้วเปิดใหม่ด้วยรหัสเปิดใช้ จากนั้นต้องเข้าสู่ระบบใหม่', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S98, { app, page, testInfo });
  await app.loginAsOwner();
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  await golden.step('HQ เปิดเมนู 10');
  const before = await app.state() as { DB: { shop: { name: string } } };
  expect(before.DB.shop.name).toBe('ALL EV SERVICE');   // HQ's own data set
  const b001 = await b001Data(page);

  await page.getByRole('button', { name: 'ปิดโหมดแฟรนไชส์ (เดโม)' }).click();
  await golden.step('กดปิดโหมดแฟรนไชส์ ถามยืนยัน');
  await page.getByRole('button', { name: 'ปิดโหมด', exact: true }).click();
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(ALL_MENUS);
  await golden.step('กลับสู่โหมดอู่เดี่ยว เห็นทุกเมนูของสาขา B001');
  await golden.screen('single-shop-mode');
  await app.settle();
  const after = await app.state() as { DB: { shop: { name: string } } };
  expect(after.DB.shop.name).toBe('Drivego Service');    // B001's data, as in the test copy
  expect(formatDiff(stateDiff({ ...before, DB: b001 }, after))).toBe(legacyStateChange(S98, 'deactivate'));

  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const code = page.getByPlaceholder('รหัสเปิดใช้จากใบสั่งซื้อแพ็กเกจ Franchise');
  await expect(code).toBeVisible();
  await golden.step('เมนู 10 แสดงแผงเปิดใช้โหมดแฟรนไชส์');
  await golden.screen('activation-panel');
  const beforeActivate = await app.state();

  await code.fill('PROX-FR-2025');
  await page.getByRole('button', { name: '🔓 เปิดใช้โหมดแฟรนไชส์' }).click();
  await golden.step('ใส่รหัสเปิดใช้ผิด');

  await code.fill('prox-fr-2026');
  await page.getByRole('button', { name: '🔓 เปิดใช้โหมดแฟรนไชส์' }).click();
  await expect(code).toBeHidden();
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(ALL_MENUS);
  await golden.step('เปิดใช้โหมดแฟรนไชส์แล้ว แต่ยังเห็นทุกเมนูโดยไม่มีบัญชีเข้าระบบ');
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await expect(field('วันที่เริ่มใช้ระบบ')).not.toBeEditable();
  await golden.screen('after-activate', { mask: [page.locator('#v-setting button[onclick^="extendLic"]'),
    field('วันที่เริ่มใช้ระบบ'), field('วันที่สิ้นสุดการใช้งาน (Expired Date)')] });
  await golden.stateChange('activate', beforeActivate);

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await golden.step('กดออกจากระบบ ถามยืนยัน');
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await golden.step('ออกจากระบบ กลับมาหน้าเข้าสู่ระบบ');

  await app.login('hq', '1234');
  await expect(page.getByRole('button', { name: '📊 แดชบอร์ดรวมทุกสาขา' })).toBeVisible();
  await golden.step('HQ เข้าสู่ระบบอีกครั้ง');
  golden.done();
});
