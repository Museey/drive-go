import { test, expect } from '../support/test';
import type { Locator } from '@playwright/test';
import { legacyGolden } from '../support/legacy-golden';

// Replaces S381 in the new system (tests/intentional-changes.json, decision R17 and the owner's answers 13.1–13.11 of
// 2026-10-26, task 3.13, as S210 / S214): depreciation is worked out by the days held, the current year up to today
// (accountant review 7.2, owner 2026-10-28). The printed asset register's three depreciation columns (this year,
// accumulated, net) and their totals are checked by their text (the figures of S214: 128,581.02 / 364,881.69 /
// 453,118.31) and left out of the picture. Every step, every data change and the rest of the screen are S381's.
const S381 = 'S381-assets-capital-health-open-print.spec.ts';

test('S455 ระบบใหม่: ทะเบียนสินทรัพย์ เงินลงทุน และสุขภาพการเงิน เปิดดูรายการเดิม เพิ่ม/ลบบรรทัด เปลี่ยน VAT แล้วปิด พิมพ์ทะเบียนทรัพย์สิน (ค่าเสื่อมตามจำนวนวัน) และรายงานสุขภาพการเงิน', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S381, { app, page, testInfo });
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await golden.step('หน้าสุขภาพการเงิน');
  // The window made narrower and back (the charts listen for it).
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: 1024, height: size.height });
  await expect(page.getByRole('heading', { name: 'เปรียบเทียบรายได้ ต้นทุน และกำไรรายเดือน' })).toBeVisible();
  await page.setViewportSize(size);
  await golden.step('ย่อหน้าต่างแล้วขยายกลับ');
  const sheet = page.locator('#printStage');
  const close = () => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The health report, printed; then the shortcut to the capital page.
  await page.getByRole('button', { name: 'พิมพ์รายงาน', exact: true }).filter({ visible: true }).click();
  await expect(sheet).toContainText('รายงานสุขภาพการเงินของกิจการ');
  await expect(sheet).toContainText('สรุปผลการดำเนินงาน');
  await golden.step('พิมพ์รายงานสุขภาพการเงิน');
  await page.getByRole('button', { name: 'บันทึกเงินลงทุน / เงินสด' }).click();
  await expect(page.getByText('25 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('กด "บันทึกเงินลงทุน / เงินสด" ไปหน้าเงินลงทุน / เงินสด');

  // A capital entry opened to look at, then closed.
  const scrap = page.getByRole('row').filter({ hasText: 'ขายเศษเหล็กและอะไหล่เก่า' }).filter({ visible: true });
  await scrap.getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByLabel('จำนวนเงิน (บาท) *', { exact: true }).filter({ visible: true })).toHaveValue('25000');
  await golden.step('เปิดรายการขายเศษเหล็ก');
  let before = await app.state();
  await close();
  await expect(page.getByLabel('จำนวนเงิน (บาท) *', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await golden.step('ปิดหน้าต่างเงินลงทุนโดยไม่บันทึก');
  await golden.stateChange('close-capital', before);

  // The asset register: the POS computer opened, a line added and removed, VAT changed, closed without saving.
  await page.getByRole('button', { name: '└ ทะเบียนสินทรัพย์', exact: true }).click();
  await golden.step('หน้าทะเบียนสินทรัพย์');
  const pos = page.getByRole('row').filter({ hasText: 'คอมพิวเตอร์ POS หน้าร้านพร้อมเครื่องพิมพ์' })
    .filter({ visible: true }).filter({ has: page.getByRole('button', { name: 'แก้ไข' }) });
  await pos.getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByRole('heading', { name: 'แก้ไขสินทรัพย์ · MA-FA260400001' })).toBeVisible();
  const lines = page.locator('#mAsset').getByRole('button', { name: '×' });
  await expect(lines).toHaveCount(5);
  await golden.step('เปิดคอมพิวเตอร์ POS MA-FA260400001');
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดสินทรัพย์' }).click();
  await expect(lines).toHaveCount(6);
  await golden.step('เพิ่มบรรทัดสินทรัพย์เป็น 6 บรรทัด');
  await lines.nth(5).click();
  await expect(lines).toHaveCount(5);
  await golden.step('ลบบรรทัดที่ 6 ออก');
  await page.getByLabel('ภาษีมูลค่าเพิ่ม').filter({ visible: true }).selectOption('ไม่มี VAT');
  await expect(page.locator('#mAsset').getByRole('row', { name: /^รวม 1 รายการ/ })).toContainText('32,000.00');
  await golden.step('เปลี่ยนเป็นไม่มี VAT');
  before = await app.state();
  await close();
  await expect(page.getByRole('heading', { name: 'แก้ไขสินทรัพย์ · MA-FA260400001' })).toBeHidden();
  await golden.step('ปิดหน้าต่างสินทรัพย์โดยไม่บันทึก');
  await golden.stateChange('close-asset', before);

  // "PDF" prints the asset register (the old "พิมพ์ทะเบียนทรัพย์สิน" button is hidden and leads here).
  before = await app.state();
  await page.getByRole('button', { name: /^PDF/ }).filter({ visible: true }).first().click();
  await expect(sheet).toContainText('ทะเบียนทรัพย์สินและค่าเสื่อมราคา');
  await expect(sheet).toContainText('MA-FA260400001');
  await golden.step('กด PDF พิมพ์ทะเบียนทรัพย์สิน');
  await golden.stateChange('print-register', before);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.scrollTo(0, 0));
  // By the day (as S210 / S214): this year's depreciation, accumulated and net of each asset, and their totals.
  const figures: [string, string, string, string][] = [
    ['MA-FA231100001', '28,991.62', '108,161.06', '76,838.94'],
    ['MA-FA240100001', '28,991.62', '101,171.56', '83,828.44'],
    ['MA-FA240400001', '11,753.27', '37,941.45', '37,058.55'],
    ['MA-FA240600001', '15,044.23', '44,683.27', '51,316.73'],
    ['MA-FA240900001', '6,581.76', '17,735.59', '24,264.41'],
    ['MA-FA241200001', '9,089.16', '21,259.44', '36,740.56'],
    ['MA-FA251000001', '22,723.13', '28,523.09', '116,476.91'],
    ['MA-FA260400001', '5,406.23', '5,406.23', '26,593.77'],
  ];
  const register = sheet.getByRole('table').filter({ hasText: 'เลขทะเบียน' });
  const moved: Locator[] = [];
  for (const [no, year, total, net] of figures) {
    const row = register.getByRole('row').filter({ hasText: no });
    await expect(row.getByRole('cell')).toHaveCount(10);
    await expect(row.getByRole('cell').nth(7)).toHaveText(year);
    await expect(row.getByRole('cell').nth(8)).toHaveText(total);
    await expect(row.getByRole('cell').nth(9)).toHaveText(net);
    moved.push(row.getByRole('cell').nth(7), row.getByRole('cell').nth(8), row.getByRole('cell').nth(9));
  }
  const sum = register.getByRole('row').filter({ hasText: 'รวม' }).last().getByRole('cell');
  await expect(sum).toHaveText(['รวม', '818,000.00', '128,581.02', '364,881.69', '453,118.31']);
  moved.push(sum.nth(2), sum.nth(3), sum.nth(4));
  await golden.screen('asset-register-printed', { mask: moved });
  await page.emulateMedia({ media: 'screen' });
  golden.done();
});
