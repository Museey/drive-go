import { test, expect } from '../support/test';

// The register of 07 · เคลมสินค้าลูกค้า: no scenario used its date range, "แสดง … รายการ", "ค้นหาข้อมูล", Enter in the
// search box, or opened a saved claim from its number (docs/BEHAVIORS.md).
test('S347 ทะเบียนเคลมสินค้าลูกค้า: รับเคลมแล้วบันทึก กรองช่วงวันที่ จำนวนแถว ค้นหา และเปิดใบจากเลขที่', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เคลมสินค้าลูกค้า' }).click();
  await golden.step('ทะเบียนเคลมสินค้าลูกค้า (ยังไม่มีใบ)');

  await page.getByRole('button', { name: '+ รับเคลมสินค้าจากลูกค้า' }).click();
  await page.getByLabel('อ้างอิงใบเสร็จ / ใบแจ้งหนี้ที่ขาย').filter({ visible: true })
    .selectOption({ label: 'MA-SA261000003 · 10/10/2569 · ปรีชา ทองสุข' });
  await page.getByRole('button', { name: /^\+ AC-215/ }).click();
  const line = page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByPlaceholder('เช่น มีเสียง / รั่ว / ไม่ทำงาน').fill('กรองขาด');
  const before = await app.state();
  await page.getByRole('toolbar', { name: 'เครื่องมือ' }).filter({ visible: true }).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบรับเคลม' })).toBeVisible();
  await golden.step('รับเคลมกรองแอร์ AC-215 จากบิล MA-SA261000003 บันทึกได้ MA-CC261000001');
  await golden.stateChange('save-claim', before);
  await page.getByRole('toolbar', { name: 'เครื่องมือ' }).filter({ visible: true }).getByRole('button', { name: 'ปิด', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'MA-CC261000001' }).filter({ visible: true });
  await expect(row).toBeVisible();
  await golden.step('ทะเบียนมีใบ MA-CC261000001');

  await page.getByRole('combobox', { name: /ช่วงวันที่/ }).filter({ visible: true }).selectOption({ label: 'วันปัจจุบัน' });
  await golden.step('เลือกช่วงวันที่วันปัจจุบัน');
  await page.getByRole('combobox').filter({ has: page.getByRole('option', { name: '100 รายการ' }) }).filter({ visible: true }).selectOption({ label: '100 รายการ' });
  await golden.step('แสดง 100 รายการ');
  const search = page.getByPlaceholder(/^ค้นหา เลขที่/).filter({ visible: true });
  await search.fill('ไม่มีใบนี้');
  await search.press('Enter');
  await expect(row).toHaveCount(0);
  await golden.step('ค้นหา "ไม่มีใบนี้" กด Enter ไม่พบ');
  await search.fill('ปรีชา');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await expect(row).toBeVisible();
  await golden.step('ค้นหา "ปรีชา" กดค้นหาข้อมูล พบ MA-CC261000001');

  await row.getByText('MA-CC261000001', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบรับเคลม' })).toBeVisible();
  await golden.step('กดเลขที่ MA-CC261000001 เปิดใบรับเคลม');
});
