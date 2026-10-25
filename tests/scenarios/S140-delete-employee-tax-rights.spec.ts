import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S59 in the new system (tests/intentional-changes.json, task 3.3,
// decisions T3, T10, T12): an employee added now holds the three new tax
// rights (off), so the list shows her rights as 10/68 instead of 10/65 and the
// record removed by the delete has them too. Every step, message, the rest of
// each screen and the rest of the data changes are S59's.
// Task 3.7 (decisions R12, R13-ข): the list's "รวมรายได้" is the salary plus the
// regular monthly income (the fixed overtime and bonus are gone); its new hint
// changes the width of every column, so the staff table is left out of the two
// screens (the pop-up and the rest of the page are compared) and its rows are
// checked by their text.
const S59 = 'S59-delete-employee.spec.ts';
const income = (page: import('@playwright/test').Page) => page.locator('#empTbl');

test('S140 ระบบใหม่: ลบพนักงาน คนที่มีประวัติลบไม่ได้ ส่วนพนักงานที่เพิ่งเพิ่ม (มีสิทธิ์ภาษีใหม่ 3 ตัว) ลบได้', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S59, { app, page, testInfo });
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
  await expect(adisak.getByRole('cell', { name: '15,500.00 เงินได้ประจำ 0.00', exact: true })).toBeVisible();
  await golden.screen('cannot-delete-employee', { mask: [income(page)] });

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
  const rights = somying.getByRole('cell', { name: '10/68', exact: true });
  await expect(rights).toBeVisible();
  await expect(somying.getByRole('cell', { name: '12,000.00 เงินได้ประจำ 0.00' })).toBeVisible();
  await golden.screen('confirm-delete-employee', { mask: [rights, income(page)] });

  before = await app.state();
  // Each table row has its own "ลบ" button too: press the one on the confirm card.
  await page.locator('div').filter({ hasText: 'ลบพนักงาน EMP012 สมหญิง ทดลองงาน ?' })
    .filter({ has: page.getByRole('button', { name: 'ไม่ลบ' }) }).last()
    .getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(somying).toHaveCount(0);
  await golden.step('หลังลบ EMP012');
  const legacy = JSON.parse(legacyStateChange(S59, 'delete-employee'));
  const removed = legacy['DB.emp'].removed[0];
  removed.perms.doc = { ...removed.perms.doc, noVat: false, taxClose: false, creditNote: false };
  await golden.stateChange('delete-employee', before, { 'DB.emp': legacy['DB.emp'] });
  golden.done();
});
