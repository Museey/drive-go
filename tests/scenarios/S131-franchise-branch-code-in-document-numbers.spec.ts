import { test, expect } from '../support/test';

test.use({ dataset: 'franchise-trial' });

// New behaviour (task 3.2, decision R1-ข): a franchise branch's documents are
// numbered with the chain's branch code (B001-QT2610…), not with MA like
// every branch's data in the legacy app, so two branches of one chain never
// issue the same number. Documents numbered before keep their numbers.
test('S131 ระบบใหม่: สาขาแฟรนไชส์ออกใบเสนอราคา เลขที่ขึ้นต้นด้วยรหัสสาขา (B001-QT…) และเลขที่ของเอกสารเดิมไม่เปลี่ยน', async ({ app, page }) => {
  await app.open();
  await app.login('b001', '1234');
  const before = await app.state();

  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill('ปรีชา');
  await custBox.locator('..').getByText('ปรีชา ทองสุข').click();
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).click();
  const row = page.getByRole('row')
    .filter({ has: page.getByText('ค่าแรง', { exact: true }) })
    .filter({ has: page.getByRole('spinbutton') });
  await row.getByRole('textbox').fill('ค่าแรงเปลี่ยนแบตเตอรี่');
  await row.getByRole('spinbutton').nth(1).fill('350');
  await row.getByRole('spinbutton').nth(1).press('Tab');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('row').filter({ hasText: 'B001-QT261000001' }).filter({ visible: true })).toBeVisible();
  await app.settle();

  const after = await app.state();
  const nos = (s: any) => s.DB.quotes.map((q: any) => q.no);
  expect(nos(after)).toEqual([...nos(before), 'B001-QT261000001']);
  expect(nos(before).every((no: string) => no.startsWith('MA-QT2610'))).toBe(true);
  expect(after.DB.seq['B001-QT2610']).toBe(1);
  expect(after.DB.seq['MA-QT2610']).toBe(before.DB.seq['MA-QT2610']);
  expect(after.DB.audit.at(-1)).toMatchObject({ kind: 'quote', no: 'B001-QT261000001' });
});
