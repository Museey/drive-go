import { test, expect } from '../support/test';
import { managerWithoutCost, sameCostsAsLegacy } from '../support/cost-blind';

// New behaviour (task 3.9, R14-ข): someone without "แสดงต้นทุน" (EMP004 here, without the cost switch and the jobs
// that see purchase prices) gets no cost from the server, yet cuts stock from an approved quotation as S12's owner did: the server works out
// the cost of goods of the new sale (3,330) and of what it took from each lot exactly as the legacy app did with every cost.
const S12 = 'S12-stock-cut-from-approved-quotation.spec.ts';

test('S183 ระบบใหม่: พนักงานที่ไม่เห็นทุนตัดสต็อกจากใบเสนอราคา server คิดต้นทุน FIFO ให้ตรงกับระบบเดิม', async ({ app, page }) => {
  test.slow();
  await managerWithoutCost(app, page);
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: 'ใบเสนอราคาที่รอตัดสต็อก 2' }).click();
  await page.getByText('MA-QT261000003', { exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('รายการมาจากใบเสนอราคา MA-QT261000003', { exact: false }).filter({ visible: true })).toBeVisible();

  const before = await app.serverDB();
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await sameCostsAsLegacy(app, page, S12, 'cut-from-quote', before);
});
