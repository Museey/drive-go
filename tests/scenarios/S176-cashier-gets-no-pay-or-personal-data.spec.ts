import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { maskState, masksOfSession } from '../support/masks';
import { storageApi } from '../support/storage-api';

// Replaces S41 in the new system (tests/intentional-changes.json, task 3.9, decision R14-ข and the owner's
// answers of 2026-10-26): the cashier (EMP008, without "ดูสรุปการเงิน ภาษี และเงินเดือน" or "ดูและแก้ไขข้อมูลพนักงาน")
// signs in as in S41 — the same steps, screens and menus — but the server no longer sends the other employees'
// pay and personal data (national id, birth date, age, education, social security hospital, salary, overtime,
// bonus, emergency contact): they read null in the browser. The cashier's own record stays whole. Nor any cost
// (F7), and the home page's card of sales waiting for payment shows no amount (finding 42). The shop's backup
// points cannot be read, and the whole-shop backup file is the owner's.
const S41 = 'S41-cashier-account-limited-menus.spec.ts';
const PRIVATE = ['idcard', 'birth', 'age', 'edu', 'hospital', 'salary', 'ot', 'bonus', 'regular', 'emg', 'addr'];

test('S176 ระบบใหม่: แคชเชียร์เข้าระบบ เห็นเมนูตามสิทธิ์เหมือนเดิม แต่ไม่ได้รับเงินเดือนและข้อมูลส่วนตัวของพนักงานคนอื่น อ่านจุดสำรองไม่ได้', async ({ app, page }, testInfo) => {
  // A new password has at least 8 characters (security review proposal 2, the owner's decision of 2026-10-31): the
  // account gets a longer one than the legacy scenario's, and the message that tells it is swapped.
  const golden = legacyGolden(S41, { app, page, testInfo }, { numbers: [['รหัสผ่าน 8888', 'รหัสผ่าน 88888888']] });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const cashierRow = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashierRow.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await golden.step('ตั้งรหัสผ่านให้แคชเชียร์ EMP008');

  const before = await app.state() as any;
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('88888888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashierRow.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await golden.step('ออกบัญชีให้แคชเชียร์แล้ว');

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await golden.step('ออกจากระบบ กลับมาหน้าเข้าสู่ระบบ');

  await app.login('092-333-4455', '88888888');
  await golden.step('แคชเชียร์เข้าสู่ระบบ');
  // Finding 42 (approved): the cashier has no "ดูยอดเงินและมูลค่าในหน้าแรก", so the card of sales waiting for payment
  // keeps its count and drops the amount (legacy: "รวม ฿36,462.45 · …").
  const waiting = page.locator('#pkgSfHome');
  await expect(waiting).toContainText('ค้างข้ามวัน');
  await expect(waiting).not.toContainText('฿');
  await golden.screen('cashier-home', { mask: [waiting] });
  await page.getByRole('button', { name: 'ดูฐานลูกค้า & รถ' }).click();
  await golden.step('แคชเชียร์กดดูฐานลูกค้า ถูกปฏิเสธ');
  await page.getByRole('button', { name: /04 ใบเสร็จรับเงิน/ }).click();
  await golden.step('แคชเชียร์เปิดเมนู 04 ได้');
  await expect(page.getByRole('heading', { name: '4.1 ตัดสต็อกสินค้า' })).toBeVisible();
  await golden.screen('cashier-receipts');

  // S41's data change, and every other employee's pay and personal data now blank in the cashier's browser.
  // The legacy change, from the owner's data as the server now gives it to this person (masks it sends with the data).
  const masks = await masksOfSession(page);
  await golden.stateChange('cashier-account', maskState(before, masks));
  const now = (await app.state()) as any;
  for (const e of now.DB.emp) if (e.code !== 'EMP008') for (const f of PRIVATE) if (f in e) expect(e[f], `${e.code}.${f}`).toBeNull();
  expect(now.DB.stock.every((s: any) => s.cost === null) && now.DB.fifo.lots.every((l: any) => l.cost === null), 'no cost either').toBe(true);
  const mine = ((await app.state()) as any).DB.emp.find((e: any) => e.code === 'EMP008');
  expect(mine).toMatchObject({ idcard: before.DB.emp.find((e: any) => e.code === 'EMP008').idcard, salary: 14000 });
  expect(JSON.parse(legacyStateChange(S41, 'cashier-account'))).not.toHaveProperty('DB.emp[EMP001].salary');

  // The server's answer itself carries none of it, and says what it left out.
  const api = storageApi(page);
  const raw = await page.evaluate(async () => {
    const r = await fetch('/api/storage/garage.v22', { cache: 'no-store' });
    return { text: await r.text(), masks: JSON.parse(decodeURIComponent(r.headers.get('x-drivego-masks') || 'null')) };
  });
  for (const e of before.DB.emp) if (e.code !== 'EMP008') expect(raw.text).not.toContain(e.idcard);
  expect(raw.masks).toEqual(expect.arrayContaining([{ unit: 'DB.emp', paths: PRIVATE, except: [mine.id] }, { unit: 'DB.payroll', paths: ['lines'] },
    { unit: 'DB.stock', paths: ['cost'] }, { unit: 'DGB.shop', paths: ['idcard'] }]));
  // Backup points: listed, not readable.
  const keys: string[] = await page.evaluate(async () => (await (await fetch('/api/storage', { cache: 'no-store' })).json()).keys);
  const backup = keys.find(k => k.startsWith('garage.v22.bak.'));
  expect(backup).toBeTruthy();
  expect(await api.read(backup!)).toEqual({ status: 403, data: null });

  // The owner still has everything.
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.loginAsOwner();
  await app.settle();
  const owner = (await app.state()) as any;
  expect(owner.DB.emp.find((e: any) => e.code === 'EMP001')).toMatchObject({ salary: 25000, idcard: '3100500123456' });
  expect((await storageApi(page).read(backup!)).status).toBe(200);
});
