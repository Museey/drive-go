import { test, expect } from '../support/test';
import { readFileSync } from 'node:fs';
import type { Locator, Page } from '@playwright/test';
import { legacyGolden } from '../support/legacy-golden';
import { confirmWithShopName } from '../support/whole-data';

// Replaces S300 in the new system (tests/intentional-changes.json). Two decisions change it:
// - task 3.2, decision F1 (as S133 replaces S76): loading the 36-month test data asks for the shop's name first;
// - the owner's decision of 2026-11-09 (frontend/CHANGES.md 145–146, S440): "ระบบขายแบบใหม่" stays on. The 36-month
//   loader replaces the receipts but, as in the legacy app, keeps the trial shop's stock cuts (MA-SA261000001–14 and
//   the revision MA-SA261000014-R1). The legacy app switched the sale flow off, so those cuts had no receipt records any
//   more and counted nowhere; here the switch stays on and their receipt records are made again as "เปิดใช้" does: 13
//   of them, dated 3–12 October 2569 (the cancelled MA-SA261000012 gets none, the revision shares MA-SA261000014's).
//   That is all that differs:
//   - the message says "ใบเสร็จ 2068 ใบ" (2,055 + 13);
//   - "หมวดอะไหล่ที่ขายออก" over "ทั้งหมด" counts the 13 October sales too: ค่าแรง / บริการ +7,500.00,
//     อะไหล่ช่วงล่าง +7,340.00, ระบบเบรก +9,730.33, อะไหล่แอร์ +21,255.00 (and their ▲ %); the periods compared with it
//     (ก.ย. 2569, the year 2568) and every other figure are S300's;
//   - "ลูกหนี้คงค้าง" over "ทั้งหมด" has 73 bills instead of 65 (8 pages), so its page 2 shows other bills, among them
//     MA-SA261000004 and MA-SA261000013;
//   - the brand charts, the month / own-dates figures and the Min/Max table are S300's (the trial cuts are not in
//     September, the first half of 2569 or 2568, and brand counts come from the 36-month jobs).
// Every step is S300's (the first one but for the receipt count); every text is compared with S300's golden, the four
// that differ after the changes above are applied to it.
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
  // S300's first step, with the 13 receipt records made again for the trial shop's stock cuts.
  const flow = JSON.parse(readFileSync(new URL(`../golden/${S300}/flow.json`, import.meta.url), 'utf8'));
  const { step, ...first } = flow[0];
  expect(first.messages[1]).toBe('โหลดข้อมูลทดสอบย้อนหลัง 36 เดือนแล้ว · ใบเสร็จ 2055 ใบ · ยอดขาย 2-5 ล้านบาท/เดือน');
  first.messages[1] = 'โหลดข้อมูลทดสอบย้อนหลัง 36 เดือนแล้ว · ใบเสร็จ 2068 ใบ · ยอดขาย 2-5 ล้านบาท/เดือน';
  expect(await app.signature()).toEqual(first);
  golden.skip(step);
  const db = (await app.state()).DB;
  expect(db.pkgSaleFlow).toMatchObject({ on: true });
  const made = db.receipts.filter((r: any) => r.migr && r.migr.made);
  expect(made.map((r: any) => r.no).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14].map(i => 'MA-SA2610000' + String(i).padStart(2, '0')));
  expect(made.every((r: any) => r.date >= '2026-10-03' && r.date <= '2026-10-12')).toBe(true);

  // What a panel shows: S300's text golden, with `changes` ([S300's text, the new text]) made to it first.
  const shows = async (box: Locator, name: string, changes: [string, string][] = []) => {
    let want = readFileSync(new URL(`../golden/${S300}/${name}.txt`, import.meta.url), 'utf8');
    for (const [from, to] of changes) {
      expect(want.split(from).length - 1, `"${from}" once in ${name}`).toBe(1);
      want = want.replace(from, to);
    }
    expect((await box.innerText()).replace(/[ \t]+/g, ' '), name).toBe(want);
  };
  // The 13 October sales in "ทั้งหมด" (see above).
  const labour: [string, string][] = [['13,494,090.00 บาท', '13,501,590.00 บาท'], ['8,530,915.00 บาท', '8,538,255.00 บาท']];

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
  // The picture also shows the top of "หมวดอะไหล่ที่ขายออก (มูลค่า)" over "เดือนนี้" (ต.ค. 2569), which counts the
  // October sales of the trial shop's stock cuts (see above).
  console.log('CATNOW', JSON.stringify(await page.locator('#chartCat').innerText()), JSON.stringify(await page.locator('#catPager').innerText()));
  await golden.screen('brand-compare-page-2', { mask: [page.locator('#chartCat')] });

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
  await shows(cat, 'category-compare-month', [...labour, ['▲ +2808.0%', '▲ +2809.6%'], ['▲ +7715.8%', '▲ +7722.5%']]);
  await catPeriod2.selectOption({ label: 'กำหนดวันเอง' });
  await cat.locator('input[type="date"]:visible').nth(0).fill('2025-01-01');
  await cat.locator('input[type="date"]:visible').nth(1).fill('2025-12-31');
  await golden.step('กราฟหมวดอะไหล่ เปรียบเทียบทั้งหมดกับปี 2568 (กำหนดวัน)');
  await shows(cat, 'category-compare-dates', [...labour, ['▲ +186.2%', '▲ +186.3%'], ['▲ +149.4%', '▲ +149.6%']]);
  await cat.getByRole('button', { name: '2', exact: true }).click();
  await golden.step('กราฟหมวดอะไหล่แบบเปรียบเทียบ กดหน้า 2');
  await shows(cat, 'category-compare-page-2', [['6,384,320.00 บาท', '6,394,050.33 บาท'], ['▲ +184.2%', '▲ +184.6%'],
    ['2,518,075.00 บาท', '2,539,330.00 บาท'], ['▲ +162.2%', '▲ +164.4%']]);

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
  // 73 bills (S300: 65): page 2 starts earlier and the page buttons are ‹ 1 2 3 4 … 8 ›.
  await shows(ar, 'receivables-page-2', [['65 บิล · หน้า 2/7', '73 บิล · หน้า 2/8'],
    ['เลขที่บิล ลูกค้า ครบกำหนด สถานะ ยอดค้าง รับชำระ\n', ['เลขที่บิล ลูกค้า ครบกำหนด สถานะ ยอดค้าง รับชำระ',
      'MA-SA261000004 - 11/10/2569 เกินกำหนด 2 วัน 10,058.00 รับชำระ',
      'RE.69-08-28-03 คลินิกสัตวแพทย์บางมด 12/10/2569 เกินกำหนด 1 วัน 17,836.90 รับชำระ',
      'RE.69-08-28-04 โรงเรียนกวดวิชาปัญญาเลิศ 12/10/2569 เกินกำหนด 1 วัน 42,083.50 รับชำระ',
      'RE.69-09-12-01 หจก. บางมดขนส่ง 12/10/2569 เกินกำหนด 1 วัน 166,808.20 รับชำระ', ''].join('\n')],
    ['70,821.60 รับชำระ\n', '70,821.60 รับชำระ\nMA-SA261000013 - 12/10/2569 เกินกำหนด 1 วัน 7,276.00 รับชำระ\n'],
    ['22,437.90 รับชำระ\n' + ['RE.69-09-04-02 ร้านซักรีดสะอาดใส 19/10/2569 รอรับชำระ 28,226.60 รับชำระ',
      'RE.69-09-05-01 ร้านซักรีดสะอาดใส 20/10/2569 รอรับชำระ 55,364.60 รับชำระ',
      'RE.69-09-06-01 โรงเรียนกวดวิชาปัญญาเลิศ 21/10/2569 รอรับชำระ 52,266.90 รับชำระ',
      'RE.69-09-06-02 คลินิกสัตวแพทย์บางมด 21/10/2569 รอรับชำระ 20,112.30 รับชำระ',
      'RE.69-09-21-01 สหกรณ์แท็กซี่บางขุนเทียน 21/10/2569 รอรับชำระ 140,068.35 รับชำระ', ''].join('\n'), '22,437.90 รับชำระ\n'],
    ['4\n5\n6\n7\n›', '4\n…\n8\n›']]);

  const mm = panel(page, 'แจ้งเตือน Min / Max');
  await mm.getByRole('button', { name: '2', exact: true }).click();
  await golden.step('ตารางแจ้งเตือน Min/Max กดหน้า 2');
  await shows(mm, 'min-max-page-2');
  golden.done();
});
