import { test, expect } from '../support/test';
import type { Locator, Page } from '@playwright/test';

// Home page (00) with the 36-month test data: the two charts "ยี่ห้อรถที่เข้าซ่อม" and "หมวดอะไหล่ที่ขายออก (มูลค่า)"
// with every period choice (a month, own dates), compare mode with its second period, and their page buttons;
// the receivables table "ลูกหนี้คงค้าง" with its own dates and page buttons; the Min/Max table's page buttons.
// No other scenario used these controls (docs/BEHAVIORS.md). What each chart shows is kept as text goldens.
const panel = (page: Page, title: string) =>
  page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

test('S300 หน้าแรกกับข้อมูล 36 เดือน: กราฟยี่ห้อรถและหมวดอะไหล่ เลือกเดือน กำหนดวัน เปรียบเทียบสองช่วง เปลี่ยนหน้า และตารางลูกหนี้คงค้าง', async ({ app, page, golden }) => {
  test.slow(); // about 15 MB of data is built first
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'โหลดข้อมูลทดสอบ 36 เดือน' }).click();
  await expect(page.getByRole('button', { name: 'ดูรายงานลูกหนี้' })).toBeVisible(); // back on the home page
  await app.settle();
  await golden.step('โหลดข้อมูลทดสอบ 36 เดือน กลับมาหน้าแรก');

  const shows = async (box: Locator, name: string) =>
    expect((await box.innerText()).replace(/[ \t]+/g, ' ')).toMatchSnapshot(`${name}.txt`);

  // ---- ยี่ห้อรถที่เข้าซ่อม (all time, 12 brands on 2 pages of 10)
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

  // ---- หมวดอะไหล่ที่ขายออก (มูลค่า)
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

  // ---- ลูกหนี้คงค้าง: own dates, then all and page 2
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

  // ---- แจ้งเตือน Min / Max: page 2
  const mm = panel(page, 'แจ้งเตือน Min / Max');
  await mm.getByRole('button', { name: '2', exact: true }).click();
  await golden.step('ตารางแจ้งเตือน Min/Max กดหน้า 2');
  await shows(mm, 'min-max-page-2');
});
