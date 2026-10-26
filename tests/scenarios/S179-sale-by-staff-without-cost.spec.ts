import { test, expect } from '../support/test';
import { managerWithoutCost, sameCostsAsLegacy } from '../support/cost-blind';

// New behaviour (task 3.9, R14-ข): someone without "แสดงต้นทุน" (EMP004 here, without the cost switch and the jobs
// that see purchase prices) gets no cost from the server, yet sells as S17's owner did: the server works out the
// cost of what left (850 a piece from its FIFO lot, 1,700 for the sale) exactly as the legacy app did with every cost.
const S17 = 'S17-direct-sale-stock-cut.spec.ts';

test('S179 ระบบใหม่: พนักงานที่ไม่เห็นทุนสร้างใบตัดสต็อกขายตรง server คิดต้นทุน FIFO ให้ตรงกับระบบเดิม', async ({ app, page }) => {
  test.slow();
  await managerWithoutCost(app, page);
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อลูกค้า / เบอร์โทร / ทะเบียน').filter({ visible: true });
  await custBox.fill('วิภา');
  await custBox.locator('..').getByText('วิภา ศรีสมบูรณ์').click();
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001/ }).click();
  const row = page.getByRole('row').filter({ hasText: 'BR-001' }).filter({ has: page.getByRole('spinbutton') });
  await row.getByRole('spinbutton').nth(1).fill('2');
  await row.getByRole('spinbutton').nth(1).press('Tab');
  await expect(page.getByText('2,953.20').filter({ visible: true }).first()).toBeVisible();

  const before = await app.serverDB();
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await sameCostsAsLegacy(app, page, S17, 'direct-sale', before);
  const sale = (await app.serverDB()).stockCuts.find((c: any) => c.no === 'MA-SA261000015');
  expect(sale).toMatchObject({ cost: 1700, lines: [expect.objectContaining({ cost: 850 })] });
});
