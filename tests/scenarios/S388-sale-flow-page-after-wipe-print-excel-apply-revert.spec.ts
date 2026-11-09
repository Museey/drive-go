import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// 11.5 · ระบบขายแบบใหม่ with the switch off: the fixture has it on, and "ล้างข้อมูลทั้งหมด" (10) takes the switch away
// with the rest of the data, so the page shows what switching on would do. No scenario changed its year, printed the
// summary, exported it to Excel, switched on (two confirmations, a backup file) or went back ("ย้อนกลับไปใช้ระบบเดิม").
const confirmCard = (page: Page, title: string) =>
  page.getByRole('heading', { name: title, exact: true }).filter({ visible: true }).last().locator('xpath=ancestor::div[.//button][1]');

test('S388 หน้า 11.5 ระบบขายแบบใหม่หลังล้างข้อมูล: เปลี่ยนปี พิมพ์สรุป ส่งออก Excel เปิดใช้ (ยืนยันสองครั้ง) แล้วย้อนกลับ', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูลทั้งหมด' }).click();
  await page.getByRole('button', { name: 'ล้างข้อมูล', exact: true }).click();
  await expect(page.getByText('ล้างข้อมูลทั้งหมดออกจากระบบ?', { exact: true })).toBeHidden();
  await golden.step('ล้างข้อมูลทั้งหมดแล้ว');

  await page.getByRole('button', { name: /^11 ตั้งค่าเพิ่มเติม/ }).click();
  await page.getByRole('button', { name: /11\.5 ระบบขายแบบใหม่/ }).first().click();
  await expect(page.getByRole('heading', { name: 'ถ้าเปิดใช้ จะเกิดอะไรกับเอกสารเดิม' })).toBeVisible();
  await golden.step('หน้า 11.5 ระบบขายแบบใหม่ ยังไม่เปิดใช้');
  await golden.screen('sale-flow-off');

  await page.getByLabel('ดูตัวเลขของปี').selectOption({ index: 0 });
  await expect(page.getByRole('heading', { name: /^รายเดือน ปี / })).toBeVisible();
  await golden.step('เลือกปีที่ดูตัวเลข');

  await page.getByRole('button', { name: 'พิมพ์สรุป' }).click();
  await expect(page.locator('#printStage')).toContainText('สรุปก่อน / หลัง เปิดใช้ระบบขายแบบใหม่');
  await golden.step('พิมพ์สรุปก่อน / หลัง');

  const excel = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ส่งออก Excel' }).click();
  expect((await excel).suggestedFilename()).toMatch(/^สรุปก่อน - หลัง เปิดใช้ระบบขายแบบใหม่ 2026-10-13.*\.xlsx$/);
  await golden.step('ส่งออก Excel');

  // Switching on: asked twice, a backup file is downloaded first.
  await page.getByRole('button', { name: 'เปิดใช้ระบบขายแบบใหม่', exact: true }).click();
  await golden.step('กดเปิดใช้ ระบบอธิบายสิ่งที่จะเกิดขึ้น');
  await confirmCard(page, 'เปิดใช้ระบบขายแบบใหม่').getByRole('button', { name: 'อ่านแล้ว ดำเนินการต่อ' }).click();
  await golden.step('ระบบขอยืนยันอีกครั้ง');
  let before = await app.state();
  const backup = page.waitForEvent('download');
  await confirmCard(page, 'ยืนยันเปิดใช้อีกครั้ง').getByRole('button', { name: 'สำรองข้อมูลและเปิดใช้' }).click();
  expect((await backup).suggestedFilename()).toBe('drivego-backup-before-saleflow-2026-10-13.json');
  await expect(page.getByRole('button', { name: 'ย้อนกลับไปใช้ระบบเดิม' })).toBeVisible();
  await golden.step('เปิดใช้ระบบขายแบบใหม่แล้ว');
  await golden.stateChange('switch-on', before);

  await page.getByRole('button', { name: 'ย้อนกลับไปใช้ระบบเดิม' }).click();
  await golden.step('กดย้อนกลับ ระบบถามยืนยัน');
  before = await app.state();
  await confirmCard(page, 'ย้อนกลับไปใช้ระบบเดิม').getByRole('button', { name: 'ย้อนกลับ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'ถ้าเปิดใช้ จะเกิดอะไรกับเอกสารเดิม' })).toBeVisible();
  await golden.step('กลับไปใช้ระบบขายแบบเดิมแล้ว');
  await golden.stateChange('switch-off', before);
});
