import { test, expect } from '../support/test';

// Controls no other scenario used (docs/BEHAVIORS.md): in a new billing note "เลือกทั้งหมดที่เห็น", "ล้างที่เลือก", a
// bill's own tick box, and the search box at the top of the window (opens a saved billing note); in 4.1 "ใบเสนอราคาที่รอ
// ตัดสต็อก" a filter, Enter in the search box and ✕; and the "ปรับยอด" window of a stock cut (amount, reason, note,
// save, "ปิด").
test('S365 ใบวางบิลใหม่ เลือก/ล้างบิล ค้นเปิดใบเดิม · ตัวกรองหน้าต่างใบเสนอราคารอตัดสต็อก · ปรับลดยอดใบตัดสต็อก', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();

  // A new billing note: pick all, clear, one bill, then the search box opens the saved note.
  await page.getByRole('button', { name: /└ 4\.5 ใบวางบิล/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบวางบิลใหม่' }).click();
  await golden.step('ใบวางบิลใหม่');
  const bills = page.getByRole('row').filter({ hasText: 'MA-SA261000013' }).filter({ visible: true });
  await page.getByRole('button', { name: 'เลือกทั้งหมดที่เห็น' }).click();
  await expect(bills.getByRole('checkbox')).toBeChecked();
  await golden.step('กดเลือกทั้งหมดที่เห็น');
  await page.getByRole('button', { name: 'ล้างที่เลือก' }).click();
  await expect(bills.getByRole('checkbox')).not.toBeChecked();
  await golden.step('กดล้างที่เลือก');
  await bills.getByRole('checkbox').check();
  await golden.step('ติ๊กบิล MA-SA261000013');
  const open = page.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า').filter({ visible: true }).first();
  await open.fill('MA-BN');
  await golden.step('พิมพ์ MA-BN ในช่องค้นหาที่หัวหน้าต่าง รายการใบวางบิลเดิมขึ้น');
  await open.press('Enter');
  await app.settle();
  await golden.step('กด Enter เปิดใบวางบิลเดิม');
  await golden.screen('billing-opened');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await app.settle();

  // 4.1 "ใบเสนอราคาที่รอตัดสต็อก": a filter, Enter in the search box, then ✕.
  await page.getByRole('button', { name: '└ 4.1 ตัดสต็อกสินค้า' }).click();
  await page.getByRole('button', { name: /ใบเสนอราคาที่รอตัดสต็อก/ }).click();
  const pick = page.getByRole('heading', { name: 'เอกสารอ้างอิง' }).locator('xpath=ancestor::div[contains(@class,"sheet")][1]');
  await expect(pick).toBeVisible();
  await golden.step('หน้าต่างใบเสนอราคาที่รอตัดสต็อก');
  await pick.getByRole('combobox').first().selectOption({ label: 'เลือกทั้งหมด' });
  await golden.step('ช่วงวันที่: เลือกทั้งหมด');
  await pick.getByPlaceholder('ข้อมูล + เอ็นเทอร์').fill('QT261000004');
  await pick.getByPlaceholder('ข้อมูล + เอ็นเทอร์').press('Enter');
  await expect(pick.getByRole('row').filter({ hasText: 'MA-QT261000004' })).toBeVisible();
  await golden.step('พิมพ์ QT261000004 แล้วกด Enter');
  await pick.getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await golden.step('กด ✕ ปิดหน้าต่าง');

  // "ปรับยอด" of MA-SA261000003: decrease 64.00, reason, note, save, close.
  await page.locator('#scutDateMode').selectOption({ label: 'เลือกทั้งหมด' });
  await page.getByRole('row').filter({ hasText: 'MA-SA261000003' }).filter({ visible: true })
    .getByRole('button', { name: 'ปรับยอด' }).click();
  await expect(page.getByRole('heading', { name: 'ปรับยอด · MA-SA261000003' })).toBeVisible();
  await golden.step('หน้าต่างปรับยอด MA-SA261000003');
  await page.getByRole('button', { name: 'ปรับลด', exact: true }).click();
  await page.getByPlaceholder('0.00').filter({ visible: true }).fill('64');
  await page.getByRole('button', { name: 'ปัดเศษ', exact: true }).click();
  await page.getByPlaceholder('รายละเอียดเพิ่มเติม').fill('ปัดเศษให้ลูกค้า');
  await golden.step('ปรับลด 64 บาท เหตุผลปัดเศษ');
  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกการปรับยอด' }).click();
  await app.settle();
  await golden.step('บันทึกการปรับยอด');
  await golden.stateChange('adjust-cut', before);
  await page.getByRole('heading', { name: 'ปรับยอด · MA-SA261000003' }).locator('xpath=ancestor::div[contains(@class,"sheet")][1]')
    .getByRole('contentinfo').getByRole('button', { name: 'ปิด', exact: true }).click();
  await app.settle();
  await golden.step('กดปิดหน้าต่างปรับยอด');
});
