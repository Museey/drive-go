import { test, expect } from '../support/test';
import { managerWithoutCost, sameCostsAsLegacy } from '../support/cost-blind';

// New behaviour (task 3.9, R14-ข): someone without "แสดงต้นทุน" (EMP004 here, without the cost switch and the jobs
// that see purchase prices) gets no cost from the server, yet cancels a sale waiting for payment as S15's owner did: the server works out
// the moves that put the goods back (no cost, the lots they came from take them back) and keeps the
// register and lot costs exactly as the legacy app did with every cost.
const S15 = 'S15-cancel-stock-cut-returns-stock.spec.ts';

test('S182 ระบบใหม่: พนักงานที่ไม่เห็นทุนยกเลิกใบตัดสต็อก สินค้าคืนเข้าล็อตเดิม ต้นทุนไม่เปลี่ยน ตรงกับระบบเดิม', async ({ app, page }) => {
  test.slow();
  await managerWithoutCost(app, page);
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'ยกเลิกใบตัดสต็อก MA-SA261000003' })).toBeVisible();
  await page.getByText('ระบุเหตุผลที่ยกเลิก').locator('xpath=following-sibling::input[1]').fill('ลูกค้ายกเลิกการซื้อ');

  const before = await app.serverDB();
  await page.getByRole('button', { name: 'ยกเลิกและคืนสต๊อก' }).click();
  await expect(page.getByRole('button', { name: 'ทำฉบับแก้ไข' }).filter({ visible: true })).toBeHidden();
  await sameCostsAsLegacy(app, page, S15, 'cancel-stock-cut', before);
  const after = await app.serverDB();
  for (const code of ['AC-204', 'AC-215']) {
    const was = before.stock.find((s: any) => s.code === code), now = after.stock.find((s: any) => s.code === code);
    expect(now.cost, code).toBe(was.cost);
  }
});
