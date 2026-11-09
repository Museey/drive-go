import { test, expect } from '../support/test';

// Buttons no other scenario pressed (docs/BEHAVIORS.md): "ส่งขออนุมัติ" and "ไม่อนุมัติ / ตีกลับ" of the approval bar,
// "บันทึก" of the quote window's side toolbar, the link to the original in a revision, and in the pop-up of a
// home-page row "เปิดในหน้าใบเสนอราคา" and "เปิดใบเสร็จรับเงินจากบิลนี้".
test('S273 ใบเสนอราคา: ส่งขออนุมัติ ตีกลับ ทำฉบับแก้ไขแล้วบันทึกที่แถบข้าง เปิดฉบับเดิมจากลิงก์ และปุ่มในป๊อปอัพของหน้าแรก', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  const card = (title: string) => page.getByRole('heading', { name: title, exact: true }).locator('xpath=ancestor::div[.//button][1]');
  const quote = (no: string) => page.getByText(no, { exact: true }).filter({ visible: true }).first();
  const closeQuote = () => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // A draft: "ส่งขออนุมัติ".
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await quote('MA-QT261000001').click();
  await golden.step('เปิดใบเสนอราคา MA-QT261000001 (ร่าง)');
  let before = await app.state();
  await page.getByRole('button', { name: 'ส่งขออนุมัติ', exact: true }).filter({ visible: true }).click();
  await golden.step('กดส่งขออนุมัติ ระบบเตือนว่ายังไม่ได้ใส่ค่าแรง');
  await page.getByRole('button', { name: 'ส่งขออนุมัติโดยไม่มีค่าแรง' }).click();
  await expect(page.getByRole('button', { name: 'ไม่อนุมัติ / ตีกลับ' }).filter({ visible: true })).toBeVisible();
  await golden.step('ส่งขออนุมัติแล้ว');
  await golden.stateChange('send-for-approval', before);
  await closeQuote();

  // A pending one: "ไม่อนุมัติ / ตีกลับ" with a reason.
  await quote('MA-QT261000002').click();
  await page.getByRole('button', { name: 'ไม่อนุมัติ / ตีกลับ' }).filter({ visible: true }).click();
  await golden.step('กดไม่อนุมัติ / ตีกลับ MA-QT261000002 ระบบถามเหตุผล');
  before = await app.state();
  const reject = card('ไม่อนุมัติ / ตีกลับเอกสาร MA-QT261000002');
  await reject.getByRole('textbox').fill('ราคาอะไหล่สูงเกิน ขอเสนอใหม่');
  await reject.getByRole('button', { name: 'ตีกลับเอกสาร', exact: true }).click();
  await golden.step('ตีกลับเอกสารแล้ว');
  await golden.stateChange('reject-quote', before);
  await closeQuote();

  // An approved one: a revision, saved with the side toolbar, then back to the original through its link.
  await quote('MA-QT261000003').click();
  await page.getByRole('button', { name: 'ฉบับแก้ไข' }).filter({ visible: true }).click();
  await card('ทำฉบับแก้ไข MA-QT261000003-R1').getByRole('button', { name: 'ทำฉบับแก้ไข', exact: true }).click();
  await golden.step('ทำฉบับแก้ไข MA-QT261000003-R1');
  before = await app.state();
  await page.getByRole('toolbar', { name: 'เครื่องมือเอกสาร' }).getByRole('button', { name: 'บันทึก', exact: true }).click();
  const back = page.getByRole('group', { name: 'เอกสารฉบับแก้ไข' }).getByRole('row').filter({ hasText: 'แก้ไขเป็นฉบับใหม่' })
    .getByText('MA-QT261000003', { exact: true });
  await expect(back).toBeVisible();
  await golden.step('บันทึกฉบับแก้ไขด้วยปุ่มบันทึกที่แถบข้าง');
  await golden.stateChange('save-revision', before);
  await back.click();
  await app.settle();
  await golden.step('กดเลขฉบับเดิม MA-QT261000003 ในกรอบฉบับแก้ไข เปิดฉบับเดิม');
  await closeQuote();

  // Home page: a quote waiting to be billed opens a pop-up with links to the quote and to billing.
  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  const pend = page.getByRole('row').filter({ hasText: 'สมชาย ใจดี' }).filter({ visible: true }).first();
  await pend.click();
  await expect(page.getByRole('button', { name: 'เปิดในหน้าใบเสนอราคา' })).toBeVisible();
  await golden.step('กดแถวงานในหน้าแรก เปิดป๊อปอัพของใบเสนอราคา');
  await page.getByRole('button', { name: 'เปิดในหน้าใบเสนอราคา' }).click();
  await expect(page.getByRole('heading', { name: 'ใบเสนอราคา / ใบอนุมัติซ่อม', exact: true }).filter({ visible: true }).first()).toBeVisible();
  await golden.step('เปิดในหน้าใบเสนอราคา');
  await closeQuote();

  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  await pend.click();
  await page.getByRole('button', { name: 'เปิดใบเสร็จรับเงินจากบิลนี้' }).click();
  await app.settle();
  await golden.step('เปิดใบเสร็จรับเงินจากบิลนี้ ระบบเปิดหน้าต่างขาย');
  await closeQuote();

  // A bill in the home page's list of unpaid bills opens its stock-cut sale (the new sale flow is always on, so the
  // pop-up's "เปิดในหน้าใบเสร็จ" never shows: tools/unreachable.json).
  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  await page.getByRole('link', { name: 'MA-SA261000005' }).filter({ visible: true }).first().click();
  await expect(page.getByRole('heading', { name: 'ใบตัดสต็อกขายสินค้า MA-SA261000005' })).toBeVisible();
  await golden.step('กดเลข MA-SA261000005 ในหน้าแรก เปิดใบตัดสต็อกขายสินค้า');
});
