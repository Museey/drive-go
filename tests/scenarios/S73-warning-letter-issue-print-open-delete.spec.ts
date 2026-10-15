import { test, expect } from '../support/test';

test('S73 ออกใบเตือนพนักงานครั้งที่ 2 แล้วพิมพ์ จากนั้นเปิดใบเตือนเก่าจากประวัติ และลบใบนั้น', async ({ app, page, golden }) => {
  test.slow(); // many steps; each one waits for the saved data to settle
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // Answers the confirm card with this title (rows behind it have buttons with the same names).
  const confirm = async (title: string, question: string, answer: string) => {
    const card = page.getByRole('heading', { name: title, exact: true }).locator('xpath=ancestor::div[.//button][1]');
    await expect(card).toContainText(question);
    await card.getByRole('button', { name: answer, exact: true }).click();
  };
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  const letter = (no: string) => page.getByRole('row').filter({ hasText: no }).filter({ visible: true });

  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('button', { name: /ใบเตือน$/ }).click();
  await expect(page.getByText('ยังไม่มีเลขที่', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('หน้าใบเตือน ฟอร์มใบใหม่ว่างอยู่');

  await select('พนักงานที่ถูกตักเตือน *').selectOption({ label: 'EMP003 · วิชัย ขยันงาน (ช่างซ่อมทั่วไป)' });
  await field('วันที่กระทำผิด').fill('2026-10-12');
  await select('ครั้งที่').selectOption({ label: 'ครั้งที่ 2 — ตักเตือนเป็นลายลักษณ์อักษร' });
  await select('เรื่องที่ตักเตือน *').selectOption({ label: 'ไม่ปฏิบัติตามระเบียบความปลอดภัย' });
  await field('ระเบียบ / ข้อบังคับที่ฝ่าฝืน').fill('ระเบียบความปลอดภัยในการทำงาน ข้อ 2');
  await field('รายละเอียดการกระทำผิด *').fill('ไม่สวมแว่นนิรภัยขณะเจียรจานเบรก หลังได้รับการตักเตือนด้วยวาจาแล้ว');
  await field('ผู้ออกใบเตือน (ผู้บังคับบัญชา)').fill('ศักดิ์ชัย มั่นคง');
  await field('ฝ่ายบุคคล / ผู้จัดการ').fill('มานะ บริหารเก่ง');
  await field('พยาน').fill('ประสิทธิ์ มือทอง');
  await golden.step('กรอกใบเตือนวิชัย ขยันงาน ครั้งที่ 2 เรื่องความปลอดภัย');
  await golden.screen('warning-form');

  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(letter('MA-WN261000001')).toContainText('วิชัย ขยันงาน');
  await golden.step('บันทึกแล้ว ได้เลขที่ MA-WN261000001');
  await golden.stateChange('save-warning', before);

  before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์', exact: true }).filter({ visible: true }).click();
  await golden.step('กดพิมพ์');
  await golden.stateChange('print-warning', before);
  // What the printer gets: the page as printed (only the document sheets).
  await page.emulateMedia({ media: 'print' });
  await golden.screen('warning-letter-printed');
  await page.emulateMedia({ media: 'screen' });

  before = await app.state();
  await letter('MA-WN250800001').getByRole('button', { name: 'เปิด', exact: true }).click();
  await expect(field('รายละเอียดการกระทำผิด *')).toHaveValue('ไม่ตัดระบบไฟแรงดันสูงก่อนถอดชิ้นส่วนรถ EV ตามคู่มือความปลอดภัย');
  await golden.step('เปิดใบเตือน MA-WN250800001 ของอดิศักดิ์ ไฟแรง จากประวัติ');
  await golden.stateChange('open-old-warning', before);
  await page.getByText('ใบเตือนพนักงาน', { exact: true }).scrollIntoViewIfNeeded();
  await golden.screen('old-warning-opened');

  await letter('MA-WN250800001').getByRole('button', { name: 'ลบ', exact: true }).click();
  await golden.step('กดลบใบเตือน MA-WN250800001 ระบบถามยืนยัน');
  before = await app.state();
  await confirm('ลบใบเตือน', 'ลบใบเตือน MA-WN250800001 ?', 'ลบ');
  await expect(letter('MA-WN250800001')).toHaveCount(0);
  await golden.step('ลบใบเตือนแล้ว');
  await golden.stateChange('delete-warning', before);
  await golden.screen('after-delete');
});
