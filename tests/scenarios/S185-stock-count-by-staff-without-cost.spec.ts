import { test, expect } from '../support/test';
import { managerWithoutCost, sameCostsAsLegacy } from '../support/cost-blind';

// New behaviour (task 3.9, R14-ข): someone without "แสดงต้นทุน" (EMP004 here, without the cost switch and the jobs
// that see purchase prices) gets no cost from the server, yet counts the air-conditioning parts and approves the count as S32's owner did: the server works out
// the cost of the lot the surplus opens (the register cost, 1,600) and of what the shortfall took (120) exactly as the legacy app did with every cost.
const S32 = 'S32-stock-count-adjust.spec.ts';

test('S185 ระบบใหม่: พนักงานที่ไม่เห็นทุนตรวจนับสินค้าและอนุมัติปรับยอด server คิดต้นทุนของส่วนขาดและส่วนเกินให้ตรงกับระบบเดิม', async ({ app, page }) => {
  test.slow();
  await managerWithoutCost(app, page);
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'ตรวจนับสินค้า' }).click();
  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ visible: true }).getByRole('spinbutton').fill('17');
  await page.getByRole('row').filter({ hasText: 'AC-230' }).filter({ visible: true }).getByRole('spinbutton').fill('20');
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('ตรวจนับประจำเดือน');

  const before = await app.serverDB();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await expect(page.getByRole('button', { name: 'ตกลง' })).toBeVisible();
  await sameCostsAsLegacy(app, page, S32, 'approve-count', before);
});
