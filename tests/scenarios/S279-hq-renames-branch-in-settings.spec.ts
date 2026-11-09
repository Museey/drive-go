import { test, expect } from '../support/test';

test.use({ dataset: 'franchise-trial' });

// Franchise HQ, 10 ตั้งค่าองค์กร: the branch name box of a branch card and the link to the full branch page of the
// HQ Console (no scenario used them, docs/BEHAVIORS.md).
test('S279 HQ เปลี่ยนชื่อสาขาในหน้าตั้งค่าองค์กร แล้วเปิดหน้าจัดการสาขาเต็มรูปแบบใน HQ Console', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: /^10 ตั้งค่าองค์กร/ }).click();
  const name = page.getByLabel('ชื่อสาขา').filter({ visible: true }).nth(1);
  await expect(name).toHaveValue('สาขาบางนา');
  await golden.step('HQ หน้าตั้งค่าองค์กร การ์ดสาขา');

  const before = await app.state();
  await name.fill('สาขาบางนา-ตราด');
  await name.press('Tab');
  await app.settle();
  await golden.step('เปลี่ยนชื่อสาขา B002 เป็น สาขาบางนา-ตราด');
  await golden.stateChange('rename-branch', before);

  await page.getByRole('button', { name: 'เปิดหน้าจัดการเต็มรูปแบบใน HQ Console ›' }).click();
  await expect(page.getByText('สาขาบางนา-ตราด').filter({ visible: true }).first()).toBeVisible();
  await golden.step('เปิดหน้าจัดการสาขาเต็มรูปแบบใน HQ Console');
});
