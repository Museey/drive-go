import { test } from '../support/test';

test.use({ dataset: 'prox-trial' });

test('S82 มีเหตุฉุกเฉิน SOS ใกล้อู่ (จำลอง) แล้วอู่กดรับงานฉุกเฉิน', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await golden.step('เมนู P1 คิวจองจาก BOOK');

  let before = await app.state();
  await page.getByRole('button', { name: '▶ จำลอง SOS' }).click();
  const row = page.getByRole('row', { name: /1นบ 1389/ });
  await row.waitFor();
  await golden.step('หลังกดจำลอง SOS');
  await golden.stateChange('sim-sos', before);
  await golden.screen('sos-with-new-emergency');

  before = await app.state();
  await row.getByRole('button', { name: 'รับงานฉุกเฉิน' }).click();
  await row.getByText('รับแล้ว', { exact: true }).waitFor();
  await golden.step('หลังกดรับงานฉุกเฉิน 1นบ 1389');
  await golden.stateChange('accept-sos', before);
  await golden.screen('sos-after-accept');
});
