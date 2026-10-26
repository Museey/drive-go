import { test, expect, type Page } from '../support/test';
import { heard, secondDevice } from '../support/live';

// New behaviour (task 3.10, answers 10.1 and "อื่น ๆ"): menu 10 is a form of its own. While someone is typing there,
// another device's save of the same settings does not redraw it: what was typed stays. Saving it then is refused with
// the usual message (it would write over the other device's change), and after the reload the other change is there.
// Leaving the page lets the change in at once.
const field = (p: Page, label: string) => p.getByLabel(label, { exact: true }).filter({ visible: true });

test('S248 ระบบใหม่: พิมพ์ในหน้าตั้งค่าองค์กรค้างไว้ อีกเครื่องบันทึกการตั้งค่า สิ่งที่พิมพ์ไม่หาย กดบันทึกแล้วถูกปฏิเสธ โหลดใหม่แล้วเห็นค่าของอีกเครื่อง', async ({ app, page, browser }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await field(page, 'เว็บไซต์ / เพจ (ถ้ามี)').fill('facebook.com/drivegoservice');

  const other = await secondDevice(browser, page);
  await other.app.loginAsOwner();
  await other.page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await field(other.page, 'เบอร์โทรศัพท์').fill('02-555-1234, 081-555-1234, 095-123-4567');
  await other.page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await other.app.settle();

  // Heard, waiting: the form here is as typed, the phone number as it was.
  await expect.poll(() => page.evaluate(() => (window as any).storage.live.waiting)).toBe(true);
  await expect(field(page, 'เว็บไซต์ / เพจ (ถ้ามี)')).toHaveValue('facebook.com/drivegoservice');
  await expect(field(page, 'เบอร์โทรศัพท์')).toHaveValue('02-555-1234, 081-555-1234');

  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await expect(page.getByText('มีคนแก้ข้อมูลนี้จากเครื่องอื่นก่อนหน้า สิ่งที่เพิ่งทำยังไม่ถูกบันทึก — กดตกลงเพื่อโหลดข้อมูลล่าสุด')).toBeVisible();
  await page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await page.waitForEvent('load');
  await app.settle();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(field(page, 'เบอร์โทรศัพท์')).toHaveValue('02-555-1234, 081-555-1234, 095-123-4567');
  await expect(field(page, 'เว็บไซต์ / เพจ (ถ้ามี)')).toHaveValue('');

  // Off the form page, the next change comes in at once.
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await field(other.page, 'เว็บไซต์ / เพจ (ถ้ามี)').fill('facebook.com/drivego');
  await other.page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await other.app.settle();
  await expect.poll(async () => ((await app.state()) as any).DB.shop.web).toBe('facebook.com/drivego');
  await heard(page);
  await other.context.close();
});
