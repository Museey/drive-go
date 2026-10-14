import { test, expect } from '../support/test';

test('S45 บันทึกเงินลงทุนเพิ่มโดยเจ้าของ 200,000 บาท แล้วยอดเงินลงทุนสะสมและเงินสดคงเหลือเปลี่ยนตาม', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ เงินลงทุน / เงินสด', exact: true }).click();
  await expect(page.getByText('25 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('หน้าเงินลงทุน / เงินสด');
  await golden.screen('capital-before');

  await page.getByRole('button', { name: '+ บันทึกรายการ' }).click();
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await save.click();
  await golden.step('กดบันทึกโดยยังไม่กรอกจำนวนเงิน');

  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  // A select's accessible name also contains its chosen option, so selects are matched by the start of the label.
  const select = (label: string) => page.getByLabel(label).filter({ visible: true });
  await expect(field('วันที่ *')).toHaveValue('2026-10-13');
  await select('ประเภทรายการ *').selectOption('เงินลงทุนเพิ่มโดยเจ้าของ / ผู้ถือหุ้น');
  await field('จำนวนเงิน (บาท) *').fill('200000');
  await field('รายละเอียด').fill('เจ้าของเพิ่มทุนซื้อเครื่องวิเคราะห์แบตเตอรี่ EV');
  await golden.step('กรอกรายการเงินลงทุน');

  const before = await app.state();
  await save.click();
  await expect(page.getByText('26 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'เจ้าของเพิ่มทุนซื้อเครื่องวิเคราะห์แบตเตอรี่ EV' })).toContainText('200,000.00');
  await golden.step('หลังบันทึกเงินลงทุน');
  await golden.stateChange('owner-investment', before);
  await golden.screen('capital-after');
});
