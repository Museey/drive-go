import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';

// Expiry dates (stock-expiry module): the product form's "สินค้านี้มีวันหมดอายุ" tick and its "ดูล็อต / วันหมดอายุ"
// button, the lot window (search, "แสดงล็อตที่หมดแล้ว", edit a lot, close), the same button on the product card, the lot
// number and the expiry / manufacture date switch on a goods received line, the home card of products near or past
// expiry and its report (status, search, Excel, print, the product code that opens the lots). No scenario used them.
test('S322 ติดตามวันหมดอายุ: ตั้งที่สินค้า แก้ล็อต รับสินค้าพร้อมล็อตและวันหมดอายุ แล้วดูรายงานสินค้าใกล้หมดอายุ', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  const lots = page.locator('#mLots');
  const close = () => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // BR-025 brake fluid: track expiry, 24 months.
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').fill('BR-025');
  await page.keyboard.press('Enter');
  await page.getByText('BR-025', { exact: true }).click();
  await page.getByText('สินค้านี้มีวันหมดอายุ').click();
  await page.getByLabel('อายุสินค้า (เดือน)').fill('24');
  await golden.step('ติ๊กสินค้านี้มีวันหมดอายุ อายุ 24 เดือน');
  let before = await app.state();
  await page.locator('#mStock').getByRole('button', { name: 'บันทึก', exact: true }).last().click();
  await golden.step('บันทึกสินค้า');
  await golden.stateChange('track-expiry', before);

  // The lot window from the product form (opened again: saving closes it).
  await page.getByText('BR-025', { exact: true }).click();
  await page.getByRole('button', { name: 'ดูล็อต / วันหมดอายุ' }).click();
  await expect(lots.getByText('MA-RC261000001-23')).toBeVisible();
  await golden.step('หน้าต่างแสดงล็อตของ BR-025');
  await lots.getByRole('checkbox', { name: 'แสดงล็อตที่หมดแล้ว' }).check();
  await golden.step('ติ๊กแสดงล็อตที่หมดแล้ว');
  await lots.getByRole('textbox', { name: 'ค้นหาข้อมูล' }).fill('ไม่มีล็อตนี้');
  await page.keyboard.press('Enter');
  await expect(lots.getByText('ไม่พบล็อตตามคำค้น')).toBeVisible();
  await golden.step('ค้นหา "ไม่มีล็อตนี้" ไม่พบล็อต');
  await lots.getByRole('textbox', { name: 'ค้นหาข้อมูล' }).fill('MA-RC');
  await lots.getByRole('button', { name: 'ค้นหาข้อมูล' }).click();
  await expect(lots.getByText('MA-RC261000001-23')).toBeVisible();
  await golden.step('ค้นหา MA-RC กดค้นหาข้อมูล พบล็อตเดิม');
  await lots.getByRole('button', { name: /^แก้ไขล็อต/ }).click();
  await golden.step('เปิดหน้าต่างแก้ไขล็อต');
  await close();
  await golden.step('ปิดหน้าต่างแก้ไขล็อตโดยไม่บันทึก');
  await lots.getByRole('button', { name: /^แก้ไขล็อต/ }).click();
  await page.locator('#mLotEdit').getByLabel('หมายเลขล็อต').fill('DOT4-2609');
  await page.locator('#mLotEdit').getByLabel('วันหมดอายุ').fill('2026-11-30');
  before = await app.state();
  await page.locator('#mLotEdit').getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(lots.getByText('DOT4-2609')).toBeVisible();
  await golden.step('บันทึกล็อต DOT4-2609 หมดอายุ 30/11/2569');
  await golden.stateChange('edit-lot', before);
  await close();
  await golden.step('ปิดหน้าต่างแสดงล็อต');

  // The product card has the same button.
  await page.getByRole('button', { name: 'บัตรสินค้า' }).click();
  await page.locator('#mCard').getByRole('button', { name: 'ดูล็อต / วันหมดอายุ' }).click();
  await expect(lots.getByText('DOT4-2609')).toBeVisible();
  await golden.step('ดูล็อตจากบัตรสินค้า');
  await close();
  await close();
  await page.locator('#mStock').getByRole('button', { name: 'ปิด', exact: true }).click();

  // Goods received: 5 bottles with a lot number; the date switch back and forth, then an expiry date already past.
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-025');
  await page.getByText('BR-025 · น้ำมันเบรก DOT4').filter({ visible: true }).first().click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').nth(0).fill('5');
  await line.getByPlaceholder('อัตโนมัติ').fill('DOT4-2610');
  await line.getByRole('button', { name: 'วันผลิต', exact: true }).click();
  await golden.step('ใส่ล็อต DOT4-2610 แล้วเลือกระบุด้วยวันผลิต');
  await line.getByLabel('วันผลิต').fill('2024-09-01');
  await golden.step('วันผลิต 01/09/2567 ระบบคิดวันหมดอายุจากอายุ 24 เดือน');
  await line.getByRole('button', { name: 'วันหมดอายุ', exact: true }).click();
  await line.getByLabel('วันหมดอายุ').fill('2026-10-01');
  await golden.step('กลับไประบุวันหมดอายุ 01/10/2569 (หมดอายุแล้ว)');
  before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('อนุมัติใบรับสินค้า');
  await golden.stateChange('receive-lot', before);
  await close();

  // Home: the card of products near or past expiry opens the report.
  await page.getByText('Mr.DriveGo', { exact: true }).click();
  await page.getByRole('button', { name: /สินค้าใกล้หมดอายุ/ }).click();
  const rep = page.locator('#mExpRep');
  await expect(rep.getByText('DOT4-2610')).toBeVisible();
  await golden.step('รายงานสินค้าใกล้หมดอายุ / หมดอายุ จากการ์ดหน้าแรก');
  await rep.getByRole('combobox', { name: 'สถานะ' }).selectOption({ label: 'หมดอายุแล้ว' });
  await expect(rep.getByText('DOT4-2609')).toBeHidden();
  await golden.step('สถานะ: หมดอายุแล้ว');
  await rep.getByRole('combobox', { name: 'สถานะ' }).selectOption({ value: 'risk' });
  await rep.getByRole('textbox', { name: 'ค้นหาข้อมูล' }).fill('2609');
  await page.keyboard.press('Enter');
  await expect(rep.getByText('DOT4-2610')).toBeHidden();
  await golden.step('ค้นหา 2609 กด Enter');
  await rep.getByRole('textbox', { name: 'ค้นหาข้อมูล' }).fill('');
  await rep.getByRole('button', { name: 'ค้นหาข้อมูล' }).click();
  await golden.step('ล้างคำค้น กดค้นหาข้อมูล');
  await golden.screen('expiry-report');
  before = await app.state();
  const download = page.waitForEvent('download');
  await rep.getByRole('button', { name: 'Excel' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('สินค้าใกล้หมดอายุ   หมดอายุ 2026-10-13.xlsx');
  expect(readFileSync(await file.path()).length).toBeGreaterThan(0);
  await golden.step('ส่งออก Excel');
  await golden.stateChange('export-excel', before);
  before = await app.state();
  await rep.getByRole('button', { name: 'พิมพ์รายงาน' }).click();
  await golden.step('พิมพ์รายงาน');
  await golden.stateChange('print-report', before);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#printStage').getByText('DOT4-2610').first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await rep.getByText('BR-025').first().click();
  await expect(lots.getByText('DOT4-2610')).toBeVisible();
  await golden.step('กดรหัส BR-025 ในรายงาน เปิดหน้าต่างแสดงล็อต');
  await close();
  await close();
  await golden.step('ปิดรายงานสินค้าใกล้หมดอายุ');
});
