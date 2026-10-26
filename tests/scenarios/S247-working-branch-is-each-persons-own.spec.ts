import { test, expect, type Page } from '../support/test';
import { secondDevice } from '../support/live';

// New behaviour (task 3.10, answer 10.7): the branch each person works in is their own. The legacy app kept it in
// the shop's data, so one person changing branch moved everybody and rewrote every stock record. One device changes
// to a new branch (สาขาบางนา, as in S37) and has that branch's stock; the other device stays in the main branch with
// the main branch's stock. The server keeps the stock records with the main branch's quantities.
const workingBranch = (p: Page) => p.getByRole('combobox', { name: 'สาขาที่กำลังทำงาน' });

test('S247 ระบบใหม่: สาขาที่ทำงานเป็นของแต่ละคน เครื่องหนึ่งเปลี่ยนไปสาขาบางนา อีกเครื่องยังอยู่สาขาหลัก ยอดสต๊อกเป็นของสาขาที่ตัวเองทำงาน', async ({ app, page, browser }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(workingBranch(page)).toBeEnabled();
  await app.settle();

  const other = await secondDevice(browser, page);
  await other.app.loginAsOwner();

  await workingBranch(page).selectOption({ label: 'BN · สาขาบางนา' });
  await app.settle();
  // This device has the new branch's stock in its records (none yet); the summary of 07 counts every branch.
  const brakeQty = async (a: typeof app) => ((await a.state()) as any).DB.stock.filter((s: any) => s.cat === 'ระบบเบรก').map((s: any) => s.qty);
  expect(await brakeQty(app)).toEqual([0, 0, 0, 0, 0]);
  expect(((await app.state()) as any).DB.stockCtx).not.toBe('main');

  // The other device is still in the main branch, with its stock.
  await expect(workingBranch(other.page).locator('option:checked')).toHaveText('MA · สาขาหลัก');
  const mainQty = await brakeQty(other.app);
  expect(mainQty.reduce((a: number, b: number) => a + b, 0)).toBe(96);
  expect(((await other.app.state()) as any).DB.stockCtx).toBe('main');

  // Opened again, the app starts where its person starts, as the legacy app does on every start (38.js: the home
  // branch, the main one for the owner); the other device was never moved.
  await app.open();
  await app.settle();
  await expect(workingBranch(page).locator('option:checked')).toHaveText('MA · สาขาหลัก');
  await expect(workingBranch(other.page).locator('option:checked')).toHaveText('MA · สาขาหลัก');

  // The server keeps the main branch's quantities in the records, whoever saved them.
  const server = await app.serverDB();
  expect(server.stockCtx).toBe('main');
  const local = (await other.app.state() as any).DB.stock.map((s: any) => [s.code, s.qty]);
  expect(server.stock.map((s: any) => [s.code, s.qty])).toEqual(local);
  expect(await other.page.evaluate(() => (window as any).storage.verify())).toMatchObject({ wrong: [] });
  await other.context.close();
});
