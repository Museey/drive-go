import { test, expect } from '../support/test';

// Settings windows no scenario used (docs/BEHAVIORS.md): the customer register's gear (code prefixes: the section
// header, a new prefix, "เลือกรหัสที่ต้องการใช้งาน"), 11.1 ความกว้างช่องตาราง (แก้ไข → แบ่งเท่ากันทุกช่อง → บันทึก)
// and 11.2 ทะเบียนปัญหา (tab, + เพิ่ม, ▲, ×, บันทึก).
test('S281 ตั้งค่าทะเบียน: อักษรนำหน้ารหัสลูกค้า ความกว้างช่องตาราง และทะเบียนปัญหา', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();

  // 02: the gear beside the register title.
  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  await page.getByRole('button', { name: 'ตั้งค่าทะเบียนลูกค้า' }).click();
  await golden.step('ตั้งค่าทะเบียนลูกค้า');
  await page.getByRole('button', { name: 'รหัสลูกค้า', exact: true }).click();
  await golden.step('กดหัวข้อรหัสลูกค้า หัวข้อพับเก็บ');
  await page.getByRole('button', { name: 'รหัสลูกค้า', exact: true }).click();
  await golden.step('กดหัวข้อรหัสลูกค้าอีกครั้ง หัวข้อกางออก');
  let before = await app.state();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).click();
  await page.getByPlaceholder('ระบุสูงสุด 5 ตัวอักษร').fill('VIP');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  const vip = page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'VIP', exact: true }) }).filter({ visible: true });
  await expect(vip).toBeVisible();
  await golden.step('เพิ่มอักษรนำหน้า VIP');
  await golden.stateChange('add-prefix', before);
  before = await app.state();
  await vip.getByRole('checkbox').check();
  await app.settle();
  await golden.step('ติ๊กใช้ VIP เป็นรหัสลูกค้าใหม่');
  await golden.stateChange('use-prefix', before);
  await golden.screen('customer-code-settings');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // 11.1: widths of the first register, split equally, saved.
  await page.getByRole('button', { name: /^11 ตั้งค่าเพิ่มเติม/ }).click();
  await golden.step('11.1 ความกว้างช่องตาราง');
  await page.getByRole('button', { name: 'แก้ไข', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'แบ่งเท่ากันทุกช่อง' }).click();
  await golden.step('แก้ไขความกว้าง แบ่งเท่ากันทุกช่อง');
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('บันทึกความกว้างช่องตาราง');
  await golden.stateChange('save-widths', before);

  // 11.2: the problem list of quotations.
  await page.getByRole('button', { name: '11.2 ทะเบียนปัญหา' }).click();
  await golden.step('11.2 ทะเบียนปัญหา');
  await page.getByRole('button', { name: /^รายการที่ตรวจพบ/ }).click();
  await golden.step('แท็บรายการที่ตรวจพบ');
  await page.getByRole('button', { name: /^ปัญหาที่ลูกค้าแจ้ง/ }).click();
  await page.getByPlaceholder('พิมพ์รายการใหม่ แล้วกด Enter หรือปุ่มเพิ่ม').fill('ไฟหน้าไม่ติด');
  await page.getByRole('button', { name: '+ เพิ่ม' }).click();
  await golden.step('เพิ่ม "ไฟหน้าไม่ติด" ท้ายรายการ');
  const rows = page.locator('input[type="text"]').filter({ visible: true });
  await page.getByRole('button', { name: '▲' }).filter({ visible: true }).last().click();
  await golden.step('เลื่อน "ไฟหน้าไม่ติด" ขึ้นหนึ่งลำดับ');
  await page.getByRole('button', { name: '×' }).filter({ visible: true }).first().click();
  await golden.step('ลบรายการแรก');
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await app.settle();
  await golden.step('บันทึกทะเบียนปัญหา');
  await golden.stateChange('save-problem-list', before);
  await expect(rows.first()).toBeVisible();
});
