import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// "ตรวจสอบเอกสาร" (the audit trail): no scenario opened it, from a quotation's approval bar or from 08 · ผังบัญชี
// ("รายงานตรวจสอบการใช้งาน"), switched between one document and every document, filtered it, exported it or printed it.
const audit = (page: Page) => page.locator('div.sheet').filter({ has: page.getByRole('heading', { name: /^ตรวจสอบเอกสารย้อนหลัง/ }) });
const combo = (page: Page, option: string) => audit(page).getByRole('combobox').filter({ hasText: option });

test('S384 ตรวจสอบเอกสารย้อนหลัง: เปิดจากใบเสนอราคาและจากผังบัญชี สลับเฉพาะเอกสาร/ทุกเอกสาร กรอง ส่งออก CSV และพิมพ์รายงาน', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByText('MA-QT261000002', { exact: true }).filter({ visible: true }).first().click();
  await golden.step('เปิดใบเสนอราคา MA-QT261000002 (รออนุมัติ)');
  await page.getByRole('button', { name: 'ตรวจสอบเอกสาร' }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'ตรวจสอบเอกสารย้อนหลัง · MA-QT261000002' })).toBeVisible();
  await golden.step('ตรวจสอบเอกสาร MA-QT261000002');
  await golden.screen('audit-one-document');

  await audit(page).getByRole('button', { name: 'ทุกเอกสารในระบบ' }).click();
  await golden.step('ดูทุกเอกสารในระบบ');
  await combo(page, 'ทุกประเภทเอกสาร').selectOption('ใบเสนอราคา / อนุมัติซ่อม');
  await golden.step('กรองเฉพาะใบเสนอราคา');
  await combo(page, 'ทุกการกระทำ').selectOption('บันทึก / แก้ไข');
  await golden.step('กรองเฉพาะการบันทึก / แก้ไข');
  await combo(page, 'ผู้ใช้งานทุกคน').selectOption({ index: 1 });
  await golden.step('กรองผู้ใช้งานคนแรก');
  await combo(page, 'ทุกการกระทำ').selectOption('ทุกการกระทำ');
  await golden.step('กลับเป็นทุกการกระทำ');

  const download = page.waitForEvent('download');
  await audit(page).getByRole('button', { name: 'ส่งออก CSV' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('audit-log-2026-10-13.csv');
  const csv = readFileSync(await file.path(), 'utf8');
  expect(csv.startsWith('﻿"วัน-เวลา","ผู้ใช้งาน","การกระทำ","ประเภทเอกสาร","เลขที่เอกสาร","รายละเอียด"\n')).toBe(true);
  expect(csv).toContain('"ใบเสนอราคา / อนุมัติซ่อม"');
  expect(csv).not.toContain('"ใบเสร็จ / ใบกำกับภาษี"');
  await golden.step('ส่งออกประวัติเป็น CSV');

  await audit(page).getByRole('button', { name: 'พิมพ์รายงาน' }).click();
  const sheet = page.locator('#printStage');
  await expect(sheet).toContainText('รายงานตรวจสอบการใช้งานเอกสาร');
  await expect(sheet).toContainText('ทุกเอกสารในระบบ');
  await golden.step('พิมพ์รายงานตรวจสอบการใช้งาน');
  await audit(page).getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: /^ตรวจสอบเอกสารย้อนหลัง/ })).toBeHidden();
  await golden.step('ปิดหน้าต่างตรวจสอบเอกสาร');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The same report from the chart of accounts.
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  await page.getByRole('button', { name: 'รายงานตรวจสอบการใช้งาน' }).click();
  await expect(page.getByRole('heading', { name: /^ตรวจสอบเอกสารย้อนหลัง/ })).toBeVisible();
  await golden.step('เปิดรายงานตรวจสอบการใช้งานจากผังบัญชี');
  await audit(page).getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: /^ตรวจสอบเอกสารย้อนหลัง/ })).toBeHidden();
});
