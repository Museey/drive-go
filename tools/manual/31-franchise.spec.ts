import type { Page } from '@playwright/test';
import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

test.use({ dataset: 'franchise-trial' });

// The Franchise manual (tools/manual/content-franchise.mjs): head office (HQ) and a branch. The requisition flow is the
// one of S114: the branch asks, HQ approves and ships from its central stock, the branch confirms the goods.
async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

test('31 DriveGo Franchise', async ({ app, page }) => {
  test.slow();
  await app.open();
  const at = new URL(page.url());
  await page.goto(`${at.origin}/login`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);   // the page's own entrance animation
  const card = page.getByRole('region', { name: 'DriveGo-Franchise', exact: true });
  await card.getByRole('button', { name: 'เข้าสู่ระบบ Franchise', exact: true }).click();
  await page.getByLabel('รหัสร้าน', { exact: true }).fill('somchai-group');
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill('hq');
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill('Somchai#2569');
  await card.evaluate(e => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await shot(page, '31-signin', { scroll: false, area: [card], pad: 16, mark: [[page.getByLabel('รหัสร้าน', { exact: true }), '2'], [page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร'), '3'],
    [card.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }), '3']] });

  // Head office.
  await app.open();
  await app.login('hq', '1234');
  await app.settle();
  const dash = page.getByRole('button', { name: /แดชบอร์ดรวมทุกสาขา/ });
  await dash.click();
  await app.settle();
  await shot(page, '31-dashboard', { scroll: false, mark: [[page.getByText('ยอดขายรวมทุกสาขา', { exact: false }).filter({ visible: true }).first(), '1'],
    [page.getByRole('button', { name: /รีเฟรช/ }).filter({ visible: true }).first(), '2'],
    [page.getByRole('button', { name: 'เข้าดูสาขา' }).filter({ visible: true }).first(), '3']] });

  await page.getByRole('button', { name: /สาขา · รหัสผู้ใช้ · สิทธิ/ }).click();
  await app.settle();
  await shot(page, '31-branches', { scroll: false, mark: [[page.getByRole('button', { name: /เพิ่มสาขาใหม่/ }), '1'],
    [page.getByRole('button', { name: 'รีเซ็ตรหัสผ่าน' }).filter({ visible: true }).first(), '2'],
    [page.getByRole('button', { name: /ระงับสาขา/ }).filter({ visible: true }).first(), '3']] });
  const rights = page.getByText(/สิทธิการใช้งานเมนูของสาขา/).filter({ visible: true }).first();
  await rights.scrollIntoViewIfNeeded();
  await shot(page, '31-rights', { mark: [[rights, '4']] });

  await page.getByRole('button', { name: '🏭 คลังกลาง HQ (Min-Max)' }).click();
  const imp = page.getByRole('button', { name: '⇪ นำเข้ารายการจากทะเบียนสาขาที่เปิดอยู่' });
  await imp.click();
  await app.settle();
  for (const [code, cost] of [['EN-501', '100'], ['OI-801', '1000']]) {
    const box = page.getByRole('spinbutton', { name: `ทุนต่อหน่วย ${code}` });
    await box.fill(cost); await box.press('Tab');
  }
  await shot(page, '31-central', { scroll: false, mark: [[imp, '1'], [page.getByRole('button', { name: '+ เพิ่มสินค้า' }), '2'],
    [page.getByRole('spinbutton').filter({ visible: true }).first(), '3']] });
  await signOut(page);

  // A branch asks head office for goods.
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  const tab = page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' });
  await tab.click();
  await app.settle();
  const add = page.getByRole('button', { name: '+ เพิ่มบรรทัดเอง' });
  await add.click();
  await add.click();
  const lines = page.getByRole('table').filter({ hasText: 'จำนวนขอเบิก' }).getByRole('row');
  const fillLine = async (n: number, code: string, qty: string) => {
    const c = lines.nth(n).getByRole('combobox');
    await c.fill(code); await c.press('Tab');
    const q = lines.nth(n).getByRole('spinbutton');
    await q.fill(qty); await q.press('Tab');
  };
  await fillLine(1, 'EN-501', '20');
  await fillLine(2, 'OI-801', '10');
  await page.getByLabel('หมายเหตุถึง HQ (ถ้ามี)').fill('ขอภายในสัปดาห์นี้');
  const send = page.getByRole('button', { name: '📨 ส่งใบขอเบิกไป HQ' });
  await shot(page, '31-request', { scroll: false, mark: [[tab, '1'], [page.getByRole('button', { name: /เติมรายการอัตโนมัติจากเกณฑ์ Min-Max/ }), '2'],
    [add, '3'], [send, '4']] });
  await send.click();
  const myReq = page.getByRole('row').filter({ hasText: 'REQ-' }).first();
  await expect(myReq).toContainText('รอ HQ อนุมัติ');
  await signOut(page);

  // Head office approves and ships.
  await app.login('hq', '1234');
  await page.getByRole('button', { name: /📦 ใบขอเบิกจากสาขา/ }).click();
  await app.settle();
  const hqReq = page.getByRole('row').filter({ hasText: 'REQ-' }).first();
  await shot(page, '31-requests', { scroll: false, mark: [[hqReq.getByRole('button', { name: 'ตรวจ / อนุมัติ' }), '1']] });
  await hqReq.getByRole('button', { name: 'ตรวจ / อนุมัติ' }).click();
  await page.waitForTimeout(400);
  const approve = page.getByRole('button', { name: '✔ อนุมัติและจัดส่ง (ตัดคลัง HQ)' });
  await shot(page, '31-approve', { scroll: false, mark: [[page.getByRole('row').filter({ hasText: 'EN-501' }).filter({ visible: true }).getByRole('spinbutton'), '2'], [approve, '3']] });
  await approve.click();
  await app.settle();
  await expect(hqReq).toContainText('HQ จัดส่งแล้ว — รอสาขายืนยันรับ');
  await signOut(page);

  // The branch confirms the goods.
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
  await app.settle();
  const receive = myReq.getByRole('button', { name: '✔ ยืนยันรับของเข้าสต๊อก' });
  await shot(page, '31-receive', { mark: [[receive, '1']] });
  await receive.click();
  await page.getByRole('button', { name: 'รับของเข้าสต๊อก', exact: true }).click();
  await expect(myReq).toContainText('รับของเข้าสต๊อกแล้ว');
});
