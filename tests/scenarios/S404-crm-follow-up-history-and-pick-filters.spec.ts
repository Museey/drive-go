import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';

// 01 ลูกค้าสัมพันธ์ with a second branch: "สร้างนัดจากใบเสร็จอัตโนมัติ" and its filters (date buttons, branch,
// search, page size, tick the whole page) then ยกเลิก; one appointment made and followed up; the result chip on the
// register opens the follow-up for editing (closed with ปิด); an appointment's "แก้ไข" form closed; "ดูประวัติการติดตาม"
// with its date buttons, search, page size, ล้างตัวกรอง, CSV and print, then ปิด.
test('S404 สร้างนัดจากใบเสร็จด้วยตัวกรองครบ บันทึกผลติดตาม แก้ผลจากป้ายผล และดูประวัติการติดตามพร้อมส่งออก CSV และพิมพ์', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();

  // A second branch, so the pick window has its branch filter.
  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('เพิ่มสาขา BN สาขาบางนา');

  await page.getByRole('button', { name: /01 ลูกค้าสัมพันธ์/ }).click();
  await golden.step('ลูกค้าสัมพันธ์');
  await page.getByPlaceholder('ค้นหา ชื่อลูกค้า / ทะเบียนรถ / เบอร์โทร + Enter').fill('ปรีชา');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await golden.step('ค้นหานัดหมายของปรีชา');
  await page.getByPlaceholder('ค้นหา ชื่อลูกค้า / ทะเบียนรถ / เบอร์โทร + Enter').fill('');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();

  // --- receipts without an appointment ---
  await page.getByRole('button', { name: 'สร้างนัดจากใบเสร็จอัตโนมัติ' }).click();
  const pick = page.locator('#mCrmPick');
  await expect(pick).toBeVisible();
  await golden.step('หน้าต่างสร้างนัดจากใบเสร็จ 30 วันล่าสุด');
  const pickRanges = pick.getByRole('group', { name: 'ช่วงวันที่ของใบเสร็จ' });
  await pickRanges.getByRole('button', { name: '90 วันล่าสุด' }).click();
  await golden.step('ใบเสร็จ 90 วันล่าสุด');
  await pickRanges.getByRole('button', { name: 'ทั้งหมด' }).click();
  await golden.step('ใบเสร็จทั้งหมด');
  await pick.getByLabel('สาขา').selectOption({ label: 'MA · สาขาหลัก' });
  await golden.step('เฉพาะสาขาหลัก');
  await pick.getByLabel('จำนวนที่แสดงต่อหน้า').selectOption('50');
  await golden.step('แสดง 50 ต่อหน้า');
  await pick.getByLabel('เลือกทั้งหน้านี้').check();
  await golden.step('ติ๊กเลือกทั้งหน้า');
  await pick.getByLabel('เลือกทั้งหน้านี้').uncheck();
  await pick.getByPlaceholder('เลขที่ใบเสร็จ / ชื่อลูกค้า / ทะเบียนรถ / เบอร์โทร').fill('MA-SA261000003');
  await golden.step('ค้นหาใบเสร็จ MA-SA261000003');
  await golden.screen('pick-filtered');
  let before = await app.state();
  await pick.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await expect(pick).toBeHidden();
  await golden.step('กดยกเลิก ไม่สร้างนัด');
  await golden.stateChange('pick-cancelled', before);

  // One appointment made from MA-SA261000003 and followed up.
  await page.getByRole('button', { name: 'สร้างนัดจากใบเสร็จอัตโนมัติ' }).click();
  await pick.getByRole('group', { name: 'ช่วงวันที่ของใบเสร็จ' }).getByRole('button', { name: 'ทั้งหมด' }).click();
  await pick.getByLabel('เลือกใบเสร็จ MA-SA261000003').check();
  await page.getByRole('button', { name: 'สร้างนัดหมาย 1 รายการ' }).click();
  await page.getByRole('button', { name: 'สร้างนัดหมาย', exact: true }).click();
  await page.getByLabel('แสดงนัดหมาย').selectOption({ label: 'ทั้งหมด' });
  const appt = page.getByRole('row').filter({ hasText: 'ปรีชา ทองสุข' }).filter({ hasText: '10/01/2570' });
  await expect(appt).toBeVisible();
  await golden.step('สร้างนัดตรวจเช็กของปรีชา ทองสุข');
  await appt.getByRole('button', { name: 'บันทึกติดตาม' }).click();
  const done = page.locator('#mCrmDone');
  await done.getByLabel('ติดต่อไม่ได้ / ไม่รับสาย').check();
  await done.getByLabel('รายละเอียด / หมายเหตุ').fill('โทร 2 ครั้ง ไม่รับสาย');
  before = await app.state();
  await done.getByRole('button', { name: 'บันทึกผลการติดตาม' }).click();
  await expect(done).toBeHidden();
  await golden.step('บันทึกผลติดต่อไม่ได้');
  await golden.stateChange('follow-up', before);

  // The result chip under "ติดตามแล้ว" opens the result for editing; another result picked, closed with ปิด.
  await appt.getByRole('button', { name: /ไม่รับสาย/ }).click();
  await expect(done.getByRole('heading', { name: 'แก้ไขผลการติดตาม' })).toBeVisible();
  await golden.step('กดป้ายผลการติดตาม เปิดแก้ไขผลการติดตาม');
  await done.getByLabel('ติดต่อได้ · ลูกค้าจะเข้ามา / นัดวันเข้ารับบริการ').check();
  await golden.step('เลือกผลติดต่อได้');
  before = await app.state();
  await done.getByRole('contentinfo').getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(done).toBeHidden();
  await golden.step('กดปิด ไม่แก้ผล');
  await golden.stateChange('edit-result-closed', before);

  // An appointment's own form, closed.
  await appt.getByRole('button', { name: 'แก้ไข', exact: true }).click();
  await expect(page.locator('#mCrm')).toBeVisible();
  await golden.step('ฟอร์มแก้ไขนัดหมาย');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await expect(page.locator('#mCrm')).toBeHidden();
  await golden.step('ปิดฟอร์มนัดหมาย');

  // --- follow-up history ---
  await page.getByRole('button', { name: 'ดูประวัติการติดตาม' }).click();
  const hist = page.locator('#mCrmHist');
  await expect(hist).toBeVisible();
  await golden.step('ประวัติการติดตามลูกค้า');
  const ranges = hist.getByRole('group', { name: 'ช่วงวันที่ที่บันทึกติดตาม' });
  for (const r of ['วันนี้', '7 วัน', 'เดือนนี้', 'ทั้งหมด']) {
    await ranges.getByRole('button', { name: r, exact: true }).click();
    await golden.step('ช่วง ' + r);
  }
  await hist.getByLabel('จำนวนที่แสดงต่อหน้า').selectOption('10');
  await golden.step('แสดง 10 ต่อหน้า');
  await hist.getByPlaceholder('ชื่อลูกค้า / ทะเบียนรถ / เบอร์โทร').fill('ปรีชา');
  await golden.step('ค้นหาปรีชา');
  await golden.screen('history-search');

  const download = page.waitForEvent('download');
  await hist.getByRole('button', { name: 'ส่งออก CSV' }).click();
  const csv = readFileSync(await (await download).path(), 'utf8');
  expect(csv).toContain('ปรีชา ทองสุข');
  expect(csv).toContain('โทร 2 ครั้ง ไม่รับสาย');
  await golden.step('ส่งออก CSV');

  await hist.getByRole('button', { name: 'พิมพ์รายงาน' }).click();
  await golden.step('กดพิมพ์รายงานประวัติการติดตาม');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#printStage').getByText('ปรีชา ทองสุข').first()).toBeVisible();
  await page.emulateMedia({ media: 'screen' });

  await hist.getByRole('button', { name: 'ล้างตัวกรอง' }).click();
  await expect(hist.getByPlaceholder('ชื่อลูกค้า / ทะเบียนรถ / เบอร์โทร')).toHaveValue('');
  await golden.step('ล้างตัวกรอง');
  await hist.getByRole('contentinfo').getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(hist).toBeHidden();
  await golden.step('ปิดประวัติการติดตาม');
});
