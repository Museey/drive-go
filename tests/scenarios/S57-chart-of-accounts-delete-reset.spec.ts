import { test, expect } from '../support/test';

test('S57 ผังบัญชี: ลบบัญชี 6032 ค่าโทรศัพท์และอินเทอร์เน็ตที่หมวดค่าใช้จ่ายยังผูกอยู่ แล้วคืนค่าผังบัญชีมาตรฐาน', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  await expect(page.getByText('56 บัญชี', { exact: true })).toBeVisible();
  // A select's accessible name also contains its options (account names), so it is matched by the start of the label.
  const phone = page.getByLabel(/^ค่าโทรศัพท์และอินเทอร์เน็ต/).filter({ visible: true });
  await expect(phone).toHaveValue('6032');
  await golden.step('หน้าผังบัญชี หมวดค่าโทรศัพท์และอินเทอร์เน็ตผูกกับบัญชี 6032');

  const row = page.getByRole('row').filter({ hasText: '6032' }).filter({ visible: true });
  await row.scrollIntoViewIfNeeded();
  await row.getByRole('button', { name: 'ลบ' }).click();
  await expect(page.getByText('ลบบัญชี 6032 ออกจากผังบัญชี?')).toBeVisible();
  await golden.step('กดลบบัญชี 6032 ระบบถามยืนยัน (ไม่บอกว่ายังผูกกับหมวดค่าใช้จ่าย)');
  await golden.screen('confirm-delete-account');

  let before = await app.state();
  // The rows of the chart have "ลบ" buttons too: press the one on the confirm card.
  const card = page.locator('div').filter({ hasText: 'ลบบัญชี 6032 ออกจากผังบัญชี?' }).filter({ has: page.getByRole('button', { name: 'ไม่ลบ' }) }).last();
  await card.getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(row).toHaveCount(0);
  await expect(page.getByText('55 บัญชี', { exact: true })).toBeVisible();
  await golden.step('หลังลบบัญชี 6032');
  // Legacy behaviour reported to the owner: the saved mapping still points at the deleted account 6032,
  // while the mapping box can no longer show it.
  await golden.stateChange('delete-account', before);
  await phone.scrollIntoViewIfNeeded();
  await golden.screen('mapping-after-delete');

  await page.getByRole('button', { name: 'คืนค่าผังบัญชีมาตรฐาน' }).click();
  await expect(page.getByText('คืนค่าผังบัญชีและการผูกบัญชีทั้งหมดกลับเป็นมาตรฐานกรมพัฒนาธุรกิจการค้า?')).toBeVisible();
  await golden.step('กดคืนค่าผังบัญชีมาตรฐาน ระบบถามยืนยัน');
  before = await app.state();
  await page.getByRole('button', { name: 'คืนค่า', exact: true }).click();
  await expect(page.getByText('56 บัญชี', { exact: true })).toBeVisible();
  await expect(phone).toHaveValue('6032');
  await golden.step('หลังคืนค่าผังบัญชีมาตรฐาน บัญชี 6032 กลับมา');
  await golden.stateChange('reset-chart', before);
});
