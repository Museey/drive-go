import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';

test.use({ dataset: 'prox-trial' });

// Replaces S83 in the new system (tests/intentional-changes.json, task 3.5,
// decision R2 and the owner's answer of 2026-10-25): the payment of
// MA-SA261000003 in the middle of the scenario has its receipt at once and the
// receipt window opens instead of "บันทึกข้อมูลสำเร็จ"; it is closed together
// with the sale window to get back to the document search. The Coins issued,
// every other step, screen and data change are S83's.
const S83 = 'S83-issue-coins-from-paid-receipts.spec.ts';

test('S155 ระบบใหม่: ออก DriveGo Coins จากใบเสร็จที่ชำระครบ รับชำระบิลค้างได้ใบเสร็จทันที แล้วสแกนซ้ำ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S83, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  const scan = page.getByRole('button', { name: '⟳ สแกนใบเสร็จชำระแล้ว → ออก Coins' });
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await page.getByRole('button', { name: 'DriveGo Coins' }).click();
  await golden.step('แท็บ DriveGo Coins');

  let before = await app.state();
  await scan.click();
  await page.getByText('ออกใหม่ 4 ใบเสร็จ', { exact: true }).waitFor();
  await golden.step('หลังสแกนครั้งแรก');
  await golden.stateChange('scan-first', before);
  await golden.screen('coins-after-first-scan');

  await page.getByRole('button', { name: /Mr\.DriveGo/ }).click();
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'รับชำระ', exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await expect(page.getByRole('heading', { name: /^ใบเสร็จรับเงิน MA-RE/ })).toBeVisible();
  await app.settle();
  const reNo = (await app.state()).DB.receipts.find((r: any) => r.no === 'MA-SA261000003').payments.at(-1).reNo;
  expect(reNo).toBe('MA-RE261000004');
  expect(await app.signature()).toEqual({ page: ['04 ใบเสร็จรับเงิน / ใบกำกับภาษี 1 ›', '4.1 ตัดสต็อกสินค้า'],
    popups: ['ใบตัดสต็อกขายสินค้า MA-SA261000003', 'ใบเสร็จรับเงิน ' + reNo],
    messages: ['รับชำระ 9,913.55 บาท · ใบเสร็จ ' + reNo + ' · ชำระครบแล้ว'] });
  golden.skip('หลังรับชำระ MA-SA261000003 เงินสดเต็มจำนวน');
  await page.locator('#mSaleRcpt').getByRole('button', { name: 'ปิด', exact: true }).last().click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('กลับไปหน้าค้นหาเอกสาร');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await page.getByRole('button', { name: 'DriveGo Coins' }).click();
  await golden.step('กลับมาแท็บ DriveGo Coins');

  before = await app.state();
  await scan.click();
  await page.getByText('ออกใหม่ 1 ใบเสร็จ', { exact: true }).waitFor();
  await golden.step('หลังสแกนครั้งที่สอง');
  await golden.stateChange('scan-after-payment', before);

  before = await app.state();
  await scan.click();
  await page.getByText('ไม่มีใบเสร็จชำระครบที่ยังไม่ได้ออก Coins', { exact: true }).waitFor();
  await golden.step('หลังสแกนครั้งที่สาม (ไม่มีใบใหม่)');
  await golden.stateChange('scan-nothing-new', before);
  await golden.screen('coins-after-third-scan');
  golden.done();
});
