import { test, expect } from '../support/test';
import { prepareContext } from '../support/browser.mjs';
import { CONTEXT_OPTIONS, FIXED_NOW, TEST_SEED } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';

// New behaviour (decisions P1, Q5): two people in one shop change the same
// customer. The one who saves second is refused, told so, and gets the latest
// data after pressing OK; the first one's change stays. Since task 3.10 a
// browser sees the other's saves at once, but not while its own question is
// open (answer 10.1): both people have the grade question open before either
// answers.
test('S109 ระบบใหม่: สองเครื่องแก้ลูกค้าคนเดียวกัน เครื่องที่บันทึกทีหลังถูกปฏิเสธ ได้ข้อความแจ้ง แล้วโหลดข้อมูลล่าสุด', async ({ app, page, browser }) => {
  await app.loginAsOwner();
  const otherContext = await browser.newContext(CONTEXT_OPTIONS);
  await prepareContext(otherContext, { seed: TEST_SEED + 1, now: FIXED_NOW });
  const other = await otherContext.newPage();
  const otherApp = legacyApp(other, { url: page.url().split('?')[0], restore: async () => {} });
  await otherApp.loginAsOwner();

  const customer = (p: typeof page) => p.getByRole('row').filter({ hasText: 'นภาพร บุญรอด' }).filter({ visible: true });
  for (const p of [page, other]) {
    await p.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
    await expect(customer(p)).toContainText('ลูกค้าขาจร');
  }

  // Both ask to change the grade: the second browser's question is open while the first one saves 4 stars.
  await customer(other).getByTitle('3 ดาว · ลูกค้าทั่วไป').click();
  await expect(other.getByRole('button', { name: 'เปลี่ยนเกรด' })).toBeVisible();
  await customer(page).getByTitle('4 ดาว · ลูกค้าประจำ').click();
  await page.getByRole('button', { name: 'เปลี่ยนเกรด' }).click();
  await expect(customer(page)).toContainText('ลูกค้าประจำ');
  await app.settle();
  await page.evaluate(() => (window as any).storage.idle());

  // Second browser still works on the old grade (its question was open) and answers it.
  await other.getByRole('button', { name: 'เปลี่ยนเกรด' }).click();
  await expect(other.getByText('มีคนแก้ข้อมูลนี้จากเครื่องอื่นก่อนหน้า สิ่งที่เพิ่งทำยังไม่ถูกบันทึก — กดตกลงเพื่อโหลดข้อมูลล่าสุด')).toBeVisible();
  await other.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await other.waitForEvent('load');
  await otherApp.settle();

  // After the reload the second browser is still signed in and sees the first one's change.
  await other.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await expect(customer(other)).toContainText('ลูกค้าประจำ');
  const stars = (s: any) => s.DB.cust.find((c: any) => c.name === 'นภาพร บุญรอด').stars;
  expect(stars(await otherApp.state())).toBe(4);
  expect(stars(await app.state())).toBe(4);
  await otherContext.close();

  // The second browser's refused save changed nothing; opening the page again
  // shows the latest, and the check after the test compares that with the server.
  await app.open();
  expect(stars(await app.state())).toBe(4);
});
