import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { maskState, masksOfSession } from '../support/masks';

// Replaces S47 in the new system (tests/intentional-changes.json, task 3.9, decision R14-ข and the owner's
// answers of 2026-10-26): the mechanic (EMP003) signs in as in S47, with the same steps and screens, but the
// server does not send the other employees' pay and personal data — they read null in the mechanic's browser;
// their own record stays whole — nor any cost (F7, finding 13: the stock register's search summary no longer
// shows the cost value). Quotation totals stay visible (R14-ก = ข).
const S47 = 'S47-mechanic-account-price-visibility.spec.ts';
const PRIVATE = ['idcard', 'birth', 'age', 'edu', 'hospital', 'salary', 'ot', 'bonus', 'regular', 'emg', 'addr'];

test('S177 ระบบใหม่: ช่างซ่อมเข้าระบบ เห็นทะเบียนอะไหล่และใบเสนอราคา แต่ไม่ได้รับทุน เงินเดือน และข้อมูลส่วนตัวของพนักงานคนอื่น ไม่เห็นมูลค่าทุนรวม', async ({ app, page }, testInfo) => {
  // A new password has at least 8 characters (security review proposal 2, the owner's decision of 2026-10-31): the
  // account gets a longer one than the legacy scenario's, and the message that tells it is swapped.
  const golden = legacyGolden(S47, { app, page, testInfo }, { numbers: [['รหัสผ่าน 3333', 'รหัสผ่าน 33333333']] });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const mechanicRow = page.getByRole('row').filter({ hasText: 'EMP003' });
  await mechanicRow.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await golden.step('ตั้งรหัสผ่านให้ช่างซ่อม EMP003');

  const before = await app.state() as any;
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('33333333');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(mechanicRow.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await golden.step('ออกบัญชีให้ช่างซ่อมแล้ว');

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-444-5566', '33333333');
  await golden.step('ช่างซ่อมเข้าสู่ระบบ');

  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  // Finding 13 (approved): the search summary no longer shows the cost value (legacy: 566,870.00); the rest is S47's screen.
  await expect(page.getByText('มูลค่าทุนคงเหลือ (บาท)', { exact: true }).filter({ visible: true })).toHaveCount(0);
  const strip = page.getByText('คงเหลือรวม (ชิ้น)', { exact: true }).filter({ visible: true });
  await strip.scrollIntoViewIfNeeded();
  await golden.step('ช่างซ่อมเปิดทะเบียนอะไหล่');
  // (the strip is narrower without the cost value: mask the whole width it is in)
  await golden.screen('mechanic-stock', { mask: [strip.locator('xpath=ancestor::div[contains(@class,"pkg-rh-sum")][1]/..')] });

  await page.getByRole('button', { name: /03 ใบเสนอราคา/ }).click();
  await expect(page.getByText('43,452.70', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('ช่างซ่อมเปิดใบเสนอราคา');
  await golden.screen('mechanic-quotes');

  // The legacy change, from the owner's data as the server now gives it to this person (masks it sends with the data).
  const masks = await masksOfSession(page);
  await golden.stateChange('mechanic-account', maskState(before, masks));
  const now = (await app.state()) as any;
  for (const e of now.DB.emp) if (e.code !== 'EMP003') for (const f of PRIVATE) if (f in e) expect(e[f], `${e.code}.${f}`).toBeNull();
  expect(now.DB.stock.every((s: any) => s.cost === null) && now.DB.fifo.lots.every((l: any) => l.cost === null), 'no cost either').toBe(true);
  expect(((await app.state()) as any).DB.emp.find((e: any) => e.code === 'EMP003')).toMatchObject({ salary: 12000, idcard: before.DB.emp.find((e: any) => e.code === 'EMP003').idcard });
});
