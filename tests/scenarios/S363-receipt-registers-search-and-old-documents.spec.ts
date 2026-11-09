import { test, expect } from '../support/test';

// Search controls of the 04 registers no other scenario used (docs/BEHAVIORS.md): "ค้นหาข้อมูล" of 4.1, 4.2, 4.3,
// both tabs of 4.4 and 4.6; Enter in the search box and the state / channel filters of 4.1; Enter in the search box of
// 4.6; and in "ดูเอกสารเดิม" (the old 4.1 register): Enter, "ค้นหาข้อมูล", "พิมพ์ฟอร์มเปล่า" and
// "+ สร้างใบเสร็จรับเงิน / ใบแจ้งหนี้" (which opens the sale window).
test('S363 ค้นหาในทะเบียน 4.1–4.6 และหน้าเอกสารเดิม: ปุ่มค้นหาข้อมูล Enter ตัวกรองสถานะ/ช่องทาง ฟอร์มเปล่า และสร้างใบเสร็จ', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await golden.step('หน้า 4.1 ตัดสต็อกสินค้า');
  const shown = () => page.locator('.view.on table tbody tr').filter({ visible: true });
  const find = () => page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).first();

  // 4.1: all dates, a number + Enter, state, channel, then the button.
  await page.locator('#scutDateMode').selectOption({ label: 'เลือกทั้งหมด' });
  const search = page.getByPlaceholder(/^ค้นหา เลขที่ \/ ลูกค้า \/ ใบเสนอ/).filter({ visible: true });
  await search.fill('MA-SA261000005');
  await search.press('Enter');
  await expect(shown().filter({ hasText: 'MA-SA261000005' })).toHaveCount(1);
  await golden.step('4.1 พิมพ์ MA-SA261000005 แล้วกด Enter');
  await search.fill('');
  await page.getByLabel(/สถานะ/).filter({ visible: true }).filter({ has: page.getByRole('option', { name: 'รอชำระ / ชำระบางส่วน' }) })
    .selectOption({ label: 'รอชำระ / ชำระบางส่วน' });
  await golden.step('4.1 เลือกสถานะ รอชำระ / ชำระบางส่วน');
  await page.locator('select').filter({ visible: true }).filter({ has: page.getByRole('option', { name: 'ขายหน้าร้าน' }) })
    .selectOption({ label: 'ขายหน้าร้าน' });
  await golden.step('4.1 เลือกช่องทาง ขายหน้าร้าน');
  await find().click();
  await golden.step('4.1 กดค้นหาข้อมูล');

  // 4.2, 4.3, 4.4 (both tabs): "ค้นหาข้อมูล".
  for (const sub of ['└ 4.2 ใบแจ้งหนี้', '└ 4.3 ใบเสร็จรับเงิน', '└ 4.4 ใบหัก ณ ที่จ่าย']) {
    await page.getByRole('button', { name: sub }).click();
    await find().click();
    await golden.step(sub.slice(2) + ' กดค้นหาข้อมูล');
  }
  await page.getByText('เราหักผู้ขาย', { exact: true }).filter({ visible: true }).click();
  await find().click();
  await golden.step('4.4 แท็บเราหักผู้ขาย กดค้นหาข้อมูล');

  // 4.6: Enter in the search box, then the button.
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  const taxSearch = page.locator('.view.on input[type="text"]').filter({ visible: true }).last();
  await taxSearch.fill('MA-TX261000002');
  await taxSearch.press('Enter');
  await golden.step('4.6 พิมพ์ MA-TX261000002 แล้วกด Enter');
  await taxSearch.fill('');
  await find().click();
  await golden.step('4.6 ล้างคำค้นแล้วกดค้นหาข้อมูล');

  // 4.3 → "ดูเอกสารเดิม": the old register.
  await page.getByRole('button', { name: '└ 4.3 ใบเสร็จรับเงิน' }).click();
  await page.getByRole('button', { name: /ดูเอกสารเดิม/ }).click();
  await golden.step('ดูเอกสารเดิม (ใบแจ้งหนี้ / ใบเสร็จรับเงินแบบเดิม)');
  const oldSearch = page.getByPlaceholder('ค้นหา เลขที่ / ชื่อลูกค้า + Enter').filter({ visible: true });
  await oldSearch.fill('สมชาย');
  await oldSearch.press('Enter');
  await golden.step('เอกสารเดิม พิมพ์ "สมชาย" แล้วกด Enter');
  await oldSearch.fill('');
  await find().click();
  await golden.step('เอกสารเดิม กดค้นหาข้อมูล');
  await page.getByRole('button', { name: 'พิมพ์ฟอร์มเปล่า' }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'พิมพ์แบบฟอร์มเปล่าไปกรอกด้วยมือ' })).toBeVisible();
  await golden.step('กดพิมพ์ฟอร์มเปล่า');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await page.getByRole('button', { name: '+ สร้างใบเสร็จรับเงิน / ใบแจ้งหนี้' }).click();
  await app.settle();
  await golden.step('กดสร้างใบเสร็จรับเงิน / ใบแจ้งหนี้ ระบบเปิดหน้าต่างขาย');
  await golden.screen('sale-window');
});
