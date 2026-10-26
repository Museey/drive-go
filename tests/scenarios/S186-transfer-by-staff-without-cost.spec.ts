import { test, expect } from '../support/test';
import { managerWithoutCost, sameCostsAsLegacy } from '../support/cost-blind';

// New behaviour (task 3.9, R14-ข): someone without "แสดงต้นทุน" (EMP004 here, without the cost switch and the jobs
// that see purchase prices) gets no cost from the server, yet transfers brake pads to a new branch as S37's owner did: the server works out
// the transfer's line cost (what it took from its lot, 850) and the cost of the lot and the move
// that bring the goods in at the other end exactly as the legacy app did with every cost.
const S37 = 'S37-transfer-between-branches.spec.ts';

test('S186 ระบบใหม่: พนักงานที่ไม่เห็นทุนโอนอะไหล่ไปสาขาใหม่ server คิดต้นทุนของใบโอนให้ตรงกับระบบเดิม', async ({ app, page }) => {
  test.slow();
  await managerWithoutCost(app, page);
  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('สาขาบางนา').filter({ visible: true }).first()).toBeVisible();

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'โอนสินค้าระหว่างสาขา' }).click();
  await page.getByRole('button', { name: '+ สร้างใบโอนสินค้า' }).click();
  await page.getByLabel('สาขาปลายทาง *').filter({ visible: true }).selectOption({ label: 'BN · สาขาบางนา' });
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('เติมสต๊อกสาขา');
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001 · ผ้าเบรกหน้า Toyota Revo/ }).click();
  await page.getByRole('row').filter({ hasText: 'BR-001' }).filter({ visible: true }).getByRole('spinbutton').fill('5');
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'บันทึกและโอนสินค้า' }).click();

  const before = await app.serverDB();
  await page.getByRole('button', { name: 'โอนสินค้า', exact: true }).click();
  await expect(page.getByRole('button', { name: 'โอนสินค้า', exact: true })).toBeHidden();
  await sameCostsAsLegacy(app, page, S37, 'transfer', before);
  const t = (await app.serverDB()).transfers.at(-1);
  expect(t.lines[0]).toMatchObject({ cost: 850 });
});
