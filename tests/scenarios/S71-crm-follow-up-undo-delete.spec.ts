import { test, expect } from '../support/test';

test('S71 บันทึกผลการติดตามลูกค้าพร้อมนัดครั้งถัดไป แล้วย้อนสถานะ และลบนัดครั้งถัดไป', async ({ app, page, golden }) => {
  test.slow(); // many steps; each one waits for the saved data to settle
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // Answers the confirm card with this title (rows behind it have buttons with the same names).
  const confirm = async (title: string, question: string, answer: string) => {
    const card = page.getByRole('heading', { name: title, exact: true }).locator('xpath=ancestor::div[.//button][1]');
    await expect(card).toContainText(question);
    await card.getByRole('button', { name: answer, exact: true }).click();
  };

  // Appointments to work on: from receipt MA-SA261000003 (ปรีชา ทองสุข).
  await page.getByRole('button', { name: /01 ลูกค้าสัมพันธ์/ }).click();
  await page.getByRole('button', { name: 'สร้างนัดจากใบเสร็จอัตโนมัติ' }).click();
  await page.getByRole('row').filter({ hasText: 'MA-SA261000003' }).filter({ has: page.getByRole('checkbox') })
    .getByRole('checkbox').check();
  await page.getByRole('button', { name: 'สร้างนัดหมาย 1 รายการ' }).click();
  await page.getByRole('button', { name: 'สร้างนัดหมาย', exact: true }).click();
  await page.getByLabel('แสดงนัดหมาย').selectOption({ label: 'ทั้งหมด' });
  const appt = (text: string) => page.getByRole('row').filter({ hasText: 'ปรีชา ทองสุข' }).filter({ hasText: text });
  await expect(appt('10/01/2570')).toBeVisible();
  await golden.step('สร้างนัดตรวจเช็กของปรีชา ทองสุข วันที่ 10/01/2570');

  await appt('10/01/2570').getByRole('button', { name: 'บันทึกติดตาม' }).click();
  await golden.step('ป๊อปอัพบันทึกผลการติดตาม');
  await page.getByLabel('ติดต่อได้ · ลูกค้าจะเข้ามา / นัดวันเข้ารับบริการ').check();
  await page.getByRole('button', { name: 'LINE', exact: true }).click();
  await page.getByLabel('ผู้ติดตาม').filter({ visible: true }).selectOption({ label: 'EMP005 · ฝนทิพย์ ต้อนรับ (ธุรการหน้าร้าน)' });
  await page.getByLabel('นัดครั้งถัดไป').filter({ visible: true }).fill('2026-10-20');
  await page.getByLabel('รายละเอียด / หมายเหตุ').filter({ visible: true }).fill('ลูกค้าสะดวกนำรถเข้ามาวันอังคารหน้า ช่วงเช้า');
  await golden.step('ผลติดต่อได้ ลูกค้าจะเข้ามา ทาง LINE โดยฝนทิพย์ นัดครั้งถัดไป 20/10/2569');
  await golden.screen('follow-up-form');

  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึกผลการติดตาม' }).click();
  await expect(appt('20/10/2569')).toBeVisible();
  await expect(appt('10/01/2570')).toContainText('ติดตามแล้ว');
  await golden.step('บันทึกผลแล้ว นัดเดิมเป็นติดตามแล้ว และมีนัดใหม่ 20/10/2569');
  await golden.stateChange('record-follow-up', before);
  await appt('10/01/2570').scrollIntoViewIfNeeded();
  await golden.screen('register-after-follow-up');

  await appt('10/01/2570').getByRole('button', { name: 'ย้อนสถานะ' }).click();
  await golden.step('กดย้อนสถานะ ระบบถามยืนยัน');
  before = await app.state();
  await confirm('ย้อนสถานะนัดหมาย', 'ยืนยันย้อนสถานะนัดหมายของ ปรีชา ทองสุข', 'ย้อนสถานะ');
  await expect(appt('10/01/2570').getByRole('button', { name: 'บันทึกติดตาม' })).toBeVisible();
  await golden.step('ย้อนสถานะแล้ว นัดเดิมกลับเป็นยังไม่ติดตาม นัดใหม่ยังอยู่');
  await golden.stateChange('undo-follow-up', before);

  await appt('20/10/2569').getByRole('button', { name: 'ลบ' }).click();
  await golden.step('กดลบนัดวันที่ 20/10/2569 ระบบถามยืนยัน');
  before = await app.state();
  await confirm('ลบนัดหมาย', 'ลบนัดหมายนี้?', 'ลบ');
  await expect(appt('20/10/2569')).toHaveCount(0);
  await golden.step('ลบนัดหมายแล้ว');
  await golden.stateChange('delete-appointment', before);
});
