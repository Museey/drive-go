import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { hqOwnData } from '../support/hq-own-data';
import type { Page } from '@playwright/test';
import { FIXTURE_LINE, licenceLine } from '../support/licence';

test.use({ dataset: 'franchise-trial' });

// Replaces S93 in the new system (tests/intentional-changes.json, decision Q3):
// HQ works on its own data set, so HQ's screens show the chain's name, its own
// licence line and its own badges (tests/support/hq-own-data.ts). Every step,
// data change, branch screen and the rest of every HQ screen are still S93's.
const S93 = 'S93-hq-rejects-branch-request.spec.ts';

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

async function openHqRequests(page: Page) {
  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
}

test('S115 ระบบใหม่: สาขาเติมใบขอเบิกจากเกณฑ์ Min-Max ส่งไป HQ (ข้อมูลของ HQ เอง) HQ ปฏิเสธพร้อมเหตุผล สาขาอื่นไม่เห็นใบนี้ และสาขาเจ้าของเห็นเหตุผล', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S93, { app, page, testInfo });
  await app.open();
  await app.login('b001', '1234');
  await openHqRequests(page);
  await golden.step('หัวหน้าสาขา B001 เปิดแท็บเบิกสินค้าจาก HQ');
  const before = await app.state();

  await page.getByRole('button', { name: '⚡ เติมรายการอัตโนมัติจากเกณฑ์ Min-Max' }).click();
  await expect(page.getByText('26 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('เติมรายการจากเกณฑ์ Min-Max');
  await golden.screen('min-max-draft');

  await page.getByRole('button', { name: '📨 ส่งใบขอเบิกไป HQ' }).click();
  const myReq = page.getByRole('row').filter({ hasText: 'REQ-6910-0001' });
  await expect(myReq).toContainText('รอ HQ อนุมัติ');
  await golden.step('ส่งใบขอเบิก 26 รายการไป HQ');
  await golden.stateChange('submit', before);

  await signOut(page);
  await app.login('hq', '1234');
  await page.getByRole('button', { name: /📦 ใบขอเบิกจากสาขา/ }).click();
  await page.getByRole('row').filter({ hasText: 'REQ-6910-0001' }).getByRole('button', { name: 'ตรวจ / อนุมัติ' }).click();
  await expect(page.getByText('ใบขอเบิก REQ-6910-0001 — B001 · สาขาหลัก รังสิต')).toBeVisible();
  await expect(page.getByText('— ไม่มีในคลัง').first()).toBeVisible();
  await golden.step('HQ เปิดใบขอเบิก คลัง HQ ยังไม่มีสินค้า');
  await golden.screen('hq-request-detail', { mask: await hqOwnData(page) });
  const beforeReject = await app.state();

  await page.getByRole('button', { name: '✕ ปฏิเสธคำขอ' }).click();
  await golden.step('กดปฏิเสธคำขอ ช่องกรอกเหตุผลเปิดอยู่ใต้หน้าต่างใบขอเบิก');
  await golden.screen('reject-prompt-hidden', { mask: await hqOwnData(page) });

  // Legacy behaviour reported to the owner: the reason box opens behind the request window.
  await page.getByRole('button', { name: '✕ ปิด' }).click();
  const reason = page.getByRole('textbox').filter({ visible: true });
  await reason.click();
  await reason.fill('คลังกลางยังไม่มีสินค้า รอรอบสั่งซื้อเดือนหน้า');
  await golden.step('ปิดหน้าต่างใบขอเบิก กรอกเหตุผลที่ปฏิเสธ');
  await page.getByRole('button', { name: 'ปฏิเสธคำขอ', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'REQ-6910-0001' })).toContainText('HQ ปฏิเสธคำขอ');
  await golden.step('HQ ปฏิเสธคำขอแล้ว');
  await golden.stateChange('reject', beforeReject);

  await signOut(page);
  await app.login('b002', '1234');
  await openHqRequests(page);
  await expect(page.getByText('ยังไม่มีใบขอเบิก', { exact: false }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'REQ-6910-0001' })).toHaveCount(0);
  await golden.step('สาขา B002 ไม่เห็นใบขอเบิกของ B001');
  // Task 3.15: the licence shown is the server's (tests/support/licence.ts), checked by its text and left out of the picture.
  await expect(licenceLine(page)).toHaveText(FIXTURE_LINE);   // one date for the chain (15.7); the legacy new branch had a year from today
  await golden.screen('b002-requests', { mask: [licenceLine(page)] });

  await signOut(page);
  await app.login('b001', '1234');
  await openHqRequests(page);
  await expect(myReq).toContainText('HQ ปฏิเสธคำขอ');
  await expect(myReq.getByRole('button', { name: '✔ ยืนยันรับของเข้าสต๊อก' })).toHaveCount(0);
  await myReq.getByRole('button', { name: 'รายละเอียด' }).click();
  await expect(page.getByText('เหตุผลจาก HQ: คลังกลางยังไม่มีสินค้า รอรอบสั่งซื้อเดือนหน้า', { exact: false })).toBeVisible();
  await golden.step('สาขา B001 เปิดดูเหตุผลที่ HQ ปฏิเสธ');
  await golden.screen('b001-rejected-detail');
  golden.done();
});
