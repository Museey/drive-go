// Steps shared by the ProX online scenarios of task 3.12 (S200–S204): the shop's side of a chain booking.
import type { Page } from '@playwright/test';
import { expect } from './test';

type App = { settle(): Promise<void> };

export const RANGSIT = { username: 'rangsit', password: '1234', display: 'สาขารังสิต', branch: 'สาขารังสิต' };

// Booked by the 2nd car of ฝ่ายจัดซื้อ คุณวราภรณ์ (บริษัท ขนส่งไทยรุ่งเรือง จำกัด, price tier A) in prox-trial.
export const HILUX = { plate: 'ธร 1085', car: 'Toyota Hilux Revo 2.4', owner: 'ฝ่ายจัดซื้อ คุณวราภรณ์',
  service: 'เปลี่ยนคอยล์จุดระเบิด', created_at: '2026-10-13T08:30:00' };

export const bookingRow = (page: Page, id: number) => page.getByRole('row').filter({ hasText: `#${id}` });

// In menu P1 while online: take booking `id`, then as the shop does with the quotation it opened (menu 03):
// EL-125 ชุดคอยล์จุดระเบิด 1 × 1,720 (tier A) + VAT 7% = 1,840.40, approve, cut the stock and save it waiting for
// payment (menu 04). Ends back on P1. The quotation is `quote`, the sale `sale`.
export async function jobWithSale(page: Page, app: App, id: number, quote: string, sale: string) {
  const row = bookingRow(page, id);
  await row.getByRole('button', { name: 'รับเข้าระบบ → เปิดใบเสนอราคา' }).click();
  await expect(row.getByText('รับแล้ว', { exact: true })).toBeVisible();
  await expect(row).toContainText('ยังไม่ตัดสต็อก');
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByText(quote, { exact: true }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('EL-125');
  await page.getByRole('option', { name: /EL-125/ }).click();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await expect(page.getByRole('button', { name: 'อนุมัติเอกสาร' })).toBeHidden();
  await page.getByRole('button', { name: 'ตัดสต็อกสินค้า' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText(`ใบตัดสต็อก ${sale} · รอชำระ · 1,840.40 บาท`)).toBeVisible();
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await expect(row).toContainText(`${sale} · 1,840.40`);
}

// The ledger record (DB.receipts) of a sale, from the app's data.
export const ledgerOf = (state: any, sale: string) => state.DB.receipts.find((r: any) => r.pkgSale && r.no === sale);
