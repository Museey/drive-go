import { test, expect } from '../support/test';
import { heard, secondDevice } from '../support/live';

// New behaviour (task 3.10, answers R19-ข and 10.4): the data, numbers and stock are the server's, so a device that
// cannot reach it must not go on issuing documents or taking money. After about 8 seconds without a word from the
// server the whole screen is covered with "เชื่อมต่อ server ไม่ได้ …"; what the user typed stays; once the server
// answers again the cover goes by itself, and what another device saved meanwhile is there.
test('S244 ระบบใหม่: เน็ตหลุด หน้าจอถูกปิดด้วยข้อความเชื่อมต่อ server ไม่ได้ สิ่งที่พิมพ์ไม่หาย เน็ตกลับมาแล้วหายเอง และเห็นสิ่งที่อีกเครื่องบันทึกระหว่างนั้น', async ({ app, page, context, browser }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await search.fill('ผ้าเบรก');

  const cover = page.getByRole('alert').filter({ hasText: 'เชื่อมต่อ server ไม่ได้' });
  await context.setOffline(true);
  await expect(cover).toHaveText('เชื่อมต่อ server ไม่ได้ — ออกเอกสารและรับเงินไม่ได้จนกว่าจะเชื่อมต่อได้ ระบบกำลังลองเชื่อมต่อใหม่', { timeout: 20_000 });
  // The cover is over everything: the page under it cannot be used.
  expect(await page.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return !!el && !!el.closest('[role="alert"]');
  })).toBe(true);

  // Meanwhile another device raises a customer's grade (as in S109).
  const other = await secondDevice(browser, page);
  await other.app.loginAsOwner();
  await other.page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  const customer = other.page.getByRole('row').filter({ hasText: 'นภาพร บุญรอด' }).filter({ visible: true });
  await customer.getByTitle('4 ดาว · ลูกค้าประจำ').click();
  await other.page.getByRole('button', { name: 'เปลี่ยนเกรด' }).click();
  await expect(customer).toContainText('ลูกค้าประจำ');
  await other.app.settle();

  await context.setOffline(false);
  await expect(cover).toBeHidden({ timeout: 20_000 });
  await expect(search).toHaveValue('ผ้าเบรก');
  await heard(page);
  expect(((await app.state()) as any).DB.cust.find((c: any) => c.name === 'นภาพร บุญรอด').stars).toBe(4);
  await other.context.close();
});
