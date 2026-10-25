import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.7, decision R12 = ค): the social security figures come from the law
// (October 2026: 5%, base 1,650 – 17,500, at most 875); the shop may still use its own. Saving
// figures that differ from the law asks first ("ไม่เปลี่ยน" puts the fields back), then keeps them
// from this month on, says so beside the panel's title and writes the audit log; the payroll uses
// them. Typing the law's figures again goes back to the law. The legacy fields DB.shop.sso… stay
// as they were.
const asked = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

test('S173 ระบบใหม่: ร้านตั้งอัตราประกันสังคมเองต่างจากกฎหมาย ระบบถามก่อน ลงประวัติ และเงินเดือนใช้ค่าที่ร้านตั้ง แล้วกลับไปใช้ค่าตามกฎหมาย', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const cap = field('เพดานเงินสมทบต่อคน (บาท)'), max = field('ฐานค่าจ้างสูงสุด (บาท)');
  const law = page.getByText(/^ประกันสังคมตามกฎหมาย/);
  await expect(cap).toHaveValue('875');
  await expect(max).toHaveValue('17500');
  const start = (await app.state()).DB;
  const save = page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first();

  // Not confirmed: nothing changes.
  await max.fill('15000');
  await cap.fill('750');
  await save.click();
  const warn = asked(page, 'อัตราประกันสังคมต่างจากกฎหมาย');
  await expect(warn.getByText(/^ตามกฎหมาย: 5% ฐาน 1,650 – 17,500 บาท หักสูงสุด 875 บาท/)).toBeVisible();
  await warn.getByRole('button', { name: 'ไม่เปลี่ยน' }).click();
  await expect(max).toHaveValue('17500');
  await expect(cap).toHaveValue('875');
  await app.settle();
  expect((await app.state()).DB.shop).toEqual(start.shop);

  // Confirmed: the shop's own figures from October 2026.
  await max.fill('15000');
  await cap.fill('750');
  await save.click();
  await warn.getByRole('button', { name: 'ใช้ค่าที่ร้านตั้ง' }).click();
  await expect(max).toHaveValue('15000');
  await expect(law).toContainText('ตอนนี้ใช้ค่าที่ร้านตั้งเอง (5% · ฐาน 1,650 – 15,000 · หักสูงสุด 750) ตั้งแต่ ต.ค. 2569 โดย เจ้าของกิจการ / ผู้ดูแลระบบ');
  await app.settle();
  const own = (await app.state()).DB;
  expect(own.shop.ssoOwn).toMatchObject({ rate: 5, min: 1650, max: 15000, cap: 750, from: '2026-10', by: 'เจ้าของกิจการ / ผู้ดูแลระบบ' });
  expect([own.shop.ssoRate, own.shop.ssoMin, own.shop.ssoMax, own.shop.ssoCap]).toEqual([start.shop.ssoRate, start.shop.ssoMin, start.shop.ssoMax, start.shop.ssoCap]);
  expect(own.audit.at(-1)).toMatchObject({ kind: 'setting', act: 'save',
    note: 'ตั้งอัตราประกันสังคมเอง 5% ฐาน 1,650 – 15,000 หักสูงสุด 750 บาท ตั้งแต่ ต.ค. 2569 (กฎหมาย: 5% ฐาน 1,650 – 17,500)' });

  // The payroll uses them: EMP001 750, 8,050 each side.
  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '4 · จ่ายเงินเดือน' }).click();
  await expect(page.locator('#payTbl').getByRole('row').filter({ hasText: 'EMP001' }).getByRole('cell').nth(7)).toHaveText('750.00');
  await expect(page.locator('#payTbl').getByRole('row').filter({ hasText: 'รวม 11 คน' }).getByRole('cell')).toHaveText(['รวม 11 คน', '216,500.00', '8,050.00', '208,450.00', '8,050.00']);
  await expect(page.getByText(/^ยังไม่ได้บันทึกงวด ต\.ค\. 2569/)).toContainText('ประกันสังคม 5% ฐาน 1,650 – 15,000 บาท (หักสูงสุด 750 บาท) · ร้านตั้งเอง');

  // The law's figures typed again: back to the law, no question.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await max.fill('17500');
  await cap.fill('875');
  await save.click();
  await expect(warn).toBeHidden();
  await expect(law).not.toContainText('ร้านตั้งเอง');
  await app.settle();
  const back = (await app.state()).DB;
  expect(back.shop.ssoOwn).toBeUndefined();
  expect(back.audit.at(-1)).toMatchObject({ kind: 'setting', note: 'กลับไปใช้อัตราประกันสังคมตามกฎหมาย' });
});
