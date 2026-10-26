import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S47 in the new system (tests/intentional-changes.json, task 3.9, decision R14-ข and the owner's
// answers of 2026-10-26): the mechanic (EMP003) signs in as in S47, with the same steps and screens, but the
// server does not send the other employees' pay and personal data — they read null in the mechanic's browser;
// their own record stays whole.
const S47 = 'S47-mechanic-account-price-visibility.spec.ts';
const PRIVATE = ['idcard', 'birth', 'age', 'edu', 'hospital', 'salary', 'ot', 'bonus', 'regular', 'emg', 'addr'];

test('S177 ระบบใหม่: ช่างซ่อมเข้าระบบ เห็นทะเบียนอะไหล่และใบเสนอราคาเหมือนเดิม แต่ไม่ได้รับเงินเดือนและข้อมูลส่วนตัวของพนักงานคนอื่น', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S47, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const mechanicRow = page.getByRole('row').filter({ hasText: 'EMP003' });
  await mechanicRow.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await golden.step('ตั้งรหัสผ่านให้ช่างซ่อม EMP003');

  const before = await app.state() as any;
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('3333');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(mechanicRow.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await golden.step('ออกบัญชีให้ช่างซ่อมแล้ว');

  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-444-5566', '3333');
  await golden.step('ช่างซ่อมเข้าสู่ระบบ');

  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  const costSummary = page.getByText('มูลค่าทุนคงเหลือ (บาท)', { exact: true }).filter({ visible: true });
  await expect(costSummary).toBeVisible();
  await costSummary.scrollIntoViewIfNeeded();
  await golden.step('ช่างซ่อมเปิดทะเบียนอะไหล่');
  await golden.screen('mechanic-stock');

  await page.getByRole('button', { name: /03 ใบเสนอราคา/ }).click();
  await expect(page.getByText('43,452.70', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('ช่างซ่อมเปิดใบเสนอราคา');
  await golden.screen('mechanic-quotes');

  const hidden: Record<string, unknown> = {};
  for (const e of before.DB.emp) if (e.code !== 'EMP003')
    for (const f of PRIVATE) if (f in e && e[f] !== null) hidden[`DB.emp[${e.code}].${f}`] = [e[f], null];
  expect(Object.keys(hidden)).toHaveLength(10 * 9);
  await golden.stateChange('mechanic-account', before, hidden);
  expect(((await app.state()) as any).DB.emp.find((e: any) => e.code === 'EMP003')).toMatchObject({ salary: 12000, idcard: before.DB.emp.find((e: any) => e.code === 'EMP003').idcard });
});
