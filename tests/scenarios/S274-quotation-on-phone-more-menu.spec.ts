import { test, expect } from '../support/test';

// A phone (390 px): the quote window shows a floating rail (✓ ขออนุมัติ · ▲ · ▼ · ⋯ เมนู) and "⋯ เมนู" opens a sheet
// with print and cancel. No other scenario pressed them (docs/BEHAVIORS.md).
test.use({ viewport: { width: 390, height: 844 } });

test('S274 ใบเสนอราคาบนมือถือ: กดขออนุมัติที่แถบลอย พิมพ์และยกเลิกเอกสารจากเมนู ⋯', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await golden.step('หน้าแรกบนมือถือ');

  const open = async (no: string) => {
    await page.getByRole('button', { name: '☰' }).click();
    await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
    await page.getByText(no, { exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByRole('button', { name: /^⋯\s*เมนู$/ })).toBeVisible();
  };
  // The sheet that "⋯ เมนู" opens (the window's toolbar behind it has a "ยกเลิกเอกสาร" too).
  const more = page.locator('div').filter({ has: page.getByRole('button', { name: 'พิมพ์ (ต้นฉบับ+สำเนา)', exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'ปิดหน้าต่าง', exact: true }) }).last();
  const sheet = (name: string) => more.getByRole('button', { name, exact: true });

  // MA-QT261000001 (draft): "✓ ขออนุมัติ" on the rail.
  await open('MA-QT261000001');
  await golden.step('เปิดใบเสนอราคา MA-QT261000001 บนมือถือ');
  await golden.screen('quote-on-phone');
  let before = await app.state();
  await page.getByRole('button', { name: /^✓\s*ขออนุมัติ$/ }).click();
  await golden.step('กด ✓ ขออนุมัติ ที่แถบลอย');
  const noLabour = page.getByRole('button', { name: 'ส่งขออนุมัติโดยไม่มีค่าแรง' });
  if (await noLabour.isVisible()) await noLabour.click();
  await app.settle();
  await golden.step('ส่งขออนุมัติแล้ว');
  await golden.stateChange('send-on-phone', before);

  // "⋯ เมนู" → print.
  await page.getByRole('button', { name: /^⋯\s*เมนู$/ }).click();
  await expect(sheet('พิมพ์ (ต้นฉบับ+สำเนา)')).toBeVisible();
  await golden.step('กด ⋯ เมนู เปิดแผ่นเมนูด้านล่าง');
  await golden.screen('more-sheet');
  before = await app.state();
  await sheet('พิมพ์ (ต้นฉบับ+สำเนา)').click();
  await golden.step('กดพิมพ์ (ต้นฉบับ+สำเนา) จากเมนู');
  await golden.stateChange('print-on-phone', before);

  // "⋯ เมนู" → cancel the document, with a reason.
  await page.getByRole('button', { name: /^⋯\s*เมนู$/ }).click();
  await sheet('ยกเลิกเอกสาร').click();
  await golden.step('กดยกเลิกเอกสารจากเมนู ระบบถามเหตุผล');
  before = await app.state();
  const ask = (title: string) => page.getByRole('heading', { name: title, exact: true }).locator('xpath=ancestor::div[.//button][1]');
  await ask('ยกเลิกใบเสนอราคา MA-QT261000001').getByRole('textbox').fill('ลูกค้ายกเลิกงานซ่อม');
  await ask('ยกเลิกใบเสนอราคา MA-QT261000001').getByRole('button', { name: 'ยกเลิกเอกสาร', exact: true }).click();
  await golden.step('ใส่เหตุผลแล้ว ระบบถามยืนยันอีกครั้ง');
  await ask('ยืนยันยกเลิกใบเสนอราคา MA-QT261000001').getByRole('button', { name: 'ยืนยันยกเลิก', exact: true }).click();
  await app.settle();
  await golden.step('ยกเลิกใบเสนอราคาแล้ว');
  await golden.stateChange('cancel-on-phone', before);
});
