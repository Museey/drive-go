import { test, expect } from '../support/test';

test.use({ dataset: 'franchise-trial' });

// Franchise HQ: the two "⟳ รีเฟรช" buttons no other scenario pressed (docs/BEHAVIORS.md) — on the HQ console's
// "แดชบอร์ดรวมทุกสาขา" and on the chain overview of the home page (reached by inspecting a branch and going back).
test('S305 HQ กดรีเฟรชแดชบอร์ดรวมทุกสาขา และรีเฟรชภาพรวมทั้งเครือที่หน้าแรก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await expect(page.getByText('ยอดขายรวมทุกสาขา · เดือนนี้').filter({ visible: true })).toBeVisible();
  await golden.step('HQ เข้าสู่ระบบ เห็นแดชบอร์ดรวมทุกสาขา');

  const refresh = page.getByRole('button', { name: '⟳ รีเฟรช' }).filter({ visible: true });
  await refresh.click();
  await expect(page.getByText('ยอดขายรวมทุกสาขา · เดือนนี้').filter({ visible: true })).toBeVisible();
  await app.settle();
  await golden.step('กดรีเฟรชแดชบอร์ด');
  await golden.screen('hq-dashboard-refreshed');

  await page.getByRole('row').filter({ hasText: 'B001 · สาขาหลัก รังสิต' }).getByRole('button', { name: 'เข้าดูสาขา' }).click();
  await expect(page.getByRole('heading', { name: 'กำลังดูข้อมูลสาขา B001' })).toBeVisible();
  await page.getByRole('button', { name: '← กลับไปดูยอดรวมทุกสาขา' }).click();
  await expect(page.getByRole('heading', { name: 'ภาพรวมทั้งเครือ · ทุกสาขารวมกัน' })).toBeVisible();
  await golden.step('เข้าดูสาขา B001 แล้วกลับไปดูยอดรวมทุกสาขาที่หน้าแรก');

  await refresh.click();
  await expect(page.getByRole('heading', { name: 'ภาพรวมทั้งเครือ · ทุกสาขารวมกัน' })).toBeVisible();
  await app.settle();
  await golden.step('กดรีเฟรชภาพรวมทั้งเครือ');
  await golden.screen('hq-home-refreshed');
});
