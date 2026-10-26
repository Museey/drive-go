import { test, expect } from '../support/test';
import { managerWithoutCost, sameCostsAsLegacy } from '../support/cost-blind';

// New behaviour (task 3.9, R14-ข): someone without "แสดงต้นทุน" (EMP004 here, without the cost switch and the jobs
// that see purchase prices) gets no cost from the server, yet makes a revision of a sale waiting for payment as S16's owner did: the server works out
// the revision's cost of goods (net of what the first issue gave back, 5,840) and the cost of the extra
// filter it took from its lot (120) exactly as the legacy app did with every cost.
const S16 = 'S16-revise-stock-cut-quantity.spec.ts';

test('S181 ระบบใหม่: พนักงานที่ไม่เห็นทุนทำฉบับแก้ไขใบตัดสต็อก server คิดต้นทุนของฉบับแก้ไขให้ตรงกับระบบเดิม', async ({ app, page }) => {
  test.slow();
  await managerWithoutCost(app, page);
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ทำฉบับแก้ไข' }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'บันทึกฉบับแก้ไข' }).filter({ visible: true }).first()).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ has: page.getByRole('spinbutton') });
  await row.getByRole('spinbutton').nth(1).fill('2');
  await row.getByRole('spinbutton').nth(1).press('Tab');
  await expect(page.getByText('10,122.20').filter({ visible: true }).first()).toBeVisible();

  const before = await app.serverDB();
  await page.getByRole('button', { name: 'บันทึกฉบับแก้ไข' }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ทำฉบับแก้ไข' }).filter({ visible: true })).toBeVisible();
  await sameCostsAsLegacy(app, page, S16, 'revise-stock-cut', before);
  const revised = (await app.serverDB()).stockCuts.find((c: any) => c.no === 'MA-SA261000003-R1');
  expect(revised).toMatchObject({ cost: 5840 });
});
