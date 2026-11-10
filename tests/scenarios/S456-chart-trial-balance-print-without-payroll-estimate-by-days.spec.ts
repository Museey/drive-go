import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S383 in the new system (tests/intentional-changes.json). The printed trial balance has other rows and figures
// on purpose, so it cannot be S383's picture (the table is two rows shorter, which moves everything under it); its
// every row is checked here instead, against the legacy app's (read from it, 13/10/2569 on the fixture) with these
// changes:
// - R12, R13, F5, X2 (task 3.7, as S169): no payroll estimate from the staff list: cash 1010 is 935,644.00 on the debit
//   side (legacy 1,598,856.00 credit), and 2060 (16,100.00), 6010 (2,454,000.00) and 6011 (80,500.00) are gone (no
//   payroll period recorded);
// - R17, answers 13.1, 13.7, 13.9 (task 3.13, as S214): depreciation by the day up to today: 6130 128,581.02 and the
//   accumulated depreciation 1221, 1231, 1261, 1271, 1281 (the asset register's, S455), and the input VAT of the POS
//   computer in 1050 (2,240.00);
// - the totals follow (3,577,432.97 / 3,861,753.97; the trial balance is still worked out from totals with the
//   estimates' footnote, docs/NOTES.md, so it does not balance, as in the legacy app).
// Every step is S383's.
const S383 = 'S383-chart-trial-balance-csv-statements-print.spec.ts';
// The legacy app's printed rows, as they are changed.
const ROWS = [
  'วันที่พิมพ์ | 13/10/2569',
  'รหัสบัญชี | ชื่อบัญชี | หมวดบัญชี | เดบิต | เครดิต',
  '1010 | เงินสด | 1 · สินทรัพย์ | 935,644.00 | ',               // legacy: credit 1,598,856.00
  '1030 | ลูกหนี้การค้า | 1 · สินทรัพย์ | 43,577.95 | ',
  '1040 | สินค้าคงเหลือ (อะไหล่) | 1 · สินทรัพย์ | 935,410.00 | ',
  '1050 | ภาษีซื้อ | 1 · สินทรัพย์ | 2,240.00 | ',                 // new
  '1060 | ภาษีถูกหัก ณ ที่จ่าย | 1 · สินทรัพย์ | 90.00 | ',
  '1220 | เครื่องจักรและอุปกรณ์โรงงาน | 1 · สินทรัพย์ | 466,000.00 | ',
  '1221 | ค่าเสื่อมราคาสะสม - เครื่องจักร | 1 · สินทรัพย์ |  | 254,015.89',      // legacy 277,764.92
  '1230 | เครื่องมือช่าง | 1 · สินทรัพย์ | 203,000.00 | ',
  '1231 | ค่าเสื่อมราคาสะสม - เครื่องมือช่าง | 1 · สินทรัพย์ |  | 49,782.53',     // legacy 60,416.00
  '1260 | เฟอร์นิเจอร์และเครื่องตกแต่ง | 1 · สินทรัพย์ | 42,000.00 | ',
  '1261 | ค่าเสื่อมราคาสะสม - เฟอร์นิเจอร์ | 1 · สินทรัพย์ |  | 17,735.59',       // legacy 19,599.53
  '1270 | คอมพิวเตอร์และโปรแกรมคอมพิวเตอร์ | 1 · สินทรัพย์ | 32,000.00 | ',
  '1271 | ค่าเสื่อมราคาสะสม - คอมพิวเตอร์ | 1 · สินทรัพย์ |  | 5,406.23',         // legacy 7,999.75
  '1280 | ป้ายและงานตกแต่งร้าน | 1 · สินทรัพย์ | 75,000.00 | ',
  '1281 | ค่าเสื่อมราคาสะสม - ป้ายและงานตกแต่ง | 1 · สินทรัพย์ |  | 37,941.45',   // legacy 41,249.45
  '2030 | ภาษีขาย | 2 · หนี้สิน |  | 3,631.95',
  '2050 | ภาษีหัก ณ ที่จ่ายค้างนำส่ง | 2 · หนี้สิน |  | 1,355.00',
  '2100 | เงินกู้ยืม | 2 · หนี้สิน |  | 440,000.00',
  '3010 | ทุนของเจ้าของ / หุ้นส่วน | 3 · ส่วนของเจ้าของ |  | 3,000,000.00',
  '3020 | ถอนทุน / เงินใช้ส่วนตัว | 3 · ส่วนของเจ้าของ | 660,000.00 | ',
  '4010 | รายได้จากการขายอะไหล่ | 4 · รายได้ |  | 44,385.33',
  '4020 | รายได้ค่าแรงและบริการซ่อม | 4 · รายได้ |  | 7,500.00',
  '5010 | ต้นทุนอะไหล่และวัสดุที่ขาย | 5 · ต้นทุนขาย | 25,390.00 | ',
  '6030 | ค่าไฟฟ้า | 6 · ค่าใช้จ่ายในการขายและบริหาร | 28,500.00 | ',
  '6130 | ค่าเสื่อมราคา | 6 · ค่าใช้จ่ายในการขายและบริหาร | 128,581.02 | ',          // legacy 165,198.35
  'รวมทั้งสิ้น | 3,577,432.97 | 3,861,753.97',                                       // legacy 5,210,666.30 / 5,518,857.93
];
async function csvOf(page: Page, button: string) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: button, exact: true }).click();
  const file = await download;
  return { name: file.suggestedFilename(), text: readFileSync(await file.path(), 'utf8') };
}

test('S456 ระบบใหม่: ผังบัญชีและงบการเงิน ส่งออกผังบัญชีและงบทดลองเป็น CSV พิมพ์งบทดลอง (ไม่มีเงินเดือนประมาณการ ค่าเสื่อมตามจำนวนวัน) แล้วเปิดและพิมพ์งบการเงิน', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S383, { app, page, testInfo });
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  await golden.step('หน้าผังบัญชี');

  const coa = await csvOf(page, 'ส่งออก CSV');
  expect(coa.name).toBe('chart-of-accounts-2026-10-13.csv');
  expect(coa.text.startsWith('﻿"รหัสบัญชี","ชื่อบัญชี","หมวดบัญชี"\n')).toBe(true);
  expect(coa.text).toContain('"1010","เงินสด","1 · สินทรัพย์"');
  await expect(page.getByText('ส่งออกไฟล์ chart-of-accounts-2026-10-13.csv แล้ว')).toBeVisible();
  await golden.step('ส่งออกผังบัญชีเป็น CSV');

  const tb = await csvOf(page, 'ส่งออก CSV ให้สำนักงานบัญชี');
  expect(tb.name).toBe('trial-balance-2569.csv');
  expect(tb.text.startsWith('﻿"รหัสบัญชี","ชื่อบัญชี","หมวดบัญชี","เดบิต","เครดิต"\n')).toBe(true);
  expect(tb.text.split('\n').length).toBeGreaterThan(10);
  await golden.step('ส่งออกงบทดลองเป็น CSV ให้สำนักงานบัญชี');

  const sheet = page.locator('#printStage');
  await page.getByRole('button', { name: 'พิมพ์งบทดลอง' }).click();
  await expect(sheet).toContainText('งบทดลอง (Trial Balance)');
  await expect(sheet).toContainText('สำหรับปีบัญชีสิ้นสุดวันที่ 31 ธันวาคม 2569');
  await expect(sheet).toContainText('รวมทั้งสิ้น');
  await golden.step('พิมพ์งบทดลอง');
  // S383's picture of the printed sheet: its rows here (above), the rest of the sheet by its text.
  await page.emulateMedia({ media: 'print' });
  await expect.poll(() => sheet.evaluate(e => [...e.querySelectorAll('tr')]
    .map(r => [...(r as HTMLTableRowElement).cells].map(c => (c as HTMLElement).innerText.replace(/\s+/g, ' ').trim()).join(' | ')))).toEqual(ROWS);
  const text = (await sheet.innerText()).split('\n').map(l => l.trim()).filter(Boolean);
  expect(text.slice(0, 9)).toEqual(['Drivego Service', '123/45 ถ.พระราม 2 แขวงบางมด เขตจอมทอง กรุงเทพมหานคร 10150',
    'โทร. 02-555-1234, 081-555-1234 · service@ekmornam.co.th', 'เลขประจำตัวผู้เสียภาษี 0105545001234 · สำนักงานใหญ่',
    'รายงานภายใน', 'งบทดลอง (Trial Balance)', 'INTERNAL REPORT', 'วันที่พิมพ์\t13/10/2569', 'สำหรับปีบัญชีสิ้นสุดวันที่ 31 ธันวาคม 2569']);
  expect(text.slice(-5)).toEqual(['จัดทำตามผังบัญชีมาตรฐานกรมพัฒนาธุรกิจการค้า · ยอดเงินสดและเงินเดือนเป็นการประมาณการจากข้อมูลในระบบ ผู้ทำบัญชีควรปรับปรุงรายการก่อนปิดงบ',
    '( ................................................. )', 'ผู้จัดทำ', '( ................................................. )', 'ผู้ทำบัญชี']);
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: '└ งบการเงิน', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^งบกำไรขาดทุน \(สำหรับปีบัญชี/ })).toBeVisible();
  await golden.step('หน้างบการเงิน');
  await page.getByRole('button', { name: 'พิมพ์งบการเงิน' }).click();
  await expect(sheet).toContainText('งบกำไรขาดทุน');
  await expect(sheet).toContainText('งบแสดงฐานะการเงิน');
  await expect(sheet).toContainText('งบกระแสเงินสด (อย่างย่อ)');
  await golden.step('พิมพ์งบการเงิน');
  golden.done();
});
