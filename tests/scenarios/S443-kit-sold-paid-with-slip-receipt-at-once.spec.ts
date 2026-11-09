import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { LINK, fetchFile } from '../support/files';

// Replaces S368 in the new system (tests/intentional-changes.json, task 3.5 decisions R2, R8, F3 and task 3.11 decision
// R19-ค): the money received in the sale window has its receipt at once (MA-RE261000004, named in the audit line and the
// message) and the receipt window opens to be printed instead of the done card (S151); the slip attached to the transfer
// is kept by the server as a file and DB.paySlips holds its link instead of the picture (S193). Every other step, the
// screen and every other data change is S368's.
const S368 = 'S368-kit-sold-through-quote-cut-and-paid-with-slip.spec.ts';

test('S443 ระบบใหม่: ขายชุดอะไหล่ผ่านใบเสนอราคา ตัดสต็อก รับชำระด้วยเงินโอนแนบสลิป ได้ใบเสร็จทันทีและสลิปเก็บเป็นไฟล์', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S368, { app, page, testInfo });
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
  await app.settle();
  await golden.step('บันทึกใบเสนอราคาของปรีชา ทองสุข ที่มีชุดอะไหล่');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: 'ตัดสต็อกสินค้า' }).filter({ visible: true })).toBeVisible();
  await app.settle();
  await golden.step('อนุมัติใบเสนอราคา');
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
  // The receipt window instead of "บันทึกข้อมูลสำเร็จ" (S151).
  const rcpt = page.locator('#mSaleRcpt');
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await app.settle();
  expect(await app.signature()).toEqual({ page: ['04 ใบเสร็จรับเงิน / ใบกำกับภาษี 1 ›', '4.1 ตัดสต็อกสินค้า'],
    popups: ['ใบตัดสต็อกขายสินค้า MA-SA261000015', 'ใบเสร็จรับเงิน MA-RE261000004'],
    messages: ['รับชำระ 2,675.00 บาท · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว'] });
  golden.skip('บันทึกรับชำระ');
  await expect(rcpt.getByRole('row').filter({ hasText: 'เงินโอน' })).toContainText('2,675.00');
  await expect(rcpt.getByRole('button', { name: 'พิมพ์ใบเสร็จ (A4)' })).toBeVisible();
  // S368's change, with the receipt number on the payment and in the audit line, and the slip's link (S193) where
  // the legacy app kept the picture itself.
  const db = (await app.state() as any).DB;
  const pay = db.receipts.find((r: any) => r.no === 'MA-SA261000015').payments[0];
  const slip = db.paySlips[pay.payId];
  expect(slip).toEqual([{ url: expect.stringMatching(LINK), name: 'S192-transfer-slip.png', line: 1 }]);
  const legacy = JSON.parse(legacyStateChange(S368, 'pay-with-slip'));
  const pays = legacy['DB.receipts[MA-SA261000015].payments'];
  pays.added[0].reNo = 'MA-RE261000004';
  legacy['DB.audit'].added[0].note = 'รับชำระ 2,675.00 บาท (เงินโอน) · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว';
  const slipKey = Object.keys(legacy).find(k => k.startsWith('DB.paySlips.')) as string;
  expect(slipKey).toBe(`DB.paySlips.${pay.payId}`);
  expect(legacy[slipKey][1][0].url).toMatch(/^data:image\/jpeg;base64,/);
  await golden.stateChange('pay-with-slip', before, { 'DB.receipts[MA-SA261000015].payments': pays, 'DB.audit': legacy['DB.audit'],
    'DB.seq.MA-RE2610': [3, 4], [slipKey]: [null, slip] });
  // The slip is a file on the server, and the server's copy of the data holds its link.
  expect(await fetchFile(page, slip[0].url).then(f => [f.status, f.type])).toEqual([200, 'image/jpeg']);
  expect((await app.serverDB()).paySlips[pay.payId]).toEqual(slip);

  // The home page: sales by category.
  await rcpt.getByRole('button', { name: 'ปิด', exact: true }).first().click();
  await expect(rcpt).toBeHidden();
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();
  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  await app.settle();
  await golden.step('หน้าแรกหลังขายชุดอะไหล่');
  golden.done();
});
