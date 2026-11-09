import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S342 in the new system (tests/intentional-changes.json; as S146 for S43, task 3.4, decision R7-ข,
// owner's answers 2026-10-25): the internet bill saved from the "+ ค่าโทรศัพท์ / เน็ต" shortcut is saved as
// paid, so it gets a payment voucher MA-PV… and its payment date, and paying is written to the audit log; the
// register shows the voucher number under the expense's. Every step and every other data change is S342's.
const S342 = 'S342-goods-receipt-register-forms-search-and-expense-shortcuts.spec.ts';

test('S446 ระบบใหม่: ทะเบียนใบรับสินค้า ฟอร์มเปล่า ค้นหา และปุ่มลัดรายจ่าย ค่าอินเทอร์เน็ตที่จ่ายแล้วได้ใบสำคัญจ่าย MA-PV', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S342, { app, page, testInfo });
  test.slow();
  await app.loginAsOwner();
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await golden.step('ทะเบียนใบรับสินค้า');
  const closeTop = () => page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  await page.getByRole('button', { name: 'พิมพ์ฟอร์มเปล่า' }).filter({ visible: true }).click();
  await golden.step('พิมพ์ฟอร์มเปล่าจากทะเบียน');
  await closeTop();

  const search = page.getByPlaceholder('ค้นหา เลขที่ / ผู้ขาย / เลขใบกำกับ + Enter');
  await search.fill('รุ่งเรือง');
  await search.press('Enter');
  await golden.step('ค้นหา "รุ่งเรือง" กด Enter');
  await search.fill('ไม่มีใบนี้');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await expect(page.getByText('ยังไม่มีประวัติการซื้อสินค้า')).toBeVisible();
  await golden.step('ค้นหา "ไม่มีใบนี้" กดค้นหาข้อมูล ไม่พบ');
  await search.fill('');
  await page.getByRole('button', { name: 'ค้นหาข้อมูล' }).filter({ visible: true }).click();
  await golden.step('ล้างคำค้นแล้วกดค้นหาข้อมูล');

  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByRole('button', { name: 'พิมพ์ฟอร์มเปล่า' }).filter({ visible: true }).last().click();
  await golden.step('พิมพ์ฟอร์มเปล่าจากหน้าต่างใบรับสินค้า');
  await closeTop();
  await page.getByRole('button', { name: 'ดูทั้งหมด' }).filter({ visible: true }).last().click();
  await golden.step('ดูใบรับสินค้าทั้งหมด');
  await page.getByRole('banner').filter({ has: page.getByRole('heading', { name: /ดูทั้งหมด$/ }) })
    .getByRole('button', { name: 'ปิด' }).click();
  await page.getByPlaceholder('ค้นหา เลขที่ / ผู้ขาย / ยอดเงิน').filter({ visible: true }).click();
  await page.keyboard.type('MA-RC261000001');
  await page.getByText('MA-RC261000001 · 01/10/2569', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบรับสินค้า' })).toBeVisible();
  await golden.step('เปิดใบรับสินค้า MA-RC261000001 จากช่องค้นหาในหน้าต่าง');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // ปุ่มลัดรายจ่าย
  await page.getByRole('button', { name: '2 · ค่าน้ำค่าไฟ' }).click();
  await page.getByRole('button', { name: '+ ค่าน้ำ', exact: true }).click();
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('ค่าน้ำประปา');
  await golden.step('กด + ค่าน้ำ ฟอร์มตั้งหมวดค่าน้ำประปา');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: '+ ค่าโทรศัพท์ / เน็ต' }).click();
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('ค่าโทรศัพท์และอินเทอร์เน็ต');
  await golden.step('กด + ค่าโทรศัพท์ / เน็ต');
  await page.getByLabel('รายละเอียดค่าใช้จ่าย *', { exact: true }).filter({ visible: true }).fill('ค่าอินเทอร์เน็ตอู่ เดือน ตุลาคม 2569');
  await page.getByPlaceholder('หรือพิมพ์ชื่อเอง').fill('บริษัท ทรู อินเทอร์เน็ต จำกัด');
  await page.getByLabel('มูลค่าก่อนภาษี (บาท) *', { exact: true }).filter({ visible: true }).fill('599');
  const before = await app.state() as any;
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  const row = page.getByRole('row').filter({ hasText: 'ค่าอินเทอร์เน็ตอู่ เดือน ตุลาคม 2569' }).filter({ visible: true });
  await expect(row).toBeVisible();
  await golden.step('บันทึกค่าอินเทอร์เน็ต 599 บาท');
  // S342's change, with the payment voucher, its date and the payment's audit line (599.00 + VAT 41.93, by transfer).
  const legacy = JSON.parse(legacyStateChange(S342, 'save-internet'));
  Object.assign(legacy['DB.expenses'].added[0], { payDate: '2026-10-13', pvNo: 'MA-PV261000001' });
  legacy['DB.audit'].added.push({ ...legacy['DB.audit'].added[0], id: `@DB.audit[MA-EX261000003#${before.DB.audit.length + 1}]`, act: 'pay',
    note: 'จ่ายเงิน 640.93 บาท (เงินโอน) · ใบสำคัญจ่าย MA-PV261000001' });
  await golden.stateChange('save-internet', before, { 'DB.expenses': legacy['DB.expenses'], 'DB.audit': legacy['DB.audit'], 'DB.seq.MA-PV2610': [null, 1] });
  // The register shows the voucher number under the expense's.
  await expect(row.getByRole('cell').filter({ hasText: 'MA-EX261000003' })).toContainText('MA-PV261000001');

  await page.getByRole('button', { name: '4 · จ่ายเงินเดือน' }).click();
  await page.getByRole('button', { name: 'พิมพ์ใบจ่ายเงินเดือน' }).click();
  await golden.step('กดพิมพ์ใบจ่ายเงินเดือน');

  await page.getByRole('button', { name: '5 · อุปกรณ์สำนักงาน' }).click();
  await page.getByRole('button', { name: '+ เครื่องมือช่างมูลค่าต่ำ' }).click();
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('เครื่องมือช่างมูลค่าต่ำ');
  await golden.step('กด + เครื่องมือช่างมูลค่าต่ำ');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: '+ วัสดุสำนักงาน' }).click();
  await expect(select('หมวดค่าใช้จ่าย *')).toHaveValue('วัสดุสิ้นเปลืองสำนักงาน');
  await golden.step('กด + วัสดุสำนักงาน');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('ปิดฟอร์ม');
  golden.done();
});
