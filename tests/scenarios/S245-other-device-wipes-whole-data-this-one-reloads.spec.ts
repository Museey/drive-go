import { test, expect } from '../support/test';
import { secondDevice } from '../support/live';
import { confirmWithShopName } from '../support/whole-data';

// New behaviour (task 3.10, answer 10.5): while one device has the shop open, another wipes the whole data set (3.2d,
// with its safety copy). The first device is told at once and reloads with what is there now, instead of working on
// data that is gone (its next save would have written the old records back one by one).
test('S245 ระบบใหม่: อีกเครื่องล้างข้อมูลทั้งหมดระหว่างที่เครื่องนี้เปิดทะเบียนอะไหล่อยู่ เครื่องนี้ขึ้นข้อความทันทีแล้วโหลดข้อมูลใหม่', async ({ app, page, browser }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  const brakes = page.getByRole('row').filter({ hasText: 'ระบบเบรก' }).filter({ visible: true });
  await expect(brakes).toHaveText(/ระบบเบรก\s*5\s*96\b/);

  const other = await secondDevice(browser, page);
  await other.app.loginAsOwner();
  const shopName = ((await other.app.state()) as any).DB.shop.name;
  await other.page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await other.page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await confirmWithShopName(other.page, shopName, 'ล้างข้อมูล');
  await expect(other.page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await other.app.settle();

  await expect(page.getByText('ล้างข้อมูลทั้งหมดจากเครื่องอื่นแล้ว — กดตกลงเพื่อโหลดข้อมูลล่าสุด')).toBeVisible();
  await page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await page.waitForEvent('load');
  await app.settle();
  // Still signed in, with the wiped data.
  const now = (await app.state()) as any;
  expect(now.DB.stock).toEqual([]);
  expect(now.DB.audit[0]).toMatchObject({ kind: 'data', act: 'wipe' });
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await expect(brakes).toHaveText(/ระบบเบรก\s*0\s*0\b/);
  await other.context.close();
});
