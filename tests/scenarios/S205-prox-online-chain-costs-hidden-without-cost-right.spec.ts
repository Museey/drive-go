import { test, expect } from '../support/test';
import { chainServer, connectToChain, stockSynced } from '../support/chain-server';
import { managerWithoutCost } from '../support/cost-blind';
import { RANGSIT } from '../support/prox-online';

test.use({ dataset: 'prox-trial' });

// Task 3.12 (answer 12.5, F7 = ก): the chain sends its catalogue with costs straight to the browser, so the screen
// leaves them out for someone who may not see costs: EMP004 without "แสดงต้นทุน" (and without the jobs that see
// purchase prices) sees "-" for the chain's cost and for the cost of the requests; the suggested price stays.
test('S205 ระบบใหม่: ProX ออนไลน์ คนที่ไม่เห็นทุนไม่เห็นทุนในแคตตาล็อกและคำขอของคลังกลางเครือ', async ({ app, page }) => {
  const toyota = { product_id: 11, code: 'EN-501', name: 'กรองน้ำมันเครื่อง Toyota', unit: 'ชิ้น', cost: 95 };
  await chainServer(page, {
    accounts: [RANGSIT],
    products: [{ id: 11, code: 'EN-501', oem: '90915-YZZE1', name: toyota.name, cat: 'ไส้กรอง', unit: 'ชิ้น', cost: 95, price: 180, stock_hq: 240 }],
    requests: [{ id: 500, status: 'received', created_at: '2026-10-05T09:00:00', note: '', items: [{ ...toyota, qty: 10 }] }],
  });
  await managerWithoutCost(app, page);
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await connectToChain(page, 'rangsit', '1234');
  await stockSynced(page);
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: '★ คลังกลาง ProX' }).click();
  const product = page.locator('#pxCatTbl').getByRole('row').filter({ hasText: 'EN-501' });
  await expect(product.getByRole('cell').nth(4)).toHaveText('-');
  await expect(product.getByRole('cell').nth(5)).toHaveText('180.00');
  await expect(page.locator('#pxCatTbl')).not.toContainText('95.00');
  const request = page.locator('#pxReqTbl').getByRole('row').filter({ hasText: '#500' });
  await expect(request.getByRole('cell').nth(3)).toHaveText('-');
  await expect(page.locator('#pxReqTbl')).not.toContainText('950.00');
});
