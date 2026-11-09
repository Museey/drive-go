import { test, expect } from '../support/test';
import { confirmWithShopName } from '../support/whole-data';
import { storageApi } from '../support/storage-api';

// New behaviour (the owner's decision of 2026-11-09, NOTES.md "ระบบขายแบบใหม่ล็อกเปิดไว้เสมอ"): "ระบบขายแบบใหม่" stays
// on. In the legacy app wiping the data switched it off, and the sample data and the 36-month test data came without it
// (S366, S367, S370, S372, S388, S420–S425), so the old receipt and invoice forms came back. Here: after wiping, the
// switch is on and page 11.5 says so, with no way back; after loading the sample data its documents are adjusted
// as "เปิดใช้" does (page 11.5's own check passes), 04 shows the stock-cut register (no old receipt form),
// and what is stored on the server has the switch on too.
test('S440 ระบบใหม่: ล้างข้อมูลและโหลดข้อมูลตัวอย่างแล้ว ระบบขายแบบใหม่ยังเปิดอยู่ ไม่มีปุ่มย้อนกลับ และไม่มีฟอร์มใบเสร็จแบบเดิม', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const shopName = (await app.state()).DB.shop.name;
  const page115 = async () => {
    await page.getByRole('button', { name: /11 ตั้งค่าเพิ่มเติม/ }).click();
    await page.getByRole('button', { name: /11\.5 ระบบขายแบบใหม่/ }).click();
    await expect(page.getByRole('heading', { name: '11.5 · ระบบขายแบบใหม่' })).toBeVisible();
  };
  const switchedOn = async () => {
    await expect(page.getByText('เปิดใช้ระบบขายแบบใหม่แล้ว', { exact: true })).toBeVisible();
    await expect(page.getByText('ยังไม่เปิดใช้ — โปรแกรมทำงานแบบเดิมทุกอย่าง', { exact: true })).toHaveCount(0);
    for (const name of ['ย้อนกลับไปใช้ระบบเดิม', 'เปิดใช้ระบบขายแบบใหม่'])
      await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
    await expect(page.getByText(/ให้กู้คืนจากไฟล์สำรองที่บันทึกไว้ก่อนเปิดใช้/)).toHaveCount(0);
  };

  // The trial data has it on; the page offers no way back.
  await page115();
  await switchedOn();

  // Wiping: the switch stays on.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await confirmWithShopName(page, shopName, 'ล้างข้อมูล');
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await app.settle();
  expect((await app.state()).DB.pkgSaleFlow).toMatchObject({ on: true });
  await page115();
  await switchedOn();

  // The sample data (old receipts without stock cuts in the legacy app): switched on, its documents adjusted.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'โหลดข้อมูลตัวอย่าง' }).click();
  await confirmWithShopName(page, shopName, 'โหลดข้อมูล');
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible();
  await app.settle();
  const db = (await app.state()).DB;
  expect(db.pkgSaleFlow).toMatchObject({ on: true });
  expect(db.pkgSaleFlow.stale).toBeUndefined();
  await page115();
  await switchedOn();
  await expect(page.getByText('ผ่าน — ใบตัดสต็อกทุกใบมีรายการบัญชี 1 รายการ และสถานะชำระตรงกับเงินที่รับ', { exact: true })).toBeVisible();

  // 04: the stock-cut register, not the old receipt form.
  await page.getByRole('button', { name: /^04 / }).click();
  await expect(page.getByRole('heading', { name: '4.1 ตัดสต็อกสินค้า' })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ สร้างใบเสร็จรับเงิน / ใบแจ้งหนี้' }).filter({ visible: true })).toHaveCount(0);

  // What the server keeps: the switch on (after a reload the app reads it back from there).
  const stored = await storageApi(page).read('garage.v22');
  expect(stored.data.pkgSaleFlow).toMatchObject({ on: true });
  await page.reload();
  await app.settle();
  expect((await app.state()).DB.pkgSaleFlow).toMatchObject({ on: true });
});
