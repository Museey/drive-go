import { test, expect } from '../support/test';

// A parts kit sold through a quote and its stock cut, then paid by transfer with the slip attached in the sale window.
// Parts no other scenario used (docs/BEHAVIORS.md): Esc in the kit editor (asks before dropping the draft), the sales
// by category of a sale with a kit line (its amount is split over the kit's parts), and "แนบสลิป" of a transfer line in
// the sale window's "รับชำระ".
test('S368 ขายชุดอะไหล่ผ่านใบเสนอราคา ตัดสต็อก แล้วรับชำระด้วยเงินโอนพร้อมแนบสลิป', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  const editor = page.locator('#mPartsKit');

  // The kit: Esc asks before dropping the draft; back to it and save.
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'ชุดอะไหล่ซ่อมบำรุง' }).click();
  await page.getByRole('button', { name: '+ สร้างชุดอะไหล่' }).click();
  await editor.getByLabel('ชื่อชุดอะไหล่').fill('ชุดเปลี่ยนผ้าเบรกหน้า Revo');
  await editor.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001 · ผ้าเบรกหน้า Toyota Revo/ }).click();
  await editor.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025 · น้ำมันเบรก DOT4/ }).click();
  await editor.getByLabel(/ราคาขายต่อชุด/).fill('2500');
  await golden.step('สร้างชุดเปลี่ยนผ้าเบรกหน้า Revo: ผ้าเบรกหน้า + น้ำมันเบรก ราคา 2,500');
  await editor.getByLabel('ชื่อชุดอะไหล่').press('Escape');
  await expect(page.getByRole('heading', { name: 'ยังไม่ได้บันทึกชุดอะไหล่' })).toBeVisible();
  await golden.step('กด Esc ระบบถามก่อนทิ้งชุดที่ยังไม่บันทึก');
  await page.getByRole('button', { name: /กลับ/ }).filter({ visible: true }).last().click();
  let before = await app.state();
  await editor.getByRole('button', { name: 'บันทึกชุดอะไหล่' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('กลับไปแก้ไขแล้วบันทึกชุดอะไหล่');
  await golden.stateChange('save-kit', before);
  await editor.getByRole('button', { name: 'ปิด', exact: true }).first().click();

  // A quote with the kit, approved, then cut.
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill('ปรีชา');
  await custBox.press('Enter');
  const kitBox = page.getByPlaceholder('พิมพ์ชื่อชุด หรือรหัสอะไหล่ในชุด').filter({ visible: true });
  await kitBox.fill('ผ้าเบรก');
  await kitBox.press('Enter');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText('บันทึกใบเสนอราคา MA-QT261000005 แล้ว', { exact: false }).first()).toBeAttached();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'ตัดสต็อกสินค้า' }).filter({ visible: true })).toBeVisible();
  await golden.step('ใบเสนอราคาของปรีชา ทองสุข มีชุดอะไหล่ บันทึกและอนุมัติแล้ว');
  await page.getByRole('button', { name: 'ตัดสต็อกสินค้า' }).filter({ visible: true }).click();
  await golden.step('กดตัดสต็อกสินค้า เปิดใบตัดสต็อกพร้อมชุดอะไหล่');
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await golden.step('บันทึกใบตัดสต็อก MA-SA261000015 รอรับชำระ');
  await golden.stateChange('cut-kit', before);
  await page.getByRole('button', { name: 'คงหน้าตัดสต็อกขายเดิม' }).click();

  // "รับชำระ": transfer in full with the slip attached.
  await page.getByRole('button', { name: 'รับชำระ', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'โอนชำระเต็มจำนวน' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'แนบสลิป' }).filter({ visible: true }).click();
  await (await chooser).setFiles('tests/assets/S192-transfer-slip.png');
  await expect(page.getByRole('button', { name: 'เอาสลิปออก' }).filter({ visible: true })).toBeVisible();
  await golden.step('รับชำระ โอนเต็มจำนวน แนบสลิปการโอน');
  await golden.screen('slip-attached');
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).last().click();
  await expect(page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' })).toBeVisible();
  await app.settle();
  await golden.step('บันทึกรับชำระ');
  await golden.stateChange('pay-with-slip', before);

  // The home page: sales by category.
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();
  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  await app.settle();
  await golden.step('หน้าแรกหลังขายชุดอะไหล่');
});
