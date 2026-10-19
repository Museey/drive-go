import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';

test.use({ dataset: 'franchise-trial' });

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

// The chain's licence is the first branch's: HQ sees B001's dates and an
// extension made by HQ in menu 10 is B001's too (in the test copy HQ worked on
// B001's data; in the new system HQ has its own data and keeps the licence in
// step with B001, owner's decision 2026-10-19). No screenshot of HQ's screens:
// they show HQ's own name and badges in the new system (decision Q3).
test('S120 สำนักงานใหญ่ต่ออายุการใช้งาน 1 ปีที่เมนู 10 แล้วหัวหน้าสาขา B001 เห็นวันหมดอายุใหม่', async ({ app, page, golden }) => {
  const licence = page.getByText(/^Expired Date/).filter({ visible: true });
  await app.loginAsOwner();
  await expect(licence).toHaveText('Expired Date 10/02/2570 · เหลืออายุการใช้งาน 120 วัน');
  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  const extend = page.getByRole('button', { name: 'ต่ออายุ +1 ปี' });
  await extend.scrollIntoViewIfNeeded();
  await golden.step('HQ เปิดเมนู 10 ส่วนวันหมดอายุการใช้งาน');
  const before = await app.state();

  await extend.click();
  await expect(licence).toHaveText('Expired Date 10/02/2571 · เหลืออายุการใช้งาน 485 วัน');
  await golden.step('HQ ต่ออายุการใช้งาน 1 ปี');
  await golden.stateChange('extend', before);

  await signOut(page);
  await app.login('b001', '1234');
  await expect(licence).toHaveText('Expired Date 10/02/2571 · เหลืออายุการใช้งาน 485 วัน');
  await golden.step('หัวหน้าสาขา B001 เข้าสู่ระบบ เห็นวันหมดอายุใหม่');
  await golden.screen('b001-home-extended');
});
