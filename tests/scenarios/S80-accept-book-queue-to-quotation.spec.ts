import { test } from '../support/test';

test.use({ dataset: 'prox-trial' });

test('S80 รับคิวจองจากแอป BOOK (จำลอง) เข้าระบบ สร้างลูกค้าใหม่และเปิดใบเสนอราคาร่าง', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await golden.step('เมนู P1 คิวจองจาก BOOK');

  let before = await app.state();
  await page.getByRole('button', { name: '▶ จำลองลูกค้าจองผ่าน BOOK' }).click();
  const row = page.getByRole('row', { name: /3กท 1731/ });
  await row.waitFor();
  await golden.step('หลังกดจำลองลูกค้าจองผ่าน BOOK');
  await golden.stateChange('sim-book', before);
  await golden.screen('queue-with-new-booking');

  before = await app.state();
  await row.getByRole('button', { name: 'รับเข้าระบบ → เปิดใบเสนอราคา' }).click();
  await row.getByRole('button', { name: 'ดูเมนู 03 ›' }).waitFor();
  await golden.step('หลังกดรับเข้าระบบ → เปิดใบเสนอราคา');
  await golden.stateChange('accept-book', before);
  await golden.screen('queue-after-accept');

  await row.getByRole('button', { name: 'ดูเมนู 03 ›' }).click();
  await golden.step('กดดูเมนู 03');

  await page.getByText('QO.69-10-13-01', { exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดใบเสนอราคา QO.69-10-13-01');
  await golden.screen('quotation-from-booking');
});
