import { test } from '../support/test';

// The credit bills in the trial data fall due between 03/11 and 08/11/2569,
// so on the usual test day (13/10) nothing is overdue. This scenario moves the
// clock to 20/11/2569 09:00 before the app opens: the same data, five weeks on.
test('S77 เวลาผ่านไปถึง 20/11/2569 บิลเงินเชื่อเลยกำหนด หน้าแรกขึ้นการ์ดลูกหนี้เกินกำหนด แล้วเปิดรายงานลูกหนี้', async ({ app, page, golden }) => {
  await page.clock.setFixedTime(new Date('2026-11-20T09:00:00+07:00'));
  await app.loginAsOwner();
  await golden.step('หน้าแรก วันที่ 20/11/2569');
  await golden.screen('home-overdue');

  const before = await app.state();
  await page.getByRole('button', { name: 'ดูรายงานลูกหนี้' }).filter({ visible: true }).click();
  await golden.step('รายงานลูกหนี้');
  await golden.stateChange('open-report', before);
  await golden.screen('ar-report');
});
