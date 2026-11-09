import { test, expect } from '../support/test';

test.use({ dataset: 'prox-trial' });

// ProX: the simulate buttons in the headers of "อาการเสีย → ใบเสนอราคา" and "งานฉุกเฉิน SOS" (S81 uses the ones of
// "คิวจองจาก BOOK"; no scenario pressed these, docs/BEHAVIORS.md).
test('S278 ProX: กดจำลองลูกค้าแจ้งอาการในแท็บอาการเสีย และจำลองเหตุฉุกเฉินในแท็บ SOS', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await page.getByRole('button', { name: 'อาการเสีย → ใบเสนอราคา' }).click();
  await golden.step('P1 แท็บอาการเสีย → ใบเสนอราคา');

  let before = await app.state();
  await page.getByRole('button', { name: '▶ จำลองลูกค้าแจ้งอาการ' }).click();
  await app.settle();
  await golden.step('กดจำลองลูกค้าแจ้งอาการ');
  await golden.stateChange('simulate-symptom', before);

  await page.getByRole('button', { name: 'งานฉุกเฉิน SOS' }).click();
  await golden.step('P1 แท็บงานฉุกเฉิน SOS');
  before = await app.state();
  await page.getByRole('button', { name: /^▶ จำลองเหตุฉุกเฉินใกล้อู่/ }).click();
  await app.settle();
  await golden.step('กดจำลองเหตุฉุกเฉินใกล้อู่');
  await golden.stateChange('simulate-sos', before);
  await expect(page.getByRole('button', { name: 'งานฉุกเฉิน SOS' })).toBeVisible();
});
