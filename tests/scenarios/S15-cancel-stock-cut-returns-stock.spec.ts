import { test, expect } from '../support/test';

test('S15 ยกเลิกใบตัดสต็อกที่รอชำระ ระบุเหตุผล แล้วสินค้าคืนเข้าสต๊อก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await golden.step('รายการใบตัดสต็อกที่รอชำระ');

  // MA-SA261000003 ปรีชา ทองสุข 9,913.55 บาท: AC-204 คอมเพรสเซอร์แอร์ 1 + AC-215 กรองแอร์ 1
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบตัดสต็อก MA-SA261000003');

  await page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'ยกเลิกใบตัดสต็อก MA-SA261000003' })).toBeVisible();
  // The reason box has no label; it sits right under the message "ระบุเหตุผลที่ยกเลิก (จำเป็น)".
  await page.getByText('ระบุเหตุผลที่ยกเลิก').locator('xpath=following-sibling::input[1]').fill('ลูกค้ายกเลิกการซื้อ');
  await golden.step('ระบุเหตุผลการยกเลิก');
  await golden.screen('cancel-reason');

  const before = await app.state();
  await page.getByRole('button', { name: 'ยกเลิกและคืนสต๊อก' }).click();
  await expect(page.getByRole('button', { name: 'ทำฉบับแก้ไข' }).filter({ visible: true })).toBeHidden();
  await golden.step('หลังยกเลิกใบตัดสต็อก');
  await golden.stateChange('cancel-stock-cut', before);
  await golden.screen('after-cancel');
});
