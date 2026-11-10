import { test, expect } from '../support/test';

// 08 · ทะเบียนสินทรัพย์, เงินลงทุน / เงินสด and สุขภาพการเงิน: no scenario opened a saved asset or capital entry to look
// at it, added or removed a line in the asset window, changed its VAT, printed the asset register ("PDF": its own button is hidden) or the health report,
// or used the health page's shortcut "บันทึกเงินลงทุน / เงินสด".
test('S381 ทะเบียนสินทรัพย์ เงินลงทุน และสุขภาพการเงิน: เปิดดูรายการเดิม เพิ่ม/ลบบรรทัด เปลี่ยน VAT แล้วปิด พิมพ์ทะเบียนทรัพย์สินและรายงานสุขภาพการเงิน', async ({ app, page, golden }) => {
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
  await golden.screen('asset-register-printed');
  await page.emulateMedia({ media: 'screen' });
});
