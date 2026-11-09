import { test, expect } from '../support/test';

// Parts of 05 ข้อมูลผู้ขาย and the product window no scenario used (docs/BEHAVIORS.md): "+ เพิ่มผู้ขาย" (ประเภทผู้ขาย,
// ชำระเงินสด, เลือกทุกหมวด / ล้างที่เลือก, ปิด), "ค้นหาข้อมูล"; in the product window the brand list ("+ เพิ่มแบรนด์",
// Enter in the new brand box, choosing a brand); "บัตรสินค้า", which names the vendors of the product's category,
// and a purchase in its history (รายละเอียดบิล, ปิด).
test('S343 เพิ่มผู้ขายเงินสดที่ขายอะไหล่ไฟฟ้า ตั้งแบรนด์ให้ไดชาร์จ แล้วดูบัตรสินค้าเห็นผู้ขายของหมวดและบิลซื้อ', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^05 ข้อมูลผู้ขาย/ }).click();
  await golden.step('ทะเบียนผู้ขาย');

  // เปิดแล้วปิดก่อน
  await page.getByRole('button', { name: '+ เพิ่มผู้ขาย' }).click();
  await golden.step('หน้าต่างเพิ่มข้อมูลผู้ขาย');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('กดปิด');

  await page.getByRole('button', { name: '+ เพิ่มผู้ขาย' }).click();
  await page.getByRole('button', { name: 'บุคคลธรรมดา', exact: true }).click();
  await page.getByRole('checkbox', { name: 'ชำระเงินสด' }).check();
  await golden.step('เลือกบุคคลธรรมดา ชำระเงินสด ช่องเครดิตเป็น 0 กรอกไม่ได้');
  await page.getByLabel('ชื่อผู้ขาย / ร้าน *').filter({ visible: true }).fill('นายสมศักดิ์ ไดนาโม');
  await page.getByLabel('เบอร์โทร', { exact: true }).filter({ visible: true }).fill('081-555-2020');
  await page.getByRole('button', { name: 'เลือกทุกหมวด' }).click();
  await golden.step('กดเลือกทุกหมวด');
  await page.getByRole('button', { name: 'ล้างที่เลือก' }).click();
  await golden.step('กดล้างที่เลือก');
  await page.getByRole('checkbox', { name: 'อะไหล่ไฟฟ้า', exact: true }).filter({ visible: true }).check();
  await golden.screen('vendor-filled');
  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('บันทึกผู้ขายนายสมศักดิ์ ไดนาโม หมวดอะไหล่ไฟฟ้า');
  await golden.stateChange('save-vendor', before);
  await page.getByPlaceholder('ค้นหา ชื่อผู้ขาย / เลขผู้เสียภาษี / เบอร์โทร + Enter').fill('ไดนาโม');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'นายสมศักดิ์ ไดนาโม' }).filter({ visible: true })).toBeVisible();
  await golden.step('ค้นหา "ไดนาโม" กดค้นหาข้อมูล');

  // แบรนด์ของไดชาร์จ
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByText('EL-101', { exact: true }).filter({ visible: true }).first().click();
  await golden.step('เปิดรายละเอียดสินค้า EL-101');
  const brandNew = page.getByPlaceholder('เพิ่มแบรนด์ใหม่ เช่น Denso');
  before = await app.state();
  await brandNew.fill('Bosch');
  await page.getByRole('button', { name: '+ เพิ่มแบรนด์' }).click();
  await app.settle();
  await golden.step('เพิ่มแบรนด์ Bosch ด้วยปุ่ม');
  await golden.stateChange('add-brand-button', before);
  before = await app.state();
  await brandNew.fill('Denso');
  await brandNew.press('Enter');
  await app.settle();
  await golden.step('เพิ่มแบรนด์ Denso ด้วย Enter');
  await golden.stateChange('add-brand-enter', before);
  await page.getByLabel('แบรนด์สินค้า', { exact: true }).filter({ visible: true }).selectOption('Bosch');
  await golden.step('เลือกแบรนด์ Bosch');
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('บันทึกสินค้า EL-101 แบรนด์ Bosch');
  await golden.stateChange('save-item-brand', before);

  await page.getByText('EL-101', { exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'บัตรสินค้า' }).click();
  await expect(page.getByText(/นายสมศักดิ์ ไดนาโม/).filter({ visible: true })).toBeVisible();
  await golden.step('บัตรสินค้า EL-101 บอกผู้ขายหมวดอะไหล่ไฟฟ้า');
  await golden.screen('stock-card');
  await page.getByRole('row').filter({ hasText: 'MA-RC261000001' }).filter({ hasText: 'บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด' }).filter({ visible: true }).click();
  await golden.step('กดบิลซื้อ MA-RC261000001 ในประวัติ เปิดรายละเอียดบิล');
  await page.getByRole('heading', { name: /^ใบรับสินค้า MA-RC261000001/ }).locator('xpath=ancestor::div[.//button][1]')
    .getByRole('button', { name: 'ปิด', exact: true }).click();
  await golden.step('ปิดรายละเอียดบิล');
});
