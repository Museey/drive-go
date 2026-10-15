import { test } from '../support/test';

test.use({ dataset: 'prox-trial' });

test('S83 ออก DriveGo Coins จากใบเสร็จที่ชำระครบ แล้วรับชำระบิลค้างและสแกนซ้ำ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  const scan = page.getByRole('button', { name: '⟳ สแกนใบเสร็จชำระแล้ว → ออก Coins' });
  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await page.getByRole('button', { name: 'DriveGo Coins' }).click();
  await golden.step('แท็บ DriveGo Coins');

  let before = await app.state();
  await scan.click();
  await page.getByText('ออกใหม่ 4 ใบเสร็จ', { exact: true }).waitFor();
  await golden.step('หลังสแกนครั้งแรก');
  await golden.stateChange('scan-first', before);
  await golden.screen('coins-after-first-scan');

  // รับชำระบิลค้าง MA-SA261000003 ด้วยเงินสดเต็มจำนวน (เหมือน S01)
  await page.getByRole('button', { name: /Mr\.DriveGo/ }).click();
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'รับชำระ', exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).click();
  await golden.step('หลังรับชำระ MA-SA261000003 เงินสดเต็มจำนวน');
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();
  await golden.step('กลับไปหน้าค้นหาเอกสาร');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await page.getByRole('button', { name: 'DriveGo Coins' }).click();
  await golden.step('กลับมาแท็บ DriveGo Coins');

  before = await app.state();
  await scan.click();
  await page.getByText('ออกใหม่ 1 ใบเสร็จ', { exact: true }).waitFor();
  await golden.step('หลังสแกนครั้งที่สอง');
  await golden.stateChange('scan-after-payment', before);

  before = await app.state();
  await scan.click();
  await page.getByText('ไม่มีใบเสร็จชำระครบที่ยังไม่ได้ออก Coins', { exact: true }).waitFor();
  await golden.step('หลังสแกนครั้งที่สาม (ไม่มีใบใหม่)');
  await golden.stateChange('scan-nothing-new', before);
  await golden.screen('coins-after-third-scan');
});
