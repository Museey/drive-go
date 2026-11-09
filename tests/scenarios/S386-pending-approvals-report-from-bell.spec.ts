import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// The report of documents waiting for approval (the bell at the top): no scenario opened it on the original, filtered
// it by kind with its cards, or opened a document from it (its number or "เปิดเอกสาร").
const report = (page: Page) => page.locator('div.sheet').filter({ has: page.getByRole('heading', { name: 'รายงานเอกสารรอการอนุมัติ' }) });
const openReport = (page: Page) => page.getByRole('button', { name: /^มีเอกสารรอการอนุมัติ 2 ใบ/ }).click();

test('S386 รายงานเอกสารรอการอนุมัติจากกระดิ่ง: กรองตามประเภท เปิดใบเสนอราคาจากเลขที่ และเปิดใบแจ้งหนี้จากปุ่มเปิดเอกสาร', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await golden.step('หน้าแรก กระดิ่งแสดง 2 ใบรออนุมัติ');
  await openReport(page);
  await expect(report(page).getByRole('row').filter({ hasText: 'MA-QT261000002' })).toContainText('12,476.20');
  await expect(report(page).getByRole('row').filter({ hasText: 'MA-QT261000002' })).toContainText('บริษัท ผักสดเดลิเวอรี่ จำกัด');
  await expect(report(page).getByRole('row').filter({ hasText: 'MA-IV261000001' })).toContainText('วิภา ศรีสมบูรณ์');
  await golden.step('รายงานเอกสารรอการอนุมัติ 2 ใบ');
  await golden.screen('pending-approvals');

  await report(page).getByRole('button', { name: /^ใบเสนอราคา/ }).click();
  await expect(report(page).getByText('2 ใบ · กรอง 1 ใบ')).toBeVisible();
  await expect(report(page).getByRole('row').filter({ hasText: 'MA-IV261000001' })).toHaveCount(0);
  await golden.step('กรองเฉพาะใบเสนอราคา');
  await report(page).getByRole('button', { name: /^ทั้งหมด/ }).click();
  await expect(report(page).getByRole('row').filter({ hasText: 'MA-IV261000001' })).toHaveCount(1);
  await golden.step('กลับเป็นทั้งหมด');

  // The quotation's number opens it.
  await report(page).getByText('MA-QT261000002', { exact: true }).click();
  await expect(report(page)).toBeHidden();
  await golden.step('กดเลขที่ MA-QT261000002 เปิดใบเสนอราคา');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // "เปิดเอกสาร" opens the invoice.
  await openReport(page);
  await report(page).getByRole('row').filter({ hasText: 'MA-IV261000001' }).getByRole('button', { name: 'เปิดเอกสาร' }).click();
  await expect(report(page)).toBeHidden();
  await golden.step('กดเปิดเอกสาร MA-IV261000001 เปิดใบแจ้งหนี้');
});
