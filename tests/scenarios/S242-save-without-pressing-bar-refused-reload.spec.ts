import { test, expect, type Page } from '../support/test';
import { secondDevice } from '../support/live';

// New behaviour (task 3.10, answer 10.1, decisions P1/Q5): the customer's window is open here, with a lane (ซอย)
// typed, when another device changes the same customer's grade. The bar says so; saving without pressing it is refused
// with the usual message, and after the reload the other device's change is there and nothing was written over it.
const row = (p: Page, name: string) => p.getByRole('row').filter({ hasText: name }).filter({ visible: true });

test('S242 ระบบใหม่: แก้ลูกค้าค้างไว้ อีกเครื่องเปลี่ยนเกรดลูกค้าคนเดียวกัน กดบันทึกโดยไม่กดแถบ ถูกปฏิเสธ ได้ข้อความเดิม แล้วโหลดข้อมูลล่าสุด', async ({ app, page, browser }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await row(page, 'นภาพร บุญรอด').getByRole('button', { name: 'แก้ไข' }).click();
  const cust = page.locator('#mCust');
  await expect(cust).toBeVisible();
  const soi = cust.getByLabel('ซอย', { exact: true });
  await expect(soi).toHaveValue('');
  await soi.fill('ลาดพร้าว 71 แยก 5');

  const other = await secondDevice(browser, page);
  await other.app.loginAsOwner();
  await other.page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await row(other.page, 'นภาพร บุญรอด').getByTitle('4 ดาว · ลูกค้าประจำ').click();
  await other.page.getByRole('button', { name: 'เปลี่ยนเกรด' }).click();
  await expect(row(other.page, 'นภาพร บุญรอด')).toContainText('ลูกค้าประจำ');
  await other.app.settle();

  await expect(cust.getByRole('button', { name: /^เอกสารนี้ถูกแก้ไขโดย เจ้าของกิจการ \/ ผู้ดูแลระบบ เมื่อ 13\/10\/2569 09:00/ })).toBeVisible();
  await expect(soi).toHaveValue('ลาดพร้าว 71 แยก 5');
  await cust.getByRole('button', { name: 'บันทึก', exact: true }).first().click();
  await expect(page.getByText('มีคนแก้ข้อมูลนี้จากเครื่องอื่นก่อนหน้า สิ่งที่เพิ่งทำยังไม่ถูกบันทึก — กดตกลงเพื่อโหลดข้อมูลล่าสุด')).toBeVisible();
  await page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await page.waitForEvent('load');
  await app.settle();
  const after = ((await app.state()) as any).DB.cust.find((c: any) => c.name === 'นภาพร บุญรอด');
  expect(after.stars).toBe(4);
  expect(JSON.stringify(after)).not.toContain('แยก 5');
  await other.context.close();
});
