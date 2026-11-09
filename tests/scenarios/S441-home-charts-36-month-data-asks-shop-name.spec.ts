import { test, expect } from '../support/test';
import { readFileSync } from 'node:fs';
import type { Locator, Page } from '@playwright/test';
import { legacyGolden } from '../support/legacy-golden';
import { confirmWithShopName } from '../support/whole-data';

// DRAFT
const S300 = 'S300-home-charts-periods-compare-pages.spec.ts';
const panel = (page: Page, title: string) =>
  page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

test('S441 ระบบใหม่: โหลดข้อมูลทดสอบ 36 เดือนโดยพิมพ์ชื่อร้านยืนยัน แล้วดูกราฟยี่ห้อรถและหมวดอะไหล่ เลือกเดือน กำหนดวัน เปรียบเทียบสองช่วง เปลี่ยนหน้า และตารางลูกหนี้คงค้าง', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S300, { app, page, testInfo });
  await app.loginAsOwner();
  const shopName = (await app.state()).DB.shop.name;
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'โหลดข้อมูลทดสอบ 36 เดือน' }).click();
  await confirmWithShopName(page, shopName, 'โหลดข้อมูล');
  await expect(page.getByText(/^โหลดข้อมูลทดสอบย้อนหลัง 36 เดือนแล้ว/)).toBeAttached();
  await expect(page.getByPlaceholder(`พิมพ์ชื่อร้าน ${shopName} เพื่อยืนยัน`)).toBeHidden();
  await app.settle();
  console.log('SIG', JSON.stringify(await app.signature()));
  await expect(page.getByRole('heading', { name: 'โหลดข้อมูลใหม่' })).toHaveCount(0);
  golden.skip('โหลดข้อมูลทดสอบ 36 เดือน กลับมาหน้าแรก');

  const shows = async (box: Locator, name: string) => {
    const got = (await box.innerText()).replace(/[ \t]+/g, ' ');
    await testInfo.attach(`${name}.txt`, { body: got });
    const want = readFileSync(new URL(`../golden/${S300}/${name}.txt`, import.meta.url), 'utf8');
    if (got !== want) console.log('TXTDIFF', name, '\n--- legacy\n' + want + '\n+++ new\n' + got);
    expect.soft(got, name).toBe(readFileSync(new URL(`../golden/${S300}/${name}.txt`, import.meta.url), 'utf8'));
  };

  const brand = panel(page, 'ยี่ห้อรถที่เข้าซ่อม');
  const [brMode, brPeriod, brPeriod2] = [0, 1, 2].map(i => brand.getByRole('combobox').nth(i));
  await expect(brand.getByText('12 ยี่ห้อ · หน้า 1/2')).toBeVisible();
  await brand.getByRole('button', { name: '2', exact: true }).click();
  await expect(brand.getByText('12 ยี่ห้อ · หน้า 2/2')).toBeVisible();
  await golden.step('กราฟยี่ห้อรถ กดหน้า 2');
  await shows(brand, 'brand-all-page-2');
  await brand.getByRole('button', { name: '‹' }).click();
  await expect(brand.getByText('12 ยี่ห้อ · หน้า 1/2')).toBeVisible();
  await golden.step('กราฟยี่ห้อรถ กด ‹ กลับหน้า 1');

  await brPeriod.selectOption({ label: 'เลือกเดือน' });
  await brand.locator('input[type="month"]:visible').fill('2026-09');
  await golden.step('กราฟยี่ห้อรถ เลือกเดือน ก.ย. 2569');
  await shows(brand, 'brand-september');

  await brPeriod.selectOption({ label: 'กำหนดวันเอง' });
  await brand.locator('input[type="date"]:visible').nth(0).fill('2026-01-01');
  await brand.locator('input[type="date"]:visible').nth(1).fill('2026-06-30');
  await golden.step('กราฟยี่ห้อรถ กำหนดวัน 1 ม.ค. – 30 มิ.ย. 2569');
  await shows(brand, 'brand-own-dates');

  await brMode.selectOption({ label: 'เปรียบเทียบ' });
  await brPeriod.selectOption({ label: 'ปีนี้' });
  await golden.step('กราฟยี่ห้อรถ เปรียบเทียบปีนี้กับเดือนที่แล้ว');
  await brPeriod2.selectOption({ label: 'เลือกเดือน' });
  await brand.locator('input[type="month"]:visible').fill('2025-10');
  await golden.step('กราฟยี่ห้อรถ เปรียบเทียบปีนี้กับเดือน ต.ค. 2568');
  await shows(brand, 'brand-compare-month');
  await brPeriod2.selectOption({ label: 'กำหนดวันเอง' });
  await brand.locator('input[type="date"]:visible').nth(0).fill('2025-01-01');
  await brand.locator('input[type="date"]:visible').nth(1).fill('2025-10-13');
  await golden.step('กราฟยี่ห้อรถ เปรียบเทียบปีนี้กับ 1 ม.ค. – 13 ต.ค. 2568');
  await shows(brand, 'brand-compare-dates');
  await brand.getByRole('button', { name: '›' }).click();
  await golden.step('กราฟยี่ห้อรถแบบเปรียบเทียบ กดหน้าถัดไป');
  await shows(brand, 'brand-compare-page-2');
  await golden.screen('brand-compare-page-2');

  const cat = panel(page, 'หมวดอะไหล่ที่ขายออก (มูลค่า)');
  const [catMode, catPeriod, catPeriod2] = [0, 1, 2].map(i => cat.getByRole('combobox').nth(i));
  await catPeriod.selectOption({ label: 'เลือกเดือน' });
  await cat.locator('input[type="month"]:visible').fill('2026-08');
  await golden.step('กราฟหมวดอะไหล่ เลือกเดือน ส.ค. 2569');
  await shows(cat, 'category-august');
  await catPeriod.selectOption({ label: 'กำหนดวันเอง' });
  await cat.locator('input[type="date"]:visible').nth(0).fill('2026-07-01');
  await cat.locator('input[type="date"]:visible').nth(1).fill('2026-09-30');
  await golden.step('กราฟหมวดอะไหล่ กำหนดวัน 1 ก.ค. – 30 ก.ย. 2569');
  await shows(cat, 'category-own-dates');

  await catMode.selectOption({ label: 'เปรียบเทียบ' });
  await catPeriod.selectOption({ label: 'ทั้งหมด' });
  await catPeriod2.selectOption({ label: 'เลือกเดือน' });
  await cat.locator('input[type="month"]:visible').fill('2026-09');
  await golden.step('กราฟหมวดอะไหล่ เปรียบเทียบทั้งหมดกับเดือน ก.ย. 2569');
  await shows(cat, 'category-compare-month');
  await catPeriod2.selectOption({ label: 'กำหนดวันเอง' });
  await cat.locator('input[type="date"]:visible').nth(0).fill('2025-01-01');
  await cat.locator('input[type="date"]:visible').nth(1).fill('2025-12-31');
  await golden.step('กราฟหมวดอะไหล่ เปรียบเทียบทั้งหมดกับปี 2568 (กำหนดวัน)');
  await shows(cat, 'category-compare-dates');
  await cat.getByRole('button', { name: '2', exact: true }).click();
  await golden.step('กราฟหมวดอะไหล่แบบเปรียบเทียบ กดหน้า 2');
  await shows(cat, 'category-compare-page-2');

  const ar = panel(page, 'ลูกหนี้คงค้าง (เปิดบิลแล้วยังไม่ชำระ)');
  await ar.getByRole('combobox').selectOption({ label: 'กำหนดเอง' });
  await ar.locator('input[type="date"]').nth(0).fill('2026-09-01');
  await ar.locator('input[type="date"]').nth(1).fill('2026-09-30');
  await golden.step('ลูกหนี้คงค้าง กำหนดช่วง 1–30 ก.ย. 2569');
  await shows(ar, 'receivables-september');
  await ar.getByRole('combobox').selectOption({ label: 'ทั้งหมด' });
  await expect(ar.locator('input[type="date"]').first()).toBeHidden();
  await ar.getByRole('button', { name: '2', exact: true }).click();
  await golden.step('ลูกหนี้คงค้าง ทั้งหมด กดหน้า 2');
  await shows(ar, 'receivables-page-2');

  const mm = panel(page, 'แจ้งเตือน Min / Max');
  await mm.getByRole('button', { name: '2', exact: true }).click();
  await golden.step('ตารางแจ้งเตือน Min/Max กดหน้า 2');
  await shows(mm, 'min-max-page-2');
  golden.done();
});
