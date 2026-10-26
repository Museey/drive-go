import { test, expect, type Page } from '../support/test';
import { secondDevice } from '../support/live';

// New behaviour (task 3.10, answers R19-ก, 10.1, 10.2): a quotation is open on this device when another device approves
// it. A bar appears under the window's heading with who did it and when, as the history shows them; the window keeps
// what it showed until the user presses the bar, which opens the quotation again from the latest data.
async function openQuote(p: Page, no: string) {
  await p.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await p.getByText(no, { exact: true }).filter({ visible: true }).click();
  await expect(p.getByRole('button', { name: 'ไม่อนุมัติ / ตีกลับ' })).toBeVisible();
}

test('S241 ระบบใหม่: เปิดใบเสนอราคาค้างไว้ แล้วอีกเครื่องอนุมัติใบนั้น ขึ้นแถบว่าใครแก้เมื่อไร กดแถบแล้วเห็นฉบับล่าสุด', async ({ app, page, browser }) => {
  test.slow();
  await app.loginAsOwner();
  await openQuote(page, 'MA-QT261000002');

  const other = await secondDevice(browser, page);
  await other.app.loginAsOwner();
  await openQuote(other.page, 'MA-QT261000002');
  await other.page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await expect(other.page.getByRole('button', { name: 'ฉบับแก้ไข' }).filter({ visible: true })).toBeVisible();
  await other.app.settle();

  const bar = page.locator('#mQuoteEdit').getByRole('button', { name: /^เอกสารนี้ถูกแก้ไขโดย/ });
  await expect(bar).toHaveText('เอกสารนี้ถูกแก้ไขโดย เจ้าของกิจการ / ผู้ดูแลระบบ เมื่อ 13/10/2569 09:00 — กดเพื่อโหลดข้อมูลล่าสุด');
  // Until the bar is pressed the window shows what it showed.
  await expect(page.getByRole('button', { name: 'อนุมัติเอกสาร' })).toBeVisible();
  expect(((await app.state()) as any).DB.quotes.find((q: any) => q.no === 'MA-QT261000002').apv.status).toBe('pending');

  await bar.click();
  await expect(bar).toBeHidden();
  await expect(page.getByRole('button', { name: 'ฉบับแก้ไข' }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'อนุมัติเอกสาร' })).toBeHidden();
  expect(((await app.state()) as any).DB.quotes.find((q: any) => q.no === 'MA-QT261000002').apv.status).toBe('approved');
  await other.context.close();
});
