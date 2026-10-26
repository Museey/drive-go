import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { licenceBar, settingsLicence } from '../support/licence';

// Replaces S55 in the new system (tests/intentional-changes.json, task 3.7, decision R12 = ค):
// the social security fields show the law's figures for October 2026 — ceiling 17,500, at most 875
// (the fixture's stored 15,000 / 750 are no longer read) — with a line saying so beside the panel's title.
// Saving the settings without touching them writes nothing new (the data change is S55's).
// Those two fields and the line are left out of the screens and checked here; every step, the rest
// of each screen and every data change are S55's.
// Task 3.15 (decisions 15.1, A2): the licence is DriveGo's, on the server: the shop cannot renew itself, so
// "ต่ออายุ +1 ปี" / "+2 ปี" are gone (hidden where they were, left out of the screens) and the dates read-only;
// S55's renewal step cannot happen.
const S55 = 'S55-shop-settings-logo-license.spec.ts';

test('S168 ระบบใหม่: ตั้งค่าองค์กร ไม่มีปุ่มต่ออายุ บันทึก อัปโหลดและลบโลโก้ ช่องประกันสังคมแสดงค่าตามกฎหมาย', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S55, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const tel = field('เบอร์โทรศัพท์'), web = field('เว็บไซต์ / เพจ (ถ้ามี)');
  await expect(tel).toHaveValue('02-555-1234, 081-555-1234');
  await expect(field('วันที่สิ้นสุดการใช้งาน (Expired Date)')).toHaveValue('2027-02-10');
  await expect(field('อายุการใช้งานคงเหลือ')).toHaveValue('120 วัน');
  const renew = page.locator('#v-setting button[onclick^="extendLic"]');   // hidden where they were (task 3.15)
  // S55's later screens show its renewal (10/02/2571, 485 days); here the licence stays the server's.
  const licenceAsServer = async () => [licenceBar(page), ...await settingsLicence(page)];
  await page.getByText('ตั้งค่าองค์กร · ข้อมูลผู้ใช้งานที่แสดงบนหัวเอกสาร').scrollIntoViewIfNeeded();
  await golden.step('หน้าตั้งค่าองค์กร');
  await golden.screen('settings-before', { mask: [renew] });

  await expect(page.getByRole('button', { name: 'ต่ออายุ +1 ปี' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '+2 ปี' })).toHaveCount(0);
  await expect(field('วันที่เริ่มใช้ระบบ')).not.toBeEditable();
  await expect(field('วันที่สิ้นสุดการใช้งาน (Expired Date)')).not.toBeEditable();
  golden.skip('พิมพ์เบอร์และเพจ แล้วกดต่ออายุ +1 ปี ช่องที่พิมพ์ไว้กลับเป็นค่าเดิม');   // no renewal (task 3.15)

  await tel.fill('02-555-1234, 081-555-1234, 095-123-4567');
  await web.fill('facebook.com/drivegoservice');
  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).first().click();
  await expect(web).toHaveValue('facebook.com/drivegoservice');
  await golden.step('พิมพ์ใหม่แล้วกดบันทึกการตั้งค่า');
  await golden.stateChange('save-setting', before);

  const logoBox = page.getByText('โลโก้กิจการ', { exact: true }).locator('..');
  before = await app.state();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'เลือกไฟล์โลโก้' }).click();
  await (await chooser).setFiles('tests/assets/S55-shop-logo.png');
  await expect(logoBox.getByRole('img')).toBeVisible();
  await logoBox.scrollIntoViewIfNeeded();
  await golden.step('เลือกไฟล์โลโก้ ระบบบันทึกทันที');
  await golden.stateChange('upload-logo', before);
  await expect(field('อัตราเงินสมทบประกันสังคม (%)')).toHaveValue('5');
  await expect(field('เพดานเงินสมทบต่อคน (บาท)')).toHaveValue('875');
  await expect(field('ฐานค่าจ้างต่ำสุด (บาท)')).toHaveValue('1650');
  await expect(field('ฐานค่าจ้างสูงสุด (บาท)')).toHaveValue('17500');
  await expect(page.getByText(/^ประกันสังคมตามกฎหมาย/)).toHaveText('ประกันสังคมตามกฎหมาย (ตั้งแต่ ม.ค. 2569): 5% · ฐาน 1,650 – 17,500 · หักสูงสุด 875 บาท — ระบบปรับให้เอง');
  await golden.screen('logo-uploaded', { mask: [field('เพดานเงินสมทบต่อคน (บาท)'), field('ฐานค่าจ้างสูงสุด (บาท)'), page.getByText(/^ประกันสังคมตามกฎหมาย/), ...await licenceAsServer()] });

  await page.getByRole('button', { name: 'ลบโลโก้' }).click();
  await expect(page.getByText('ลบโลโก้ออกจากระบบ?')).toBeVisible();
  await golden.step('กดลบโลโก้ ระบบถามยืนยัน');
  before = await app.state();
  // The bank rows on this page have "ลบ" buttons too: press the one on the confirm card.
  const card = page.locator('div').filter({ hasText: 'ลบโลโก้ออกจากระบบ?' }).filter({ has: page.getByRole('button', { name: 'ไม่ลบ' }) }).last();
  await card.getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(logoBox.getByText('ยังไม่มีโลโก้')).toBeVisible();
  await golden.step('หลังยืนยันลบโลโก้');
  await golden.stateChange('clear-logo', before);
  await golden.screen('logo-cleared', { mask: [field('เพดานเงินสมทบต่อคน (บาท)'), field('ฐานค่าจ้างสูงสุด (บาท)'), page.getByText(/^ประกันสังคมตามกฎหมาย/), ...await licenceAsServer()] });
  golden.done();
});
