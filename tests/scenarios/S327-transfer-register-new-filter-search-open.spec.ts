import { test, expect } from '../support/test';

// The register of branch transfers (07 โอนสินค้าระหว่างสาขา): "+ สร้างใบโอนสินค้า" while there is one branch (a message)
// and with two, the date range drop-down, "แสดง", search by Enter and by "ค้นหาข้อมูล", and the document number that
// opens the transfer. S37 made a transfer but did not use the register's own controls.
test('S327 ทะเบียนโอนสินค้า: สร้างใบโอน กรองตามวันที่ ค้นหา แล้วเปิดใบโอนจากเลขที่', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();

  // One branch only: the button explains.
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'โอนสินค้าระหว่างสาขา' }).click();
  await page.getByRole('button', { name: '+ สร้างใบโอนสินค้า' }).click();
  await golden.step('กดสร้างใบโอนขณะมีสาขาเดียว ระบบบอกว่าต้องมีอย่างน้อย 2 สาขา');

  // As S37: add branch BN, transfer 5 brake pads.
  await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
  await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
  await page.getByPlaceholder('เช่น B2').fill('BN');
  await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'โอนสินค้าระหว่างสาขา' }).click();
  await page.getByRole('button', { name: '+ สร้างใบโอนสินค้า' }).click();
  await page.getByLabel('สาขาปลายทาง *').filter({ visible: true }).selectOption({ label: 'BN · สาขาบางนา' });
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001 · ผ้าเบรกหน้า Toyota Revo/ }).click();
  await page.getByRole('row').filter({ hasText: 'BR-001' }).filter({ visible: true }).getByRole('spinbutton').fill('5');
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'บันทึกและโอนสินค้า' }).click();
  const before = await app.state();
  await page.getByRole('button', { name: 'โอนสินค้า', exact: true }).click();
  await golden.step('เพิ่มสาขา BN แล้วโอนผ้าเบรกหน้า 5 ชิ้น');
  await golden.stateChange('transfer', before);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const row = page.getByRole('row').filter({ hasText: 'MA-MV261000001' }).filter({ visible: true });
  await expect(row).toBeVisible();

  // Date range, rows shown, search.
  await page.getByRole('combobox', { name: 'เลือกช่วงวันที่' }).filter({ visible: true }).selectOption({ label: 'วันปัจจุบัน' });
  await expect(row).toBeVisible();
  await golden.step('ช่วงวันที่: วันปัจจุบัน');
  await page.getByRole('combobox', { name: 'แสดง', exact: true }).filter({ visible: true }).selectOption({ label: '100 รายการ' });
  await golden.step('แสดง 100 รายการ');
  const search = page.getByPlaceholder(/^ค้นหา/).filter({ visible: true }).last();
  await search.fill('ไม่มีใบนี้');
  await search.press('Enter');
  await expect(row).toHaveCount(0);
  await golden.step('ค้นหา "ไม่มีใบนี้" กด Enter ไม่พบ');
  await search.fill('บางนา');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await expect(row).toBeVisible();
  await golden.step('ค้นหา "บางนา" กดค้นหาข้อมูล');

  // Open the transfer from its number.
  await row.getByText('MA-MV261000001').click();
  await golden.step('กดเลขที่ MA-MV261000001 เปิดใบโอน');
});
