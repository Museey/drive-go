import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { openRealTestShop, resetTestPassword } from '../support/new-shop.mjs';

// New behaviour (LAUNCH-CHECKLIST stage 2, decision P3): DriveGo's staff open a real franchise chain with
// tools/shop-admin.mjs new --franchise — no branches and no sample data, only the HQ account (hq) with a temporary
// password. HQ signs in, adds the first branch with its head's account as in S116, and the head signs in to the new
// (empty) branch. HQ forgets the password: staff give a new one (tools/shop-admin.mjs password).
async function answerPrompt(page: Page, value: string, button: string) {
  const ok = page.getByRole('button', { name: button, exact: true }).filter({ visible: true });
  await ok.waitFor();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type(value);
  await ok.click();
}

test('S259 ระบบใหม่: ทีมงานเปิดเครือแฟรนไชส์ว่าง HQ เข้าระบบด้วยรหัสชั่วคราว เพิ่มสาขาแรก หัวหน้าสาขาเข้าระบบได้ HQ ลืมรหัสแล้วทีมงานตั้งรหัสใหม่ให้', async ({ page }) => {
  test.slow();
  const chain = await openRealTestShop({ pkg: 'franchise', name: 'เครือ EV ทดลอง', owner: 'วิภา ใจงาม' });
  expect(chain.user).toBe('hq');
  const real = legacyApp(page, { dataset: 'franchise-trial', url: `${LEGACY_ORIGIN}/${chain.code}/`, restore: async () => {} });
  await real.open();
  await real.login(chain.user, chain.password);

  // No branch yet: HQ adds the first one, with its head's account.
  await page.getByRole('button', { name: '🏬 สาขา · รหัสผู้ใช้ · สิทธิ' }).click();
  await expect(page.getByText('0 สาขา', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: '+ เพิ่มสาขาใหม่ + ออกรหัส HB อัตโนมัติ' }).click();
  await answerPrompt(page, 'สาขาหลัก ลำปาง', 'สร้างสาขา + ออกรหัส');
  const created = page.getByText(/^สร้าง B001 · สาขาหลัก ลำปาง แล้ว — รหัส HB: b001 \/ \d{4}$/);
  await expect(created).toBeVisible();
  const headPass = (await created.innerText()).trim().split(' / ')[1];
  await real.settle();
  const fr = (await real.state() as any).FR;
  expect(fr.branches.map((b: any) => [b.code, b.name])).toEqual([['B001', 'สาขาหลัก ลำปาง']]);
  expect(fr.accounts.map((a: any) => [a.user, a.role])).toEqual([['hq', 'HQ'], ['b001', 'HB']]);
  await real.logout();

  // The head signs in to the new branch: its data is empty.
  await real.login('b001', headPass);
  await expect(page.getByText(/สาขาหลัก ลำปาง/).filter({ visible: true }).first()).toBeVisible();
  await real.settle();
  const branch = (await real.state() as any).DB;
  for (const list of ['cust', 'stock', 'quotes', 'receipts', 'stockCuts']) expect(branch[list], list).toEqual([]);
  await real.logout();

  // HQ's password forgotten: the old one is refused, the new one signs in.
  const reset = await resetTestPassword(chain.code);
  expect(reset.user).toBe('hq');
  expect(await real.loginRefused('hq', chain.password)).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await real.login('hq', reset.password);
  await expect(page.getByRole('button', { name: '🏬 สาขา · รหัสผู้ใช้ · สิทธิ' })).toBeVisible();
});
