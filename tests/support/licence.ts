// Where the screens show the shop's licence (task 3.15): for scenarios that replace a legacy one and compare its
// screenshots, these places show the server's licence on purpose (the chain's one date, a renewal only staff
// make), so they are checked by their text and left out of the picture.
import { type Page, expect } from '@playwright/test';

// The top bar's "Expired Date … · เหลืออายุการใช้งาน N วัน".
export const licenceLine = (page: Page) => page.getByText(/^⚠? ?Expired Date/).filter({ visible: true });
// The whole line it sits in (the date before it moves when the licence text is longer or shorter).
export const licenceBar = (page: Page) => licenceLine(page).locator('..');
// The test shops' licence: the fixture's (a trial to 10/02/2570, 120 days on the tests' day).
export const FIXTURE_LINE = 'Expired Date 10/02/2570 · เหลืออายุการใช้งาน 120 วัน';

// Menu 10's owner panel: its tag (counted to the licence's last day) and where the demo button was.
export async function ownerPanelLicence(page: Page) {
  const tag = page.getByText('ทดลองใช้ เหลือ 120 วัน', { exact: true });
  await expect(tag).toBeVisible();
  await expect(page.getByRole('button', { name: 'เดโม: จำลองครบ 15 วัน' })).toHaveCount(0);
  return [tag, page.locator('#dgbEmpWrap button[onclick^="dgbSimExpire"]')];
}

// Menu 10's licence fields (read-only, the server's dates) and where the renew buttons were.
export async function settingsLicence(page: Page) {
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const start = field('วันที่เริ่มใช้ระบบ'), end = field('วันที่สิ้นสุดการใช้งาน (Expired Date)'), left = field('อายุการใช้งานคงเหลือ');
  await expect(start).toHaveValue('2025-12-01');
  await expect(end).toHaveValue('2027-02-10');
  await expect(left).toHaveValue('120 วัน');
  await expect(end).not.toBeEditable();
  return [start, end, left, page.locator('#v-setting button[onclick^="extendLic"]')];
}
