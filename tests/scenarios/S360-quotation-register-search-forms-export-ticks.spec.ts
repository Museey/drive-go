import { test, expect } from '../support/test';
import { readFileSync } from 'node:fs';

// Buttons of 03 ใบเสนอราคา no other scenario pressed (docs/BEHAVIORS.md): "ค้นหาข้อมูล" and Enter in the search box,
// "พิมพ์ฟอร์มเปล่า", "ดูทั้งหมด", the Excel button of the register, and the tick column (the header's box, a row's
// box, "ล้างการเลือก").
test('S360 ทะเบียนใบเสนอราคา: ค้นหา พิมพ์ฟอร์มเปล่า ดูทั้งหมด ส่งออก Excel และติ๊กเลือกแถว', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await golden.step('หน้า 03 ใบเสนอราคา');

  // Search: all dates, a name + Enter, then the button.
  await page.locator('#qOvDateMode').selectOption({ label: 'เลือกทั้งหมด' });
  const search = page.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า / ทะเบียนรถ + Enter');
  await search.fill('สมชาย');
  await search.press('Enter');
  const rows = page.locator('#qOvTbl tbody tr').filter({ visible: true });
  await expect(rows).toHaveCount(1);
  await golden.step('พิมพ์ "สมชาย" แล้วกด Enter เหลือใบเสนอราคาของสมชาย');
  await search.fill('');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await expect(rows).toHaveCount(4);
  await golden.step('ล้างคำค้นแล้วกดค้นหาข้อมูล เห็นทุกใบ');

  // "พิมพ์ฟอร์มเปล่า"
  await page.getByRole('button', { name: 'พิมพ์ฟอร์มเปล่า' }).click();
  await expect(page.getByRole('heading', { name: 'พิมพ์แบบฟอร์มเปล่าไปกรอกด้วยมือ' })).toBeVisible();
  await golden.step('กดพิมพ์ฟอร์มเปล่า เปิดหน้าต่างแบบฟอร์มเปล่า');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // "ดูทั้งหมด"
  await page.getByRole('button', { name: 'ดูทั้งหมด', exact: true }).filter({ visible: true }).click();
  await app.settle();
  await golden.step('กดดูทั้งหมด');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  await golden.step('ปิดรายการทั้งหมด');

  // Excel of the register.
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Excel' }).filter({ visible: true }).click();
  const file = await download;
  expect(readFileSync(await file.path()).length).toBeGreaterThan(0);
  await golden.step('กด Excel ดาวน์โหลดทะเบียนใบเสนอราคา');

  // Tick column: the header's box ticks the page, a row's box unticks one, "ล้างการเลือก" clears.
  await page.getByRole('checkbox', { name: 'เลือกทุกรายการที่แสดงในหน้านี้' }).filter({ visible: true }).click();
  await golden.step('ติ๊กช่องหัวตาราง เลือกทุกใบในหน้านี้');
  await rows.first().getByRole('checkbox', { name: 'เลือกรายการนี้' }).click();
  await golden.step('เอาติ๊กแถวแรกออก');
  await page.getByRole('button', { name: 'ล้างการเลือก' }).filter({ visible: true }).click();
  await golden.step('กดล้างการเลือก');
  await golden.screen('register');
});
