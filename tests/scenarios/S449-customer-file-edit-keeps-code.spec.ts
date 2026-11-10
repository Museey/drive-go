import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';

// Replaces S400 in the new system (tests/intentional-changes.json; as S283 for S272, owner 2026-11-09): an edited
// customer keeps its code. The legacy app gave ปรีชา ทองสุข the next code when the file was saved (C00016 → C00031);
// here it stays C00016, so that data change is S400's without the new code. Every step, screen and every other data
// change is S400's.
const S400 = 'S400-customer-file-stars-vehicles-grade-print.spec.ts';

test('S449 ระบบใหม่: แก้ไขดาวและเพิ่มรถอีกคันในแฟ้มลูกค้าแล้วรหัสลูกค้าเดิมคงอยู่ เปิดแฟ้มจากหน้าสรุปเกรดดาว และพิมพ์รายชื่อลูกค้า', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S400, { app, page, testInfo });
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await golden.step('รายชื่อลูกค้า');

  const search = page.getByPlaceholder('ค้นหา ยี่ห้อ / ทะเบียน / ชื่อลูกค้า / เบอร์โทร');
  await search.fill('ปรีชา');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'ปรีชา ทองสุข' }).filter({ has: page.getByRole('button', { name: 'แก้ไข' }) });
  await expect(row).toHaveCount(1);
  await golden.step('กดค้นหาข้อมูล เจอปรีชา ทองสุข');

  await row.getByRole('button', { name: 'แก้ไข' }).click();
  const form = page.locator('#mCust');
  await expect(form.getByRole('heading', { name: 'แก้ไขลูกค้า · ปรีชา ทองสุข' })).toBeVisible();
  await golden.step('แฟ้มลูกค้าปรีชา ทองสุข');

  // The form's own stars: two, cleared, then five.
  const stars = form.locator('[onclick^="setFormStars("]');
  await stars.nth(1).click();
  await golden.step('กดดาวดวงที่ 2');
  await form.getByRole('button', { name: 'ล้างดาว' }).click();
  await golden.step('กดล้างดาว');
  await stars.nth(4).click();
  await golden.step('กดดาวดวงที่ 5');

  // Person / company: company shows the company fields, back to person.
  await form.getByRole('button', { name: 'นิติบุคคล', exact: true }).click();
  await golden.step('เลือกนิติบุคคล');
  await golden.screen('customer-as-company');
  await form.getByRole('button', { name: 'บุคคลธรรมดา', exact: true }).click();
  await golden.step('กลับเป็นบุคคลธรรมดา');

  // A second car: added, removed, added again and filled in.
  await form.getByRole('button', { name: '+ เพิ่มคัน' }).click();
  await expect(form.getByRole('button', { name: 'ลบคันนี้' })).toHaveCount(2);
  await golden.step('กดเพิ่มคัน มีรถ 2 คัน');
  await form.getByRole('button', { name: 'ลบคันนี้' }).last().click();
  await expect(form.getByRole('button', { name: 'ลบคันนี้' })).toHaveCount(1);
  await golden.step('กดลบคันที่เพิ่ม เหลือรถ 1 คัน');
  await form.getByRole('button', { name: '+ เพิ่มคัน' }).click();
  const field = (label: string) => form.getByLabel(label, { exact: true }).filter({ visible: true }).last();
  await form.getByLabel('ยี่ห้อรถ').filter({ visible: true }).last().selectOption('Toyota (โตโยต้า)');
  await field('รุ่นรถ').fill('Hilux Revo 2.4');
  await field('สีรถ').fill('ดำ');
  await field('ทะเบียน · หมวดอักษร').fill('2ขค');
  await field('ทะเบียน · หมวดตัวเลข').fill('4455');
  await form.getByLabel('จังหวัดทะเบียน').filter({ visible: true }).last().selectOption('กรุงเทพมหานคร');
  await golden.step('กรอกรถคันที่ 2 Toyota ทะเบียน 2ขค 4455');

  let before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(form).toBeHidden();
  await golden.step('บันทึกแฟ้มลูกค้า ดาว 5 ดวง รถ 2 คัน');
  // S400's change of this save, with the record keeping C00016 (no code change).
  const kept = JSON.parse(legacyStateChange(S400, 'save-stars-and-second-car').split('DB.cust[C00031]').join('DB.cust[C00016]'));
  expect(kept['DB.cust[C00016].code']).toEqual(['C00016', 'C00031']);
  delete kept['DB.cust[C00016].code'];
  await app.settle();
  expect(JSON.parse(formatDiff(stateDiff(before, await app.state()))), 'data change save-stars-and-second-car').toEqual(kept);
  expect((await app.state() as any).DB.cust.find((c: any) => c.name === 'ปรีชา ทองสุข').code).toBe('C00016');

  // One row per car now. Opened again and closed with ปิด: nothing changes.
  await expect(row).toHaveCount(2);
  await row.first().getByRole('button', { name: 'แก้ไข' }).click();
  await expect(form.getByRole('button', { name: 'ลบคันนี้' })).toHaveCount(2);
  await golden.step('เปิดแฟ้มอีกครั้ง มีรถ 2 คัน');
  before = await app.state();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await expect(form).toBeHidden();
  await golden.step('กดปิดแฟ้มโดยไม่บันทึก');
  await golden.stateChange('close-without-saving', before);

  // The star-grade summary: "เปิดแฟ้ม" opens the same file.
  await page.getByRole('button', { name: '★ สรุปชื่อลูกค้าตามเกรดดาว' }).click();
  await golden.step('สรุปชื่อลูกค้าตามเกรดดาว');
  await page.getByRole('row').filter({ hasText: 'ปรีชา ทองสุข' }).getByRole('button', { name: 'เปิดแฟ้ม' }).click();
  await expect(form.getByRole('heading', { name: 'แก้ไขลูกค้า · ปรีชา ทองสุข' })).toBeVisible();
  await golden.step('กดเปิดแฟ้มของปรีชา ทองสุข');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // The customer list report (the register's PDF button), with the search still on.
  await page.getByRole('button', { name: '└ รายชื่อลูกค้า', exact: true }).click();
  await page.getByRole('group', { name: 'ส่งออกรายการ' }).filter({ visible: true }).getByRole('button', { name: 'PDF' }).click();
  await golden.step('กด PDF ของรายชื่อลูกค้า');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#printStage').getByText('ปรีชา ทองสุข').first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('customer-list-printed');
  await page.emulateMedia({ media: 'screen' });

  // The blank intake form from this page: ticked already, closed with ปิด.
  await page.getByRole('button', { name: 'พิมพ์ฟอร์มเปล่ารับรถ' }).click();
  await expect(page.getByRole('checkbox', { name: /ใบรับรถ/ })).toBeChecked();
  await golden.step('หน้าต่างพิมพ์แบบฟอร์มเปล่า เลือกใบรับรถไว้แล้ว');
  await page.locator('#mForm').getByRole('contentinfo').getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(page.locator('#mForm')).toBeHidden();
  await golden.step('ปิดหน้าต่างพิมพ์แบบฟอร์มเปล่า');
  golden.done();
});
