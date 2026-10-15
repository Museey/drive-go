import { test, expect } from '../support/test';

test('S56 ผังบัญชี: เพิ่มบัญชี 6140 แก้ชื่อบัญชี แล้วผูกหมวดค่าโทรศัพท์และอินเทอร์เน็ตเข้ากับบัญชีใหม่', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  await expect(page.getByText('56 บัญชี', { exact: true })).toBeVisible();
  await golden.step('หน้าผังบัญชี 56 บัญชี');

  // The app asks with its own pop-up and a text box under the question (instead of the browser's prompt).
  const answer = (question: string) => page.getByText(question, { exact: true }).locator('..').getByRole('textbox');
  let before = await app.state();
  await page.getByRole('button', { name: '+ เพิ่มบัญชี' }).click();
  await answer('รหัสบัญชีใหม่ (เช่น 6140)').fill('6140');
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  await answer('ชื่อบัญชี').fill('ค่าบริการซอฟต์แวร์');
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  // The last question wants the type typed in English; it starts as "expense".
  await expect(answer('หมวดบัญชี: asset / liab / equity / revenue / cogs / expense')).toHaveValue('expense');
  await golden.step('กด + เพิ่มบัญชี กรอกรหัส 6140 ชื่อบัญชี แล้วถึงคำถามหมวดบัญชี');
  await golden.screen('ask-account-type');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  const row = page.getByRole('row').filter({ hasText: '6140' }).filter({ visible: true });
  await expect(row).toContainText('ค่าบริการซอฟต์แวร์');
  await expect(page.getByText('57 บัญชี', { exact: true })).toBeVisible();
  await golden.step('หลังเพิ่มบัญชี 6140');
  await golden.stateChange('add-account', before);

  before = await app.state();
  await row.getByRole('button', { name: 'แก้ไข' }).click();
  const name = answer('ชื่อบัญชีของรหัส 6140');
  await expect(name).toHaveValue('ค่าบริการซอฟต์แวร์');
  await name.fill('ค่าบริการซอฟต์แวร์และระบบออนไลน์');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(row).toContainText('ค่าบริการซอฟต์แวร์และระบบออนไลน์');
  await golden.step('แก้ชื่อบัญชี 6140');
  await golden.stateChange('edit-account', before);

  // A select's accessible name also contains its options (account names), so it is matched by the start of the label.
  const phone = page.getByLabel(/^ค่าโทรศัพท์และอินเทอร์เน็ต/).filter({ visible: true });
  await phone.selectOption('6140');
  await phone.scrollIntoViewIfNeeded();
  before = await app.state();
  await page.getByRole('button', { name: 'บันทึกการผูกบัญชี' }).click();
  await golden.step('ผูกหมวด "ค่าโทรศัพท์และอินเทอร์เน็ต" กับบัญชี 6140 แล้วกดบันทึกการผูกบัญชี');
  await golden.stateChange('save-mapping', before);
  await golden.screen('mapping-saved');
});
