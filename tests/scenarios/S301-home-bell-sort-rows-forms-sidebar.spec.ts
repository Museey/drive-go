import { test, expect } from '../support/test';

// Home page (00) buttons no other scenario pressed (docs/BEHAVIORS.md): the bell on the top bar that opens
// "รายงานเอกสารรอการอนุมัติ" (sorted by a column header three times, closed with its ✕ button, named "ปิด"), a row of the
// month's goods receipts, a row of the slow-moving stock table, "พิมพ์แบบฟอร์มเปล่า", and "พับเมนู" on the side menu.
test('S301 หน้าแรก: กระดิ่งเอกสารรออนุมัติ เรียงตามหัวคอลัมน์ เปิดใบรับสินค้าและบัตรสินค้าจากตาราง พิมพ์แบบฟอร์มเปล่า และพับเมนูข้าง', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  // ---- the bell
  const bell = page.getByTitle('เอกสารรอการอนุมัติ');
  await bell.click();
  const list = page.getByRole('table').filter({ has: page.getByRole('cell', { name: 'แสดงข้อมูล', exact: true }) }).filter({ visible: true });
  const numberHeader = list.getByRole('row').first().getByRole('cell', { name: /^เลขที่เอกสาร/ });
  await expect(list.getByRole('row')).toHaveCount(3);
  await golden.step('กดกระดิ่ง เปิดรายงานเอกสารรอการอนุมัติ');
  const order = async () => (await list.getByRole('row').allInnerTexts()).slice(1).map(t => t.split('\t')[3]?.trim());
  expect(await order()).toEqual(['MA-QT261000002', 'MA-IV261000001']);
  await numberHeader.click();
  expect(await order()).toEqual(['MA-IV261000001', 'MA-QT261000002']);
  await golden.step('กดหัวคอลัมน์เลขที่เอกสาร เรียงน้อยไปมาก');
  await numberHeader.click();
  expect(await order()).toEqual(['MA-QT261000002', 'MA-IV261000001']);
  await golden.step('กดอีกครั้ง เรียงมากไปน้อย');
  await golden.screen('approval-list-sorted-desc');
  await numberHeader.click();
  expect(await order()).toEqual(['MA-QT261000002', 'MA-IV261000001']);
  await golden.step('กดครั้งที่สาม กลับไปเรียงแบบแนะนำ');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).click();
  await expect(list).toBeHidden();
  await golden.step('ปิดรายงานด้วยปุ่ม ✕');

  // ---- a goods receipt of this month, from the home page table
  await page.getByRole('row').filter({ hasText: 'MA-RC261000001' }).filter({ visible: true }).click();
  await golden.step('กดแถว MA-RC261000001 ในตารางซื้อสินค้าเดือนนี้');
  await golden.screen('goods-receipt-from-home');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /ปิด/ }).filter({ visible: true }).last().click();
  await golden.step('ปิดใบรับสินค้า');

  // ---- a slow-moving item, from the home page table
  await page.getByRole('row').filter({ hasText: 'CO-415' }).filter({ visible: true }).first().click();
  await golden.step('กดแถว CO-415 ในตารางสินค้าไม่เคลื่อนไหว เปิดบัตรสินค้า');
  await page.getByRole('button', { name: /ปิด/ }).filter({ visible: true }).last().click();
  await golden.step('ปิดบัตรสินค้า');

  // ---- blank forms
  await page.getByRole('button', { name: 'พิมพ์แบบฟอร์มเปล่า' }).click();
  await golden.step('กดพิมพ์แบบฟอร์มเปล่า');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).click();
  await golden.step('ปิดหน้าต่างแบบฟอร์มเปล่า');

  // ---- fold the side menu and open it again
  await page.getByTitle('พับ/กางเมนู').click();
  await golden.step('กดพับเมนูข้าง');
  await golden.screen('side-menu-folded');
  await page.getByTitle('พับ/กางเมนู').click();
  await golden.step('กดกางเมนูข้างอีกครั้ง');
});
