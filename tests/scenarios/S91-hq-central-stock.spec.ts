import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';

test.use({ dataset: 'franchise-trial' });

// The legacy prompt box has no label; it takes the focus when the prompt opens.
async function answerPrompt(page: Page, value: string, button: string) {
  const ok = page.getByRole('button', { name: button, exact: true }).filter({ visible: true });
  await ok.waitFor();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type(value);
  await ok.click();
}

test('S91 สำนักงานใหญ่ตั้งคลังกลาง: นำเข้าทะเบียนจากสาขา เพิ่มสินค้า แก้ยอด Min Max และลบรายการ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('HQ เข้าสู่ระบบ');

  await page.getByRole('button', { name: '🏭 คลังกลาง HQ (Min-Max)' }).click();
  await expect(page.getByText('คลังกลางยังว่าง', { exact: false }).filter({ visible: true })).toBeVisible();
  await golden.step('เปิดคลังกลาง HQ ยังว่าง');
  const before = await app.state();

  // HQ is not inspecting any branch, yet the import reads the register of B001 (the branch loaded for HQ).
  await page.getByRole('button', { name: '⇪ นำเข้ารายการจากทะเบียนสาขาที่เปิดอยู่' }).click();
  await expect(page.getByText('52 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('นำเข้า 52 รายการจากทะเบียนสาขา');
  await golden.stateChange('import-from-branch', before);
  await golden.screen('hq-stock-imported');

  const beforeEdit = await app.state();
  await page.getByRole('button', { name: '+ เพิ่มสินค้า' }).click();
  await golden.step('กดเพิ่มสินค้า ถามรหัสสินค้า');
  await answerPrompt(page, 'EV-140', 'ต่อไป');
  await golden.step('ถามชื่อสินค้า');
  await answerPrompt(page, 'สายไฟแรงสูง EV (เมตร)', 'บันทึก');
  const added = page.getByRole('row').filter({ hasText: 'สายไฟแรงสูง EV (เมตร)' });
  await expect(added).toBeVisible();
  await golden.step('เพิ่มสินค้าใหม่ในคลัง HQ แล้ว');

  // Columns: คงคลัง HQ, Min, Max (number boxes without labels).
  const [qty, min, max] = [0, 1, 2].map(i => added.getByRole('spinbutton').nth(i));
  await qty.fill('100'); await qty.press('Tab');
  await min.fill('20'); await min.press('Tab');
  await max.fill('200'); await max.press('Tab');
  await golden.step('ตั้งยอดคงคลัง 100 Min 20 Max 200');

  await page.getByRole('row').filter({ hasText: 'OT-999' }).getByRole('button', { name: '✕' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'OT-999' })).toHaveCount(0);
  await expect(page.getByText('52 รายการ', { exact: true }).filter({ visible: true })).toBeVisible();
  await golden.step('ลบรายการ OT-999 ออกจากคลัง HQ');
  await added.scrollIntoViewIfNeeded();
  await golden.screen('hq-stock-after-edit');
  await golden.stateChange('add-edit-delete', beforeEdit);
});
