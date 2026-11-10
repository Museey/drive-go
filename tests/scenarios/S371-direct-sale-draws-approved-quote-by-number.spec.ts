import { test, expect } from '../support/test';

// The box "เลขที่ใบเสนอราคาที่อนุมัติแล้ว" of a new stock cut: no scenario chose a quote there (docs/BEHAVIORS.md).
// Choosing MA-QT261000004 draws the quote's customer and lines into the cut, which is then saved.
test('S371 ใบตัดสต็อกใหม่ เลือกใบเสนอราคาที่อนุมัติแล้วจากช่องเลขที่ แล้วบันทึกรอรับชำระ', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true }).click();
  await golden.step('ใบตัดสต็อกใหม่');

  const doc = page.getByPlaceholder('เลขที่ใบเสนอราคาที่อนุมัติแล้ว').filter({ visible: true });
  await doc.fill('QT261000004');
  await golden.step('พิมพ์ QT261000004 ในช่องเลขที่ใบเสนอราคา');
  await doc.press('Enter');
  await expect(page.getByText('รายการมาจากใบเสนอราคา MA-QT261000004', { exact: false }).filter({ visible: true })).toBeVisible();
  await app.settle();
  await golden.step('เลือก MA-QT261000004 ลูกค้าและรายการของใบเสนอราคาเข้ามาในใบตัดสต็อก');
  await golden.screen('cut-from-quote');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await golden.step('บันทึกใบตัดสต็อกรอรับชำระ');
  await golden.stateChange('cut-from-quote', before);
});
