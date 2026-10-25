import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S31 in the new system (tests/intentional-changes.json, task 3.4,
// decision R7-ข, owner's answers 2026-10-25): a settlement in "ชำระเงินเจ้าหนี้"
// gets one payment voucher MA-PV… (on the payment of every goods receipt it
// pays), written in the audit line. The settle window has a "หัก ณ ที่จ่าย"
// button beside "ล้างที่เลือก" (not used here; S149). Every other step,
// message, screen and data change is S31's.
const S31 = 'S31-pay-vendor-credit-gr.spec.ts';

test('S148 ระบบใหม่: จ่ายชำระเจ้าหนี้ค่าสินค้าเงินเชื่อเต็มจำนวนด้วยการโอนเงิน ได้ใบสำคัญจ่าย MA-PV', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S31, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').nth(0).fill('10');
  await line.getByRole('spinbutton').nth(1).fill('870');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('อนุมัติใบรับสินค้าเงินเชื่อ MA-RC261000002 แล้ว');

  await page.getByText('บัญชี - การเงิน', { exact: true }).click();
  await page.getByRole('button', { name: 'เจ้าหนี้ (ค้างจ่าย)' }).click();
  await golden.step('รายการเจ้าหนี้ค้างจ่าย');

  await page.getByRole('button', { name: '+ ชำระเงินเจ้าหนี้' }).click();
  await golden.step('หน้าชำระเงินเจ้าหนี้');

  await page.getByRole('button').filter({ hasText: 'หจก. ไทยพาร์ท ซัพพลาย' }).filter({ visible: true }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-RC261000002' }).check();
  await golden.step('เลือกผู้ขายและติ๊กใบรับสินค้า MA-RC261000002');

  await page.getByRole('button', { name: 'โอนเต็มจำนวน' }).click();
  await page.getByLabel('โอนจากบัญชีร้าน *').filter({ visible: true })
    .selectOption({ label: 'ธนาคารกสิกรไทย 123-4-56789-0 (หจก.เอกหม้อน้ำ)' });
  await page.getByLabel('เลขอ้างอิง / เลขที่สลิป').filter({ visible: true }).fill('KB2610130001');
  await golden.step('โอนเต็มจำนวนจากบัญชีกสิกรไทย');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึกจ่ายชำระ' }).click();
  await golden.step('หน้าตรวจก่อนบันทึก');
  const wht = page.getByRole('button', { name: 'หัก ณ ที่จ่าย', exact: true });
  await expect(wht).toBeVisible();
  await golden.screen('ap-confirm', { mask: [wht] });

  await page.getByRole('button', { name: 'ยืนยันบันทึกจ่ายชำระ ฿9,309.00' }).click();
  await golden.step('หลังยืนยันบันทึกจ่ายชำระ');
  await expect(page.getByText('ใบสำคัญจ่าย MA-PV261000001')).toBeVisible();
  const legacy = JSON.parse(legacyStateChange(S31, 'pay-ap'));
  legacy['DB.purchases[MA-RC261000002].payments'][1][0].pvNo = 'MA-PV261000001';
  legacy['DB.audit'].added[0].note = 'จ่ายเจ้าหนี้ 9,309.00 บาท (เงินโอน) · ใบสำคัญจ่าย MA-PV261000001 · ชำระครบแล้ว';
  await golden.stateChange('pay-ap', before, { 'DB.purchases[MA-RC261000002].payments': legacy['DB.purchases[MA-RC261000002].payments'],
    'DB.audit': legacy['DB.audit'], 'DB.seq.MA-PV2610': [null, 1] });

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('ปิดหน้าชำระเงินเจ้าหนี้');
  await golden.screen('ap-list-after');
  golden.done();
});
