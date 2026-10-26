import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';
import { legacySteps, sameScreen } from '../support/legacy-golden';

test.use({ dataset: 'franchise-trial' });

// Replaces S120 in the new system (tests/intentional-changes.json, task 3.15, decisions 15.1 and 15.7): a chain
// has one licence, DriveGo's, on the server: HQ and every branch show its last day (the fixture's, 10/02/2570),
// HQ cannot renew in menu 10 (no "ต่ออายุ +1 ปี", the dates read-only) and a save sending other dates — through
// the screens or the API — is kept with the licence's. Staff renew (tools/shop-admin.mjs, S236). The renewal step
// of S120 cannot happen; HQ's menu 10 step, the branch head's sign-in and their home screen (without the licence
// line, which S120 shows renewed) are still S120's.
const S120 = 'S120-hq-extends-licence-branch-sees-it.spec.ts';

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

// A save of one record straight to the API with the versions the server gave, as the browser makes it.
async function saveWithVersions(page: Page, storeKey: string, unit: string, change: (v: any) => any) {
  return page.evaluate(async ([storeKey, unit, change]) => {
    const url = `/api/storage/${encodeURIComponent(storeKey)}`;
    const text = await (await fetch(url, { cache: 'no-store' })).text();
    const versions = JSON.parse(text.slice(0, text.indexOf('\n'))), data = JSON.parse(text.slice(text.indexOf('\n') + 1));
    const field = unit.split('.')[1];
    const value = new Function('v', `return (${change})(v)`)(data[field]);
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      base: { [`${unit}|`]: versions[`${unit}|`] }, changes: { upsert: [{ unit, key: '', data: JSON.stringify(value) }], remove: [], order: {} } }) });
    const after = await (await fetch(url, { cache: 'no-store' })).text();
    return { status: r.status, stored: JSON.parse(after.slice(after.indexOf('\n') + 1))[field] };
  }, [storeKey, unit, change.toString()] as const);
}

test('S231 ระบบใหม่: สำนักงานใหญ่ต่ออายุเองไม่ได้ วันหมดอายุของเครือเป็นวันเดียวกันทั้ง HQ และสาขา B001', async ({ app, page }, testInfo) => {
  const steps = legacySteps(S120, app);
  const licence = page.getByText(/^Expired Date/).filter({ visible: true });
  await app.loginAsOwner();
  await expect(licence).toHaveText('Expired Date 10/02/2570 · เหลืออายุการใช้งาน 120 วัน');
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const start = page.getByLabel('วันที่เริ่มใช้ระบบ', { exact: true }).filter({ visible: true });
  const end = page.getByLabel('วันที่สิ้นสุดการใช้งาน (Expired Date)', { exact: true }).filter({ visible: true });
  await end.scrollIntoViewIfNeeded();
  await expect(start).toHaveValue('2025-12-01');
  await expect(end).toHaveValue('2027-02-10');
  await expect(start).not.toBeEditable();
  await expect(end).not.toBeEditable();
  await expect(page.getByLabel('อายุการใช้งานคงเหลือ', { exact: true }).filter({ visible: true })).toHaveValue('120 วัน');
  await expect(page.getByRole('button', { name: 'ต่ออายุ +1 ปี' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '+2 ปี' })).toHaveCount(0);
  await steps.same('HQ เปิดเมนู 10 ส่วนวันหมดอายุการใช้งาน');
  steps.skip('HQ ต่ออายุการใช้งาน 1 ปี');   // no such button

  await signOut(page);
  await app.login('b001', '1234');
  await expect(licence).toHaveText('Expired Date 10/02/2570 · เหลืออายุการใช้งาน 120 วัน');
  await steps.same('หัวหน้าสาขา B001 เข้าสู่ระบบ เห็นวันหมดอายุใหม่');
  await sameScreen(page, app, testInfo, S120, 'b001-home-extended', { mask: [licence] });
  steps.done();

  // The branch head saving the settings keeps the licence's dates, and so does a save of other dates straight
  // to the API (the branch's data, and HQ's for HQ, below).
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await app.settle();
  await expect(licence).toHaveText('Expired Date 10/02/2570 · เหลืออายุการใช้งาน 120 วัน');
  const branch = await saveWithVersions(page, 'garage.v22', 'DB.shop', (v: any) => ({ ...v, licEnd: '2030-12-31' }));
  expect(branch).toMatchObject({ status: 200, stored: { licStart: '2025-12-01', licEnd: '2027-02-10' } });
  await signOut(page);
  await app.loginAsOwner();
  const hq = await saveWithVersions(page, 'garage.v22::HQ', 'DB.shop', (v: any) => ({ ...v, licStart: '2026-10-13', licEnd: '2030-12-31' }));
  expect(hq).toMatchObject({ status: 200, stored: { licStart: '2025-12-01', licEnd: '2027-02-10' } });
});
