import { test, expect } from '../support/test';

test.use({ dataset: 'franchise-trial' });

test('S90 สำนักงานใหญ่ดูยอดรวมทุกสาขา เลือกดูทีละสาขา เข้าดูสาขาแล้วกลับ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await expect(page.getByRole('button', { name: '📊 แดชบอร์ดรวมทุกสาขา' })).toBeVisible();
  await expect(page.getByText('ยอดขายรวมทุกสาขา · เดือนนี้').filter({ visible: true })).toBeVisible();
  await golden.step('HQ เข้าสู่ระบบ เห็นแดชบอร์ดรวมทุกสาขา');
  await golden.screen('hq-dashboard');
  const before = await app.state();

  // While not inspecting a branch, HQ may only use the HQ console and settings.
  await page.getByRole('button', { name: /00 Mr\.DriveGo/ }).click();
  await golden.step('HQ กดเมนู 00 ถูกปฏิเสธ');

  await page.getByRole('row').filter({ hasText: 'B001 · สาขาหลัก รังสิต' }).getByRole('button', { name: 'เข้าดูสาขา' }).click();
  await expect(page.getByRole('heading', { name: 'กำลังดูข้อมูลสาขา B001' })).toBeVisible();
  await expect(page.getByRole('button', { name: '← กลับ HQ Console' })).toBeVisible();
  await golden.step('เข้าดูสาขา B001');
  await golden.screen('inspect-b001-home');

  await page.getByRole('button', { name: '← กลับไปดูยอดรวมทุกสาขา' }).click();
  await expect(page.getByRole('heading', { name: 'ภาพรวมทั้งเครือ · ทุกสาขารวมกัน' })).toBeVisible();
  await expect(page.getByRole('button', { name: '← กลับ HQ Console' })).toBeHidden();
  await golden.step('กลับไปดูยอดรวมทุกสาขา');
  await golden.screen('hq-home-all-branches');

  // The branch picker has no label; it is the box listing "ทุกสาขารวมกัน".
  const picker = page.getByRole('combobox').filter({ has: page.getByRole('option', { name: /ทุกสาขารวมกัน/ }) });
  await picker.selectOption({ label: 'B002 · สาขาบางนา' });
  await expect(page.getByRole('heading', { name: 'ยอดขายสาขา B002' })).toBeVisible();
  await golden.step('เลือกดูเฉพาะสาขา B002');
  await golden.screen('hq-home-b002');

  await page.getByRole('button', { name: '← กลับไปดูภาพรวมทุกสาขา' }).click();
  await expect(page.getByRole('heading', { name: 'ภาพรวมทั้งเครือ · ทุกสาขารวมกัน' })).toBeVisible();
  await golden.step('กลับไปดูภาพรวมทุกสาขา');

  await page.getByRole('link', { name: 'B001 · สาขาหลัก รังสิต' }).click();
  await expect(page.getByRole('heading', { name: 'ยอดขายสาขา B001' })).toBeVisible();
  await golden.step('กดชื่อสาขา B001 ในตารางจัดอันดับ');

  await page.getByRole('button', { name: 'เข้าดูสาขานี้เต็มรูปแบบ' }).click();
  await expect(page.getByRole('heading', { name: 'กำลังดูข้อมูลสาขา B001' })).toBeVisible();
  await golden.step('เข้าดูสาขา B001 เต็มรูปแบบ');

  await page.getByRole('button', { name: '← กลับ HQ Console' }).click();
  await expect(page.getByRole('button', { name: '📊 แดชบอร์ดรวมทุกสาขา' })).toBeVisible();
  await expect(page.getByRole('button', { name: '← กลับ HQ Console' })).toBeHidden();
  await golden.step('กลับ HQ Console');
  await golden.screen('back-to-hq-console');
  await golden.stateChange('hq-browse', before);
});
