import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { settingsLicence } from '../support/licence';

// Replaces S405 in the new system (tests/intentional-changes.json), for the same two changes S168 has on this page:
// - R12 = ค (task 3.7): the social security fields show the law's figures (ceiling 17,500, at most 875) with a line
//   beside the panel's title;
// - 15.1, A2 (task 3.15): the licence is DriveGo's, on the server: its dates are read-only and "ต่ออายุ +1 ปี" /
//   "+2 ปี" are hidden where they were.
// Those are checked by their text and left out of the picture; every step, every data change and the rest of the
// screen are S405's.
const S405 = 'S405-shop-settings-banks-logo-opacity.spec.ts';

test('S457 ระบบใหม่: ตั้งค่าองค์กร เพิ่มบัญชีธนาคารใหม่ ลบบัญชีเดิม ปรับความเข้มลายน้ำ และเลือกไฟล์โลโก้ที่ไม่ใช่รูปภาพจะถูกเตือน (ประกันสังคมตามกฎหมาย ไม่มีปุ่มต่ออายุ)', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S405, { app, page, testInfo });
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await golden.step('ตั้งค่าองค์กร');

  await page.getByRole('button').filter({ hasText: /^บุคคลธรรมดา$/ }).filter({ visible: true }).click();
  await golden.step('กดบุคคลธรรมดา ช่องนิติบุคคลจางลง');
  await page.getByRole('button', { name: 'นิติบุคคล', exact: true }).filter({ visible: true }).click();
  await golden.step('กลับเป็นนิติบุคคล');

  // Not a picture: refused, no logo.
  let before = await app.state();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'เลือกไฟล์โลโก้' }).click();
  await (await chooser).setFiles('tests/assets/S405-broken-logo.png');
  await expect(page.getByText('อ่านไฟล์ภาพไม่ได้ ลองไฟล์ PNG หรือ JPG อีกครั้ง')).toBeVisible();
  await golden.step('เลือกไฟล์โลโก้ที่ไม่ใช่รูปภาพ');
  await golden.stateChange('broken-logo', before);

  const slider = page.getByRole('slider');
  await slider.fill('15');
  await expect(page.getByText('15%', { exact: true })).toBeVisible();
  await golden.step('ปรับความเข้มลายน้ำเป็น 15%');

  // Banks: a new Krungthai account, the Bangkok Bank one removed.
  await page.getByRole('button', { name: '+ เพิ่มบัญชีธนาคาร' }).click();
  const rows = page.locator('.bankrow');
  await expect(rows).toHaveCount(4);
  const added = rows.last();
  await added.getByRole('combobox').selectOption('ธนาคารกรุงไทย');
  await added.getByPlaceholder('เลขที่บัญชี').fill('987-6-54321-0');
  await added.getByPlaceholder('ชื่อบัญชี').fill('หจก.เอกหม้อน้ำ');
  await golden.step('เพิ่มบัญชีธนาคารกรุงไทย 987-6-54321-0');
  await rows.filter({ has: page.getByPlaceholder('เลขที่บัญชี').and(page.locator('[value="789-0-12345-6"]')) })
    .getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(rows).toHaveCount(3);
  await golden.step('ลบบัญชีธนาคารกรุงเทพ 789-0-12345-6');
  // As S168: the social security fields show the law's figures with a line saying so, and the licence is the server's
  // (read-only dates, no renew buttons): checked by their text, left out of the picture.
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await expect(field('เพดานเงินสมทบต่อคน (บาท)')).toHaveValue('875');
  await expect(field('ฐานค่าจ้างสูงสุด (บาท)')).toHaveValue('17500');
  const law = page.getByText(/^ประกันสังคมตามกฎหมาย/);
  await expect(law).toHaveText('ประกันสังคมตามกฎหมาย (ตั้งแต่ ม.ค. 2569): 5% · ฐาน 1,650 – 17,500 · หักสูงสุด 875 บาท — ระบบปรับให้เอง');
  await expect(page.getByRole('button', { name: 'ต่ออายุ +1 ปี' })).toHaveCount(0);
  await golden.screen('banks-edited', { mask: [field('เพดานเงินสมทบต่อคน (บาท)'), field('ฐานค่าจ้างสูงสุด (บาท)'), law, ...await settingsLicence(page)] });

  before = await app.state();
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('บันทึกการตั้งค่า');
  await golden.stateChange('save-settings', before);
  golden.done();
});
