import { test } from '../support/test';

test.use({ dataset: 'prox-trial' });

test('S81 ลูกค้าแจ้งอาการเสียผ่านแอป (จำลอง) แล้วอู่กดเปิดใบเสนอราคาอัตโนมัติ 2 ใบ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await golden.step('เมนู P1 คิวจองจาก BOOK');

  let before = await app.state();
  await page.getByRole('button', { name: '▶ จำลองแจ้งอาการ' }).click();
  const simRow = page.getByRole('row', { name: /9กบ 1577/ });
  await simRow.waitFor();
  await golden.step('หลังกดจำลองแจ้งอาการ');
  await golden.stateChange('sim-inquiry', before);
  await golden.screen('inquiries-with-new-report');

  before = await app.state();
  await simRow.getByRole('button', { name: 'เปิดใบเสนอราคาอัตโนมัติ' }).click();
  await simRow.getByRole('button', { name: 'ดูเมนู 03 ›' }).waitFor();
  await golden.step('หลังเปิดใบเสนอราคาจากอาการของ 9กบ 1577');
  await golden.stateChange('quote-from-sim-inquiry', before);

  const fixtureRow = page.getByRole('row', { name: /2ขค 1846/ });
  before = await app.state();
  await fixtureRow.getByRole('button', { name: 'เปิดใบเสนอราคาอัตโนมัติ' }).click();
  await fixtureRow.getByRole('button', { name: 'ดูเมนู 03 ›' }).waitFor();
  await golden.step('หลังเปิดใบเสนอราคาจากอาการของ 2ขค 1846');
  await golden.stateChange('quote-from-fixture-inquiry', before);
  await golden.screen('inquiries-after-quotes');

  await simRow.getByRole('button', { name: 'ดูเมนู 03 ›' }).click();
  await golden.step('กดดูเมนู 03');

  await page.getByText('QO.69-10-13-01', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบเสนอราคา QO.69-10-13-01');
  await golden.screen('quotation-from-inquiry');
});
