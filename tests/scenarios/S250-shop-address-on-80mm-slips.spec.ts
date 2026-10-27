import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (owner's approval of 2026-10-27, docs/NOTES.md "ชุดตรวจสำหรับผู้ทำบัญชี"): the 80 mm slips — the
// abbreviated tax invoice of a stock cut and the 80 mm invoice — print the shop's address as typed in the settings.
// The legacy app formats it as an address in parts and prints "ต.function sub() { [native code] }" instead.
// window.print here records the lines on the print stage at the moment the print page would open (the stage is hidden
// on screen, so a line is what is between two line breaks).
async function recordPrints(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__printed = [];
    window.print = () => {
      const stage = document.getElementById('printStage')!.cloneNode(true) as HTMLElement;
      stage.querySelectorAll('br, hr').forEach(br => br.replaceWith('\n'));
      w.__printed.push((stage.textContent ?? '').split('\n').map(l => l.trim()).filter(Boolean));
    };
  });
}
/* clicks a print button and returns the lines it printed */
async function printed(page: Page, click: () => Promise<void>) {
  const n = await page.evaluate(() => (window as any).__printed.length as number);
  await click();
  await expect.poll(() => page.evaluate(() => (window as any).__printed.length as number)).toBe(n + 1);
  return page.evaluate(k => (window as any).__printed[k] as string[], n);
}
async function go(page: Page, menu: RegExp, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const SHOP = 'Drivego Service';
const ADDRESS = '123/45 ถ.พระราม 2 แขวงบางมด เขตจอมทอง กรุงเทพมหานคร 10150';

test('S250 ระบบใหม่: ใบกำกับภาษีอย่างย่อและใบแจ้งหนี้ขนาด 80 มม. พิมพ์ที่อยู่ร้านตามที่กรอกไว้ในหน้าตั้งค่า', async ({ app, page }) => {
  await recordPrints(page);
  await app.loginAsOwner();

  // The 80 mm stock cut of a walk-in sale with VAT (ใบกำกับภาษีอย่างย่อ).
  await go(page, /^04 ใบเสร็จรับเงิน/, '└ 4.1 ตัดสต็อกสินค้า');
  await page.getByRole('combobox', { name: 'ช่วงวันที่' }).filter({ visible: true }).selectOption('เลือกทั้งหมด');
  await page.getByText('MA-SA261000001', { exact: true }).filter({ visible: true }).click();
  const slip = await printed(page, () => page.getByRole('button', { name: 'เอกสารอย่างย่อ', exact: true }).click());
  expect(slip.slice(0, 4)).toEqual([SHOP, ADDRESS, expect.stringMatching(/^เลขประจำตัวผู้เสียภาษี /), 'ใบกำกับภาษีอย่างย่อ / ใบตัดสต็อกขายสินค้า']);
  expect(slip.join('\n')).not.toContain('function');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The 80 mm invoice of an approved invoice (4.2).
  await go(page, /^04 ใบเสร็จรับเงิน/, '└ 4.2 ใบแจ้งหนี้');
  await page.getByRole('row').filter({ hasText: 'MA-IV261000004' }).filter({ visible: true }).getByRole('button', { name: 'เปิด', exact: true }).click();
  const invoice = await printed(page, () => page.getByRole('button', { name: 'ใบแจ้งหนี้ (80 มม.)' }).filter({ visible: true }).click());
  expect(invoice.slice(0, 3)).toEqual([SHOP, ADDRESS, 'ใบแจ้งยอด / ใบแจ้งหนี้']);
  expect(invoice.join('\n')).not.toContain('function');
});
