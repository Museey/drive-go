import { test, expect } from '../support/test';

test.use({ dataset: 'prox-trial' });

test('S88 รีเซ็ตข้อมูลสาธิต ProX หลังรับคิวจอง แล้วรับคิวเดิมซ้ำ ระบบผูกกับลูกค้าเดิมและเปิดใบเสนอราคาใบใหม่', async ({ app, page, golden }) => {
  // ระบบเดิมถามยืนยันการรีเซ็ตด้วยกล่อง confirm ของเบราว์เซอร์ ซึ่งกรรมการลำดับขั้นตอนมองไม่เห็น
  // จึงเก็บข้อความไว้ตรวจกับเฉลยแยก (confirm-dialogs.txt) และกด "ตกลง" ให้
  const confirms: string[] = [];
  page.on('dialog', dialog => { confirms.push(`${dialog.type()}: ${dialog.message()}`); dialog.accept(); });

  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await golden.step('เมนู P1 คิวจองจาก BOOK');

  const row = page.getByRole('row', { name: /8กด 5219/ });
  const accept = row.getByRole('button', { name: 'รับเข้าระบบ → เปิดใบเสนอราคา' });
  let before = await app.state();
  await accept.click();
  await expect(accept).toBeHidden();
  await golden.step('หลังรับคิวจอง 8กด 5219 ครั้งแรก');
  await golden.stateChange('accept-first', before);

  await page.getByRole('button', { name: '▶ จำลอง SOS' }).click();
  await page.getByRole('button', { name: 'คิวจองจาก BOOK' }).click();
  await golden.step('จำลอง SOS เพิ่ม แล้วกลับแท็บคิวจอง');

  before = await app.state();
  await page.getByRole('button', { name: '⟳ รีเซ็ตข้อมูลสาธิต ProX' }).click();
  await expect(accept).toBeVisible();
  await golden.step('หลังกดรีเซ็ตข้อมูลสาธิต ProX และยืนยัน');
  await golden.stateChange('reset', before);
  await golden.screen('queue-after-reset');

  before = await app.state();
  await accept.click();
  await expect(accept).toBeHidden();
  await golden.step('หลังรับคิวจอง 8กด 5219 อีกครั้ง');
  await golden.stateChange('accept-again', before);
  await golden.screen('queue-after-second-accept');

  await row.getByRole('button', { name: 'ดูเมนู 03 ›' }).click();
  await page.getByText('QO.69-10-13-02', { exact: true }).filter({ visible: true }).scrollIntoViewIfNeeded();
  await golden.step('กดดูเมนู 03 (ใบเสนอราคา 2 ใบจากคิวเดียวกัน)');
  await golden.screen('quotation-list');

  expect(confirms.join('\n') + '\n').toMatchSnapshot('confirm-dialogs.txt');
});
