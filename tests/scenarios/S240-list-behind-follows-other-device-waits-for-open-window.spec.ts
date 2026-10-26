import { test, expect, type Page } from '../support/test';
import { heard, secondDevice } from '../support/live';

// New behaviour (task 3.10, decision Q8, answer "อื่น ๆ"): a list on the screen follows what another device saves,
// without a reload. While a window is open over it, nothing behind changes; once it is closed the list is drawn
// again with the latest data, in the same place.
const row = (p: Page, name: string) => p.getByRole('row').filter({ hasText: name }).filter({ visible: true });
async function grade(p: Page, name: string, stars: string) {
  await row(p, name).getByTitle(stars).click();
  await p.getByRole('button', { name: 'เปลี่ยนเกรด' }).click();
}

test('S240 ระบบใหม่: อีกเครื่องเปลี่ยนเกรดลูกค้า รายชื่อลูกค้าบนเครื่องนี้เปลี่ยนตามทันที ระหว่างเปิดหน้าต่างอยู่รอให้ปิดก่อน', async ({ app, page, browser }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await expect(row(page, 'นภาพร บุญรอด')).toContainText('ลูกค้าขาจร');

  const other = await secondDevice(browser, page);
  await other.app.loginAsOwner();
  await other.page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await grade(other.page, 'นภาพร บุญรอด', '4 ดาว · ลูกค้าประจำ');
  await expect(row(other.page, 'นภาพร บุญรอด')).toContainText('ลูกค้าประจำ');
  await other.app.settle();
  // This device's list follows at once.
  await expect(row(page, 'นภาพร บุญรอด')).toContainText('ลูกค้าประจำ');

  // A window open here: the list behind waits until it is closed.
  await row(page, 'วิภา ศรีสมบูรณ์').getByRole('button', { name: 'แก้ไข' }).click();
  const custWindow = page.locator('#mCust');
  await expect(custWindow).toBeVisible();
  await grade(other.page, 'นภาพร บุญรอด', '5 ดาว · ลูกค้าคนสำคัญ (VIP)');
  await other.app.settle();
  await expect.poll(() => page.evaluate(() => (window as any).storage.live.waiting)).toBe(true);
  await expect(row(page, 'นภาพร บุญรอด')).toContainText('ลูกค้าประจำ');
  await custWindow.getByRole('button', { name: /^(ปิด|✕)$/ }).first().click();
  await expect(custWindow).toBeHidden();
  await expect(row(page, 'นภาพร บุญรอด')).toContainText('VIP');
  await heard(page);
  expect(((await app.state()) as any).DB.cust.find((c: any) => c.name === 'นภาพร บุญรอด').stars).toBe(5);
  await other.context.close();
});
