import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';

// New behaviour (task 3.15, decision 15.3): the shop's licence ended on 01/10/2569 (12 days before the tests' day).
// The legacy app only warned; now the shop is read-only. The owner signs in, sees the legacy expiry line and banner
// and the owner panel's tag "หมดอายุการใช้งานแล้ว", opens every menu and sub-menu, opens and prints a quotation,
// exports a list to Excel and the whole shop's backup file: nothing is refused, and the server keeps nothing new
// but the audit log's entries of opening, printing and exporting (and settings the screens add with their
// starting value when first opened). Saving the settings is refused with the new
// message, the page reloads, and the shop's data is as it was.
test.use({ licence: { kind: 'paid', start: '2025-10-01', end: '2026-10-01' } });

const EXPIRED = 'บันทึกไม่สำเร็จ — โปรแกรมหมดอายุการใช้งานแล้ว ยังเปิดดู พิมพ์ และส่งออกข้อมูลได้ แต่สร้างหรือแก้ไขข้อมูลไม่ได้จนกว่าจะต่ออายุ (โทร. 082-1087000) กดตกลงเพื่อโหลดข้อมูลล่าสุด';
// The shop's data but the audit log, as it was before: viewing may only add the fields the app keeps with their
// starting values (an empty list, the quotation form's preset lists), never change one that is there.
const withoutAudit = (db: any, like: any = db) => Object.fromEntries(Object.keys(like).filter(k => k !== 'audit').map(k => [k, db[k]]));
const problems = (page: Page) => page.evaluate(() => (window as any).storage.problems.slice());

test('S233 ระบบใหม่: ร้านหมดอายุแล้ว เจ้าของเข้าระบบ เปิดทุกเมนู เปิดและพิมพ์เอกสาร ส่งออกได้ แต่บันทึกการตั้งค่าไม่ได้ ขึ้นข้อความแล้วโหลดใหม่', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await expect(page.getByText(/^⚠ ?Expired Date/).filter({ visible: true })).toHaveText('⚠ Expired Date 01/10/2569 · หมดอายุการใช้งานแล้ว 12 วัน');
  await expect(page.getByText('⚠ โปรแกรมหมดอายุการใช้งานแล้วเมื่อวันที่ 01/10/2569', { exact: true })).toBeVisible();
  const before = await app.serverDB();

  // Every menu and sub-menu of the side bar, in order.
  // (Each menu comes before its sub-menus, so they are open by the time they are reached.)
  const nav = page.getByRole('navigation').locator('button');
  const seen: string[] = [];
  for (let i = 0, n = await nav.count(); i < n; i++) {
    const item = nav.nth(i);
    if (!await item.isVisible()) continue;
    const name = (await item.innerText()).replace(/\s+/g, ' ').trim();
    if (/พับเมนู|ออกจากระบบ/.test(name)) continue;
    await item.click();
    await app.settle();
    seen.push(name);
  }
  expect(seen.length).toBeGreaterThan(50);
  expect(seen.join('\n')).toContain('11.5 ระบบขายแบบใหม่');

  // Menu 10: the licence and the tag.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(page.getByText('หมดอายุการใช้งานแล้ว', { exact: true })).toBeVisible();
  await expect(page.getByLabel('อายุการใช้งานคงเหลือ', { exact: true }).filter({ visible: true })).toHaveValue('หมดอายุแล้ว 12 วัน');

  // Open a quotation and print it; export the list.
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByText('MA-QT261000002', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'พิมพ์ใบเสนอราคา (ต้นฉบับ + สำเนา)' }).click();
  await page.emulateMedia({ media: 'print' });
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  let downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Excel', exact: true }).filter({ visible: true }).first().click();
  expect(await (await downloading).path()).toBeTruthy();

  // The owner's backup file of the whole shop (15.8).
  await page.getByRole('button', { name: /11 ตั้งค่าเพิ่มเติม/ }).click();
  await page.getByRole('button', { name: /11\.3 นำเข้า \/ ส่งออกข้อมูล/ }).click();
  downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: /ส่งออกไฟล์สำรองทั้งระบบ/ }).click();
  expect((await downloading).suggestedFilename()).toBe('garage-backup-2026-10-13.json');

  await app.settle();
  expect(await problems(page)).toEqual([]);
  await expect(page.getByText(EXPIRED)).toHaveCount(0);
  const viewed = await app.serverDB();
  expect(withoutAudit(viewed, before)).toEqual(withoutAudit(before));
  const added = viewed.audit.slice(before.audit.length);
  expect(added.map((a: any) => `${a.kind} ${a.no} ${a.act}`)).toEqual(expect.arrayContaining(['quote MA-QT261000002 open', 'quote MA-QT261000002 print']));
  for (const a of added) expect(['open', 'print', 'export']).toContain(a.act);

  // A change: refused, said, reloaded; nothing kept.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByLabel('เว็บไซต์ / เพจ (ถ้ามี)', { exact: true }).filter({ visible: true }).fill('facebook.com/drivegoservice');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await expect(page.getByText(EXPIRED, { exact: true })).toBeVisible();
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await reloaded;
  await expect(page.getByText(/^⚠ ?Expired Date/).filter({ visible: true })).toHaveText('⚠ Expired Date 01/10/2569 · หมดอายุการใช้งานแล้ว 12 วัน');
  expect(withoutAudit(await app.serverDB(), before)).toEqual(withoutAudit(before));
});
