import { test, expect } from '../support/test';

// Stock count: the type-ahead box (typing, arrow keys, Enter, a click on a suggestion, leaving the box), "ค้นหาละเอียด"
// and "×" on a line; internal issue: "×" on a line; and "ค้นหาข้อมูล" of the vendor claim, internal issue and stock count
// registers. No scenario used them.
test('S325 ใบตรวจนับ: เพิ่มสินค้าจากช่องค้นหาและค้นหาละเอียด เอาออก บันทึก · ใบเบิกเอารายการออก · ค้นหาในทะเบียน', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  const kw = page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true });
  const line = (code: string) => page.getByRole('row').filter({ hasText: code }).filter({ has: page.getByRole('button', { name: '×' }) });

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'ตรวจนับสินค้า' }).click();
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await golden.step('ทะเบียนใบตรวจนับ กดค้นหาข้อมูล');
  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });

  // Type, move down with the arrow keys, Enter.
  await kw.click();
  await page.keyboard.type('BR-0');
  await golden.step('พิมพ์ BR-0 ในช่องค้นหาสินค้า');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await golden.step('กดลูกศรลง 2 ครั้ง ขึ้น 1 ครั้ง');
  await page.keyboard.press('Enter');
  await expect(line('BR-005')).toBeVisible();
  await golden.step('กด Enter เพิ่ม BR-005');

  // Click a suggestion.
  await page.keyboard.type('กรองแอร์');
  await page.getByText('AC-215').filter({ visible: true }).first().click();
  await expect(line('AC-215')).toBeVisible();
  await golden.step('คลิกเลือก AC-215 กรองแอร์ในห้องโดยสาร');

  // Leave the box: the list closes.
  await kw.click();
  await page.keyboard.type('EL-1');
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).click();
  await page.waitForTimeout(300);
  await golden.step('พิมพ์ EL-1 แล้วคลิกช่องหมายเหตุ รายการแนะนำปิด');

  // Detailed search.
  await page.getByRole('button', { name: 'ค้นหาละเอียด' }).click();
  await page.getByRole('row').filter({ hasText: 'SU-350' }).getByRole('button', { name: '+ เพิ่ม' }).click();
  await golden.step('ค้นหาละเอียด เพิ่ม SU-350');
  await page.locator('#mGrFind').getByRole('button').first().click();
  await expect(line('SU-350')).toBeVisible();

  // Remove BR-005, count AC-215 one short, save.
  await line('BR-005').getByRole('button', { name: '×' }).click();
  await expect(line('BR-005')).toHaveCount(0);
  await line('AC-215').getByRole('spinbutton').fill('18');
  await line('AC-215').getByRole('spinbutton').press('Tab');
  await golden.step('เอา BR-005 ออก กรองแอร์นับได้ 18');
  let before = await app.state();
  await page.getByRole('toolbar', { name: 'เครื่องมือ' }).filter({ visible: true }).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('button', { name: /^พิมพ์ใบตรวจนับ/ })).toBeVisible();
  await golden.step('บันทึกใบตรวจนับ');
  await golden.stateChange('save-count', before);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // Internal issue: a line put in and taken out again.
  await page.getByRole('button', { name: 'เบิกใช้ภายใน' }).click();
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await golden.step('ทะเบียนใบเบิก กดค้นหาข้อมูล');
  await page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' }).click();
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025 · น้ำมันเบรก DOT4/ }).click();
  const issueLine = page.getByRole('row', { name: /^1 BR-025 น้ำมันเบรก DOT4/ }).filter({ visible: true });
  await expect(issueLine).toBeVisible();
  await golden.step('ใบเบิกใหม่ เพิ่มน้ำมันเบรก');
  await issueLine.getByRole('button', { name: '×' }).click();
  await expect(issueLine).toHaveCount(0);
  await golden.step('กด × เอาน้ำมันเบรกออก');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // Vendor claim register.
  await page.getByRole('button', { name: 'เคลมผู้ขาย' }).click();
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await golden.step('ทะเบียนใบเคลมผู้ขาย กดค้นหาข้อมูล');
});
