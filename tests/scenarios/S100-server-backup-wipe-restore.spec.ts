import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';
import { formatDiff, stateCounts } from '../support/state-diff.mjs';
import { auditNote, confirmWithShopName } from '../support/whole-data';

// Replaces S74 in the new system (tests/intentional-changes.json, decision Q6):
// the data lives on the server, so the settings page shows the legacy app's
// own wording for that ("ระบบเก็บข้อมูลของแอป") instead of IndexedDB.
// Since task 3.2 (A7, F1) wiping the data keeps the document counters, so the
// next documents never take a number issued before the wipe; wiping and
// restoring ask for the shop's name, keep a copy of the data first (listed
// with the backup points) and are written in the audit log.
// Everything else must still be what the legacy app did in S74: the same
// pages, pop-ups and messages at every step and the same record counts,
// read here from S74's goldens (recorded from the legacy app).
const S74 = new URL('../golden/S74-backup-wipe-restore.spec.ts/', import.meta.url);
const legacyFlow: { step: string }[] = JSON.parse(readFileSync(new URL('flow.json', S74), 'utf8'));
const legacyCounts = (name: string, more: Record<string, unknown>) =>
  formatDiff({ ...JSON.parse(readFileSync(new URL(`${name}-counts.json`, S74), 'utf8')), ...more });

test('S100 ระบบใหม่: สร้างจุดสำรองบน server ล้างข้อมูลทั้งหมด แล้วกู้คืน ข้อมูลกลับมาครบเหมือน S74', async ({ app, page }) => {
  test.slow();
  let i = 0;
  // The same step of S74 must look the same (page, pop-ups, messages).
  const step = async (label: string) => {
    await app.settle();
    const legacy = legacyFlow[i++];
    expect(legacy.step).toBe(label);
    expect({ step: label, ...(await app.signature()) }).toEqual(legacy);
  };
  // Record counts per collection, written the way golden.counts() writes them.
  const counts = async () => { await app.settle(); return formatDiff(stateCounts(await app.state())); };

  await app.loginAsOwner();
  await step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const backups = page.getByLabel('จุดสำรองอัตโนมัติในเครื่อง (เก็บ 5 วันล่าสุด)');
  await backups.scrollIntoViewIfNeeded();
  // Decision Q6: the legacy app's text for its "host" storage mode.
  await expect(page.getByText('ระบบกำลังเก็บข้อมูลไว้ที่ ระบบเก็บข้อมูลของแอป', { exact: false })).toBeVisible();
  await expect(page.getByText('ข้อมูลถูกจัดเก็บโดยแอปที่เปิดโปรแกรมนี้ และสำรองอัตโนมัติให้วันละครั้ง', { exact: false })).toBeVisible();
  await expect(page.getByText('ฐานข้อมูลในเครื่อง (IndexedDB)', { exact: false })).toHaveCount(0);
  await step('เมนู 10 ส่วนที่เก็บข้อมูลและการสำรองข้อมูล');

  const before = await app.state();
  const shopName = before.DB.shop.name;
  await page.getByRole('button', { name: 'สร้างจุดสำรองเดี๋ยวนี้' }).click();
  await expect(backups.getByRole('option')).toHaveText(['13/10/2569']);
  await step('กดสร้างจุดสำรองเดี๋ยวนี้');
  expect(await app.state()).toEqual(before);

  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeVisible();
  await step('กดล้างข้อมูลทั้งหมด ระบบถามยืนยัน');
  await confirmWithShopName(page, shopName, 'ล้างข้อมูล');
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await step('ล้างข้อมูลแล้ว');
  // Task 3.2: the 8 counters stay as they were (S74 had none left) and the audit log has the wipe.
  expect(await counts()).toBe(legacyCounts('after-wipe', { 'DB.audit': 1, 'DB.seq': '{8 keys}' }));
  const wiped = (await app.state()).DB;
  expect(wiped.seq).toEqual(before.DB.seq);
  expect(wiped.audit[0]).toMatchObject({ kind: 'data', act: 'wipe', note: auditNote('ล้างข้อมูลทั้งหมด') });

  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await step('หน้าแรกหลังล้างข้อมูล');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await backups.scrollIntoViewIfNeeded();
  // The copy kept before the wipe comes first; S74 restores the backup point of the day.
  await expect(backups.getByRole('option')).toHaveText(['สำรองก่อนล้างข้อมูล 13/10/2569 09:00', '13/10/2569']);
  await backups.selectOption({ label: '13/10/2569' });
  await expect(backups).toHaveValue(/2026-10-13$/);
  await page.getByRole('button', { name: 'กู้คืนข้อมูลจากจุดสำรองที่เลือก' }).click();
  await expect(page.getByText('กู้คืนข้อมูลจากจุดสำรอง 13/10/2569 ?', { exact: false })).toBeVisible();
  await step('เลือกจุดสำรอง 13/10/2569 แล้วกดกู้คืน ระบบถามยืนยัน');
  await confirmWithShopName(page, shopName, 'กู้คืน');
  await expect(backups.getByRole('option')).toHaveCount(4);
  await step('กู้คืนข้อมูลแล้ว');
  expect(await counts()).toBe(legacyCounts('after-restore', { 'DB.audit': before.DB.audit.length + 1 }));
  await expect(backups.getByRole('option')).toHaveText(
    ['สำรองก่อนล้างข้อมูล 13/10/2569 09:00', 'สำรองก่อนกู้คืน 13/10/2569 09:00', 'before-restore', '13/10/2569']);
  // The restored data is the data from before the wipe (the order of DB's
  // fields follows the wiped data set, as in the legacy app), and the audit log has the restore.
  const restored = (await app.state()).DB;
  expect(restored.audit.at(-1)).toMatchObject({ kind: 'data', act: 'restore', note: auditNote('กู้คืนข้อมูลจากจุดสำรอง 13/10/2569') });
  expect({ ...restored, audit: restored.audit.slice(0, -1) }).toEqual(before.DB);

  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await step('หน้าแรกหลังกู้คืน');
  expect(i).toBe(legacyFlow.length);
});
