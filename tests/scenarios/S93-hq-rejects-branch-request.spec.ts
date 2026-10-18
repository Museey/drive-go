import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';

test.use({ dataset: 'franchise-trial' });

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

async function openHqRequests(page: Page) {
  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  // The submenu slides open; a click while it moves may land on its neighbour
  // first and scroll the menu (timing, not behaviour), so wait until it stops.
  await page.waitForFunction(() => document.getAnimations()
    .every(a => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity));
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
}

test('S93 สาขาเติมใบขอเบิกจากเกณฑ์ Min-Max ส่งไป HQ, HQ ปฏิเสธพร้อมเหตุผล, สาขาอื่นไม่เห็นใบนี้ และสาขาเจ้าของเห็นเหตุผล', async ({ app, page, golden }) => {
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
  await golden.screen('hq-request-detail');
  const beforeReject = await app.state();

  await page.getByRole('button', { name: '✕ ปฏิเสธคำขอ' }).click();
  await golden.step('กดปฏิเสธคำขอ ช่องกรอกเหตุผลเปิดอยู่ใต้หน้าต่างใบขอเบิก');
  await golden.screen('reject-prompt-hidden');

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
  await golden.screen('b002-requests');

  await signOut(page);
  await app.login('b001', '1234');
  await openHqRequests(page);
  await expect(myReq).toContainText('HQ ปฏิเสธคำขอ');
  await expect(myReq.getByRole('button', { name: '✔ ยืนยันรับของเข้าสต๊อก' })).toHaveCount(0);
  await myReq.getByRole('button', { name: 'รายละเอียด' }).click();
  await expect(page.getByText('เหตุผลจาก HQ: คลังกลางยังไม่มีสินค้า รอรอบสั่งซื้อเดือนหน้า', { exact: false })).toBeVisible();
  await golden.step('สาขา B001 เปิดดูเหตุผลที่ HQ ปฏิเสธ');
  await golden.screen('b001-rejected-detail');
});
