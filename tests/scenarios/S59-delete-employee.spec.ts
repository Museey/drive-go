import { test, expect } from '../support/test';

test('S59 ลบพนักงาน: คนที่มีประวัติในระบบลบไม่ได้ (ให้ปิดบัญชีแทน) ส่วนพนักงานที่เพิ่งเพิ่มและยังไม่มีประวัติลบได้', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  const adisak = page.getByRole('row').filter({ hasText: 'EMP011' }).filter({ visible: true });
  await expect(adisak).toContainText('อดิศักดิ์ ไฟแรง');
  await golden.step('หน้าข้อมูลพนักงาน');

  let before = await app.state();
  await adisak.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('พนักงาน EMP011 อดิศักดิ์ ไฟแรง มีร่องรอยในระบบอยู่แล้ว', { exact: false })).toBeVisible();
  await golden.step('กดลบ EMP011 ระบบแจ้งว่าลบไม่ได้เพราะมีประวัติ');
  await golden.screen('cannot-delete-employee');

  await page.getByRole('button', { name: 'เข้าใจแล้ว' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  await expect(field('ชื่อ - นามสกุล *')).toHaveValue('อดิศักดิ์ ไฟแรง');
  await golden.step('กดเข้าใจแล้ว ระบบเปิดหน้าแก้ไขพนักงานคนนั้นให้');
  await golden.stateChange('blocked-delete', before);

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await expect(field('ชื่อ - นามสกุล *')).toBeHidden();
  await page.getByRole('button', { name: '+ เพิ่มพนักงาน' }).click();
  await expect(field('รหัสพนักงาน *')).toHaveValue('EMP012');
  await field('ชื่อ - นามสกุล *').fill('สมหญิง ทดลองงาน');
  await field('ตำแหน่งงาน').fill('ธุรการหน้าร้าน');
  await field('อัตราเงินเดือน (บาท)').fill('12000');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  const somying = page.getByRole('row').filter({ hasText: 'EMP012' }).filter({ visible: true });
  await expect(somying).toContainText('สมหญิง ทดลองงาน');
  await golden.step('เพิ่มพนักงานใหม่ EMP012 สมหญิง ทดลองงาน');

  await somying.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('ยังไม่มีเอกสารหรือประวัติใด ๆ ในระบบ', { exact: false })).toBeVisible();
  await golden.step('กดลบ EMP012 ระบบถามยืนยัน');
  await golden.screen('confirm-delete-employee');

  before = await app.state();
  // Each table row has its own "ลบ" button too: press the one on the confirm card.
  await page.locator('div').filter({ hasText: 'ลบพนักงาน EMP012 สมหญิง ทดลองงาน ?' })
    .filter({ has: page.getByRole('button', { name: 'ไม่ลบ' }) }).last()
    .getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(somying).toHaveCount(0);
  await golden.step('หลังลบ EMP012');
  await golden.stateChange('delete-employee', before);
});
