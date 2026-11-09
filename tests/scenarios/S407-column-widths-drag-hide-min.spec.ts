import { test, expect } from '../support/test';

// 11.1 ความกว้างช่องตาราง for the parts register (the one register whose columns can be moved): another register
// picked from the list, the picture column held at its least width, "LO" hidden by typing 0 and shown again with its
// tick box, "Min" hidden with the tick box, "หมวด" dragged above "ชื่อสินค้า", the total brought back to 100%, saved,
// then the register shows the new order without "Min".
test('S407 ตั้งความกว้างช่องทะเบียนอะไหล่ ซ่อนช่องด้วย 0% และช่องติ๊ก ลากย้ายช่อง ปรับให้ครบ 100% แล้วบันทึก', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^11 ตั้งค่าเพิ่มเติม/ }).click();
  await golden.step('11.1 ความกว้างช่องตาราง');

  await page.getByLabel('เลือกตารางทะเบียน').selectOption({ label: 'ทะเบียนอะไหล่' });
  await golden.step('เลือกทะเบียนอะไหล่');
  await page.getByRole('button', { name: 'แก้ไข', exact: true }).filter({ visible: true }).first().click();
  await golden.step('แก้ไขความกว้างทะเบียนอะไหล่');

  const row = (name: string) => page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) }).filter({ visible: true });
  const width = (name: string) => row(name).getByRole('spinbutton');

  // The picture frame cannot go under its least width.
  await width('รูปอะไหล่').fill('3');
  await expect(width('รูปอะไหล่')).toHaveValue('7.2');
  await expect(row('รูปอะไหล่')).toContainText('ลดต่ำกว่า 7.2% ไม่ได้ — ต่ำสุดแล้ว');
  await golden.step('พิมพ์ 3% ที่รูปอะไหล่ ระบบคงไว้ที่ต่ำสุด 7.2%');

  // 0% hides a column; its tick box shows it again.
  await width('LO').fill('0');
  await width('LO').press('Tab');
  await expect(page.getByRole('checkbox', { name: 'แสดงช่อง LO' })).not.toBeChecked();
  await golden.step('พิมพ์ 0% ที่ LO ช่องถูกซ่อน');
  await page.getByRole('checkbox', { name: 'แสดงช่อง LO' }).check();
  await golden.step('ติ๊กแสดงช่อง LO อีกครั้ง');
  await page.getByRole('checkbox', { name: 'แสดงช่อง Min' }).uncheck();
  await golden.step('เอาติ๊กช่อง Min ออก');

  // "หมวด" dragged onto the upper half of "3 · ชื่อสินค้า".
  const target = row('3 · ชื่อสินค้า');
  const box = await target.boundingBox();
  await row('หมวด').dragTo(target, { targetPosition: { x: 40, y: Math.max(2, Math.floor(box!.height / 4)) } });
  await expect(page.getByRole('row').filter({ visible: true }).filter({ hasText: /ลากย้าย/ }).nth(2)).toContainText('หมวด');
  await golden.step('ลากหมวดไปไว้ก่อนชื่อสินค้า');

  await page.getByRole('button', { name: 'ปรับให้รวมครบ 100% อัตโนมัติ' }).click();
  await golden.step('ปรับให้รวมครบ 100%');
  await golden.screen('stock-widths-edited');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('บันทึกความกว้างช่องทะเบียนอะไหล่');
  await golden.stateChange('save-stock-widths', before);

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await app.settle();
  await golden.step('ทะเบียนอะไหล่ตามที่ตั้งไว้');
});
