import { test, expect } from '../support/test';

test('S72 บันทึกลาป่วย 2 วันของพนักงาน (อนุมัติแล้ว) แล้วลบบันทึกมาสายที่บันทึกผิด', async ({ app, page, golden }) => {
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

  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('button', { name: 'บันทึกการทำงานและการลา' }).click();
  await expect(field('งวดเดือน')).toHaveValue('2026-10');
  await golden.step('หน้าบันทึกการทำงานและการลา งวด ต.ค. 2569');

  await page.getByRole('button', { name: '+ บันทึกรายการ' }).click();
  await select('พนักงาน *').selectOption({ label: 'EMP003 · วิชัย ขยันงาน (ช่างซ่อมทั่วไป)' });
  await select('ประเภทรายการ *').selectOption({ label: 'ลาป่วย' });
  await expect(page.getByText('ปีนี้ใช้สิทธิ ลาป่วย ไปแล้ว 4 วัน', { exact: false })).toBeVisible();
  // Changing the type from มาสาย (15 minutes) keeps the 15 in the box, now read as 15 days.
  await expect(field('จำนวนวัน')).toHaveValue('15');
  await golden.step('เลือกวิชัย ขยันงาน ประเภทลาป่วย ระบบบอกสิทธิที่ใช้ไปแล้ว');
  await field('จำนวนวัน').fill('2');
  await field('วันที่สิ้นสุด (กรณีลาหลายวัน)').fill('2026-10-14');
  await select('สถานะการอนุมัติ').selectOption({ label: 'อนุมัติแล้ว' });
  await field('เหตุผล / รายละเอียด').fill('ไข้หวัดใหญ่ มีใบรับรองแพทย์');
  await golden.step('กรอกลาป่วย 2 วัน 13–14/10/2569 อนุมัติแล้ว');
  await golden.screen('sick-leave-form');

  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  const sick = page.getByRole('row').filter({ hasText: 'วิชัย ขยันงาน' }).filter({ hasText: 'ไข้หวัดใหญ่ มีใบรับรองแพทย์' });
  await expect(sick).toContainText('13/10/2569');
  await golden.step('บันทึกแล้ว รายการขึ้นในตาราง');
  await golden.stateChange('save-sick-leave', before);
  await golden.screen('records-after-save');

  const late = page.getByRole('row').filter({ hasText: 'ฝนทิพย์ ต้อนรับ' }).filter({ hasText: 'มาสาย' });
  await expect(late).toContainText('06/10/2569');
  await late.getByRole('button', { name: 'ลบ' }).click();
  await golden.step('กดลบบันทึกมาสาย 29 นาทีของฝนทิพย์ ระบบถามยืนยัน');
  before = await app.state();
  await confirm('ลบบันทึก', 'ลบบันทึกนี้?', 'ลบ');
  await expect(late).toHaveCount(0);
  await golden.step('ลบบันทึกแล้ว');
  await golden.stateChange('delete-late-record', before);
});
