import { test, expect, type Page } from '../support/test';
import { prepareContext } from '../support/browser.mjs';
import { CONTEXT_OPTIONS, FIXED_NOW, TEST_SEED } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { heard } from '../support/live';

// New behaviour (task 3.2, decision R1-ก): document numbers are issued on the
// server. Two people in one shop write a quotation at the same time; both
// forms take the next number, MA-QT261000005. The one saved first keeps it,
// the one saved second is saved too, as MA-QT261000006, everywhere that save
// wrote it, and the message says so. Nobody has to reload, and each browser
// then has both quotations (task 3.10).
test('S126 ระบบใหม่: สองเครื่องออกใบเสนอราคาพร้อมกัน เครื่องที่บันทึกทีหลังได้เลขถัดไป ไม่มีเลขซ้ำ และไม่ต้องโหลดใหม่', async ({ app, page, browser }) => {
  await app.loginAsOwner();
  const otherContext = await browser.newContext(CONTEXT_OPTIONS);
  await prepareContext(otherContext, { seed: TEST_SEED + 1, now: FIXED_NOW });
  const other = await otherContext.newPage();
  const otherApp = legacyApp(other, { url: page.url().split('?')[0], restore: async () => {} });
  await otherApp.loginAsOwner();

  // Both start a quotation before either saves.
  await newQuotation(page, 'ปรีชา', 'ปรีชา ทองสุข', 'ค่าแรงเปลี่ยนแบตเตอรี่');
  await newQuotation(other, 'นภาพร', 'นภาพร บุญรอด', 'ค่าแรงตรวจเช็กระบบไฟ');

  await save(page);
  await app.settle();
  await page.evaluate(() => (window as any).storage.idle());
  await save(other);
  await expect(other.getByText('บันทึกแล้ว เอกสารได้เลขที่ MA-QT261000006 เพราะเลขที่ MA-QT261000005 ถูกใช้ไปแล้ว')).toBeVisible();
  await otherApp.settle();
  await other.evaluate(() => (window as any).storage.idle());

  // The second browser carries on with what was saved: its list shows the
  // real number, and its next quotation takes the number after it. Once its
  // window is closed it also has the first browser's quotation, which it heard
  // while the window was open (task 3.10).
  await other.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await expect(other.getByText('MA-QT261000006', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(other.getByText('MA-QT261000005', { exact: true }).filter({ visible: true })).toBeVisible();
  await heard(other);
  const quotes = (s: any) => s.DB.quotes.filter((q: any) => q.no > 'MA-QT261000004').map((q: any) => [q.no, s.DB.cust.find((c: any) => c.id === q.custId)?.name]).sort();
  const audit = (s: any) => s.DB.audit.filter((x: any) => x.kind === 'quote' && x.no > 'MA-QT261000004').map((x: any) => x.no).sort();
  const mine = await otherApp.state();
  expect(quotes(mine)).toEqual([['MA-QT261000005', 'ปรีชา ทองสุข'], ['MA-QT261000006', 'นภาพร บุญรอด']]);
  expect(audit(mine)).toEqual(['MA-QT261000005', 'MA-QT261000006']);
  expect(mine.DB.seq['MA-QT2610']).toBe(6);
  expect(await other.evaluate(() => (window as any).storage.problems)).toEqual([]);
  await otherContext.close();

  // Opening the page again shows both quotations, each with its own number;
  // the check after the test compares this with the server.
  await app.open();
  const all = await app.state();
  expect(quotes(all)).toEqual([['MA-QT261000005', 'ปรีชา ทองสุข'], ['MA-QT261000006', 'นภาพร บุญรอด']]);
  expect(audit(all)).toEqual(['MA-QT261000005', 'MA-QT261000006']);
  expect(all.DB.seq['MA-QT2610']).toBe(6);
});

// Menu 03, a new quotation for an existing customer with one labour line (as in S10).
async function newQuotation(page: Page, search: string, name: string, labour: string) {
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill(search);
  await custBox.locator('..').getByText(name).click();
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).click();
  const row = page.getByRole('row')
    .filter({ has: page.getByText('ค่าแรง', { exact: true }) })
    .filter({ has: page.getByRole('spinbutton') });
  await row.getByRole('textbox').fill(labour);
  await row.getByRole('spinbutton').nth(1).fill('350');
  await row.getByRole('spinbutton').nth(1).press('Tab');
}

async function save(page: Page) {
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true })).toBeVisible();
}
