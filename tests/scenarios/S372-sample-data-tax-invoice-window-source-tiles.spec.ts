import { test, expect } from '../support/test';

// After "ล้างข้อมูลทั้งหมด" + "โหลดข้อมูลตัวอย่าง" ("ระบบขายแบบใหม่" off) "+ ออกใบกำกับภาษีใหม่" opens the tax-invoice
// window empty, with both kinds of source document: "งานซ่อม" (receipts / invoices) and "ขายอะไหล่" (stock cuts). No
// scenario switched between them (docs/BEHAVIORS.md).
test('S372 ข้อมูลตัวอย่าง: หน้าต่างออกใบกำกับภาษี สลับแหล่งเอกสารงานซ่อม / ขายอะไหล่', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'โหลดข้อมูลตัวอย่าง' }).click();
  await expect(page.getByRole('button', { name: /^00 Mr\.DriveGo/ })).toBeVisible();
  await app.settle();
  await golden.step('ล้างข้อมูลแล้วโหลดข้อมูลตัวอย่าง');

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.3 ใบกำกับภาษี' }).click();
  await page.getByRole('button', { name: '+ ออกใบกำกับภาษีใหม่' }).click();
  await golden.step('หน้าต่างออกใบกำกับภาษี (ยังไม่เลือกลูกค้า)');
  const cust = page.getByPlaceholder(/^พิมพ์ชื่อ \/ บริษัท \/ เบอร์โทร \/ ทะเบียนร/).filter({ visible: true });
  await cust.fill('สมชาย');
  await cust.press('Enter');
  const docs = page.getByRole('row').filter({ hasText: 'RE.69-10-01-28' }).filter({ visible: true });
  await expect(docs).toBeVisible();
  await golden.step('เลือกลูกค้าสมชาย ใจดี เห็นใบเสร็จงานซ่อม 3 ใบที่รอออกใบกำกับภาษี');

  await page.getByText('ขายอะไหล่', { exact: true }).filter({ visible: true }).click();
  await expect(docs).toBeHidden();
  await golden.step('กดขายอะไหล่ ไม่มีเอกสารขายอะไหล่ที่รอออก');
  await page.getByText('งานซ่อม', { exact: true }).filter({ visible: true }).click();
  await expect(docs).toBeVisible();
  await golden.step('กดงานซ่อม กลับมาเห็นใบเสร็จ 3 ใบ');
  await golden.screen('tax-window-sources');
});
