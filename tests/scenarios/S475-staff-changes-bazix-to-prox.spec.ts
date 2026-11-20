import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { addTestStaff, appCode } from '../support/new-shop.mjs';

// New behaviour (the owner's decisions of 2026-11-20: DriveGo's staff change a shop's package, the shop keeps its data
// and its licence's dates, back to BaziX only with one branch; server/lib/shop-open.ts changePackage, tools/shop-admin.mjs
// package). A BaziX shop cannot add a second branch (S460: "ติดต่อทีมงานเพื่อเปลี่ยนเป็น DriveGo ProX"); staff press
// "เปลี่ยนเป็น ProX" on the staff page; the shop's open screen signs in again and is ProX, with the same data, and adds
// the branch. Back to Biz is then refused: the shop has two branches.
const ONE = 'DriveGo BaziX ใช้ได้ 1 สาขา — ถ้าต้องการหลายสาขา ติดต่อทีมงานเพื่อเปลี่ยนเป็น DriveGo ProX';

test('S475 ระบบใหม่: ทีมงานเปลี่ยนร้าน BaziX เป็น ProX ที่หน้าเว็บทีมงาน ร้านเข้าระบบใหม่ ข้อมูลและวันใช้งานเท่าเดิม เพิ่มสาขาได้ แล้วเปลี่ยนกลับเป็น BaziX ไม่ได้เพราะมีสองสาขา', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const code = decodeURIComponent(new URL(page.url()).pathname.split('/')[1]);
  const before = (await app.serverDB()) as Record<string, unknown[]>;
  const addBranch = async () => {
    await page.getByText('ตั้งค่าเพิ่มเติม', { exact: true }).click();
    await page.getByRole('button', { name: '11.4 สาขา / คลังสินค้า' }).click();
    await page.getByPlaceholder('เช่น B2').fill('BN');
    await page.getByPlaceholder('เช่น สาขาบางนา').fill('สาขาบางนา');
    await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  };
  await addBranch();
  await expect(page.locator('#toast')).toHaveText(ONE);

  // Staff, in a tab of their own: the shop's page, then "เปลี่ยนเป็น ProX".
  const staff = await addTestStaff({ ready: true });
  const ops = await page.context().newPage();
  await ops.goto(`${LEGACY_ORIGIN}/ops/`);
  await ops.getByLabel('ชื่อผู้ใช้').fill(staff.login);
  await ops.getByLabel('รหัสผ่าน').fill(staff.password);
  await ops.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await ops.getByLabel('รหัส 6 หลัก').fill(appCode(staff.secret));
  await ops.getByRole('button', { name: 'ยืนยัน' }).click();
  await ops.getByRole('searchbox', { name: 'ค้นหา' }).fill(code);
  await ops.getByRole('row').filter({ hasText: code }).click();
  const info = ops.locator('dl.info');
  await expect(info).toContainText('แพ็กเกจBiz');
  const dates = (await info.textContent())!.match(/วันเริ่ม.*วันลบข้อมูล/)![0];
  await ops.getByRole('button', { name: 'เปลี่ยนเป็น ProX' }).click();
  const panel = ops.locator('.panel');
  await expect(panel).toContainText('ข้อมูลของร้านอยู่ครบ วันเริ่มและวันสุดท้ายเท่าเดิม (ส่วนต่างราคาตกลงกับร้านนอกระบบ) ทุกเครื่องที่เปิดร้านอยู่ต้องเข้าระบบใหม่');
  await panel.getByLabel('หมายเหตุ').fill('ร้านขอเพิ่มสาขา จ่ายส่วนต่างแล้ว');
  await panel.getByRole('button', { name: 'เปลี่ยนเป็น ProX' }).click();
  await expect(ops.getByText('เปลี่ยนเป็น ProX แล้ว', { exact: true })).toBeVisible();
  await expect(info).toContainText('แพ็กเกจProX');
  expect((await info.textContent())!.match(/วันเริ่ม.*วันลบข้อมูล/)![0]).toBe(dates);
  await expect(ops.getByRole('row').filter({ hasText: 'เปลี่ยนแพ็กเกจ' })).toContainText('Biz → ProX · หมายเหตุ: ร้านขอเพิ่มสาขา จ่ายส่วนต่างแล้ว');

  // The shop's screen: signed out; signed in again it opens as ProX with the same data, and the branch is added.
  await page.bringToFront();
  await page.reload();
  await expect(page.getByPlaceholder('กรอกรหัสผ่าน')).toBeVisible();
  await app.login('dg1688', '123456');
  expect(new URL(page.url()).searchParams.get('package')).toBe('prox');
  expect(await page.evaluate('window.PKG_PLAN')).toBe('prox');
  const now = (await app.serverDB()) as Record<string, unknown[]>;
  for (const k of ['cust', 'stock', 'quotes', 'receipts', 'stockCuts', 'purchases', 'emp'] as const)
    expect(now[k].length, k).toBe(before[k].length);
  await addBranch();
  await app.settle();
  expect(((await app.serverDB()) as { branches: { code: string }[] }).branches.map(b => b.code)).toEqual(['MA', 'BN']);

  // Back to Biz: refused, the shop has two branches.
  await ops.bringToFront();
  await ops.getByRole('button', { name: 'เปลี่ยนเป็น Biz' }).click();
  await expect(panel).toContainText('เปลี่ยนเป็น Biz ได้เฉพาะร้านที่มีสาขาเดียว');
  await panel.getByRole('button', { name: 'เปลี่ยนเป็น Biz' }).click();
  await expect(ops.getByRole('alert')).toHaveText('ร้านนี้มี 2 สาขา BaziX มีได้สาขาเดียว จึงเปลี่ยนเป็น BaziX ไม่ได้');
  await expect(info).toContainText('แพ็กเกจProX');
});
