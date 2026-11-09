import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S389 in the new system (tests/intentional-changes.json; as S144 for S22, decisions R7 "แก้ข้อ 4", X1,
// task 3.4): the audit line of the payment of MA-SA261000009 names the 90.00 the customer withheld (and the receipt
// it got, task 3.5). Every step and every other data change is S389's.
const S389 = 'S389-withholding-certificate-received-search-picture.spec.ts';
const got = (page: Page) => page.locator('div.sheet').filter({ has: page.getByRole('heading', { name: 'ได้รับหนังสือรับรอง (50 ทวิ) แล้ว' }) });

test('S448 ระบบใหม่: รับชำระที่ลูกค้าหัก ณ ที่จ่าย บันทึกการรับชำระบอกยอดที่ถูกหัก ค้นหาด้วย Enter กรองสถานะ แนบรูปหนังสือรับรองแล้วเอาออก ปิด แล้วบันทึกว่าได้รับ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S389, { app, page, testInfo });
  test.slow();
  await app.loginAsOwner();
  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000009' }).filter({ visible: true });
  await row.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000009' }).waitFor();
  await page.getByRole('button', { name: 'ยังไม่ได้รับ — ตามทีหลัง' }).click();
  await page.getByRole('button', { name: /เงินสดเต็มจำนวน$/ }).filter({ visible: true }).first().click();
  await golden.step('รับชำระ MA-SA261000009 ลูกค้าหัก ณ ที่จ่าย ยังไม่ได้รับหนังสือรับรอง');
  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: /^ยืนยันบันทึกรับชำระ/ }).click();
  await expect(page.getByText(/^บันทึกชำระ 1 ใบ รวม/)).toBeAttached();
  await golden.step('บันทึกรับชำระแล้ว');
  const legacy = JSON.parse(legacyStateChange(S389, 'pay'));
  legacy['DB.audit'].added[0].note = 'รับชำระ 3,676.40 บาท (เงินสด) · ลูกค้าหัก ณ ที่จ่าย 90.00 บาท · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว';
  await golden.stateChange('pay', before, { 'DB.audit': legacy['DB.audit'] });
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.4 ใบหัก ณ ที่จ่าย' }).click();
  const wht = page.getByRole('row').filter({ hasText: 'MA-SA261000009' }).filter({ visible: true });
  await expect(wht).toContainText('ยังไม่ได้รับ');
  await golden.step('4.4 ใบหัก ณ ที่จ่าย');
  const search = page.getByPlaceholder('ค้นหา เลขที่ใบเสร็จ / ลูกค้า / เลขผู้เสียภาษี + Enter');
  await search.fill('ไม่มีลูกค้านี้');
  await search.press('Enter');
  await expect(wht).toHaveCount(0);
  await golden.step('ค้นหาลูกค้าที่ไม่มี กด Enter');
  await search.fill('');
  await search.press('Enter');
  const state = page.getByRole('combobox').filter({ hasText: 'ยังไม่ได้รับหนังสือรับรอง' }).filter({ visible: true });
  await state.selectOption('ได้รับแล้ว');
  await expect(wht).toHaveCount(0);
  await golden.step('กรองเฉพาะที่ได้รับหนังสือรับรองแล้ว');
  await state.selectOption('ยังไม่ได้รับหนังสือรับรอง');
  await expect(wht).toHaveCount(1);
  await golden.step('กรองเฉพาะที่ยังไม่ได้รับ');

  // The certificate's window: a picture added and taken out, closed; opened again and saved.
  await wht.getByRole('button', { name: 'ได้รับแล้ว' }).click();
  await expect(got(page).getByLabel('วันที่ได้รับ')).toHaveValue('2026-10-13');
  await golden.step('หน้าต่างได้รับหนังสือรับรอง');
  const chooser = page.waitForEvent('filechooser');
  await got(page).getByRole('button', { name: 'แนบรูป' }).click();
  await (await chooser).setFiles('tests/assets/S389-wht-certificate.png');
  await expect(got(page).getByRole('img', { name: 'รูปหนังสือรับรอง' })).toBeVisible();
  await golden.step('แนบรูปหนังสือรับรอง');
  await got(page).getByRole('button', { name: 'เอารูปออก' }).click();
  await expect(got(page).getByRole('img', { name: 'รูปหนังสือรับรอง' })).toHaveCount(0);
  await golden.step('เอารูปออก');
  before = await app.state();
  await got(page).getByRole('button', { name: 'ปิด', exact: true }).last().click();
  await expect(got(page)).toBeHidden();
  await golden.step('ปิดหน้าต่างโดยไม่บันทึก');
  await golden.stateChange('close-certificate', before);
  await wht.getByRole('button', { name: 'ได้รับแล้ว' }).click();
  before = await app.state();
  await got(page).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText('บันทึกแล้ว — ได้รับหนังสือรับรอง')).toBeAttached();
  await golden.step('บันทึกว่าได้รับหนังสือรับรองแล้ว');
  await golden.stateChange('certificate-received', before);

  // 08 · ลูกหนี้: how many rows a page shows.
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ลูกหนี้ (ค้างรับ)', exact: true }).click();
  await golden.step('หน้าลูกหนี้');
  await page.getByRole('combobox').filter({ hasText: 'แสดง 100 รายการ' }).filter({ visible: true }).selectOption('แสดง 100 รายการ');
  await golden.step('แสดง 100 รายการ');
  golden.done();
});
