import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

test.use({ dataset: 'prox-trial' });

// The ProX manual (tools/manual/content-prox.mjs): signing in on the ProX card, and what ProX adds to BaziX (P1, P2, the
// ProX central stock in menu 07). Those parts run on the DriveGo network, which is not open yet ("เร็ว ๆ นี้" on the
// website): the trial shop shows sample data.
test('21 DriveGo ProX', async ({ app, page }) => {
  await app.open();
  const at = new URL(page.url());
  await page.goto(`${at.origin}/login`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);   // the page's own entrance animation
  const card = page.getByRole('region', { name: 'DriveGo ProX', exact: true });
  await card.getByRole('button', { name: 'เข้าสู่ระบบ ProX', exact: true }).click();
  await page.getByLabel('รหัสร้าน', { exact: true }).fill('somchai-auto');
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill('dg1688');
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill('Somchai#2569');
  await card.evaluate(e => e.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await shot(page, '21-signin', { scroll: false, area: [card], pad: 16, mark: [[page.getByLabel('รหัสร้าน', { exact: true }), '2'], [page.getByLabel('รหัสผ่าน', { exact: true }), '3'],
    [card.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }), '3']] });

  await app.open();
  await app.loginAsOwner();
  const p1 = page.getByRole('button', { name: /^P1 DriveGo ProX/ });
  await p1.click();
  await app.settle();
  await shot(page, '21-p1', { scroll: false, mark: [[p1, '1'], [page.getByText('คิวจองจาก BOOK', { exact: true }).filter({ visible: true }).first(), '2']] });

  const p2 = page.getByRole('button', { name: /^P2 ห้องข้อมูลเทคนิค/ });
  await p2.click();
  await app.settle();
  await shot(page, '21-p2', { scroll: false, mark: [[page.getByText(/ProX Data · สเปคจากส่วนกลาง/).filter({ visible: true }).first(), '1'],
    [page.getByText(/Publish Data · แบ่งปันเครือข่าย/).filter({ visible: true }).first(), '2'],
    [page.getByText(/Private Data · เฉพาะภายในอู่/).filter({ visible: true }).first(), '3']] });

  await page.getByRole('button', { name: /^07 สต๊อกอะไหล่/ }).click();
  const central = page.getByRole('button', { name: '★ คลังกลาง ProX' });
  await central.click();
  await app.settle();
  await expect(page.getByText(/คลังสินค้ากลาง DriveGo ProX/).first()).toBeVisible();
  await shot(page, '21-central', { scroll: false, mark: [[central, '1'], [page.getByRole('button', { name: '+ เพิ่มเข้าทะเบียนอะไหล่' }).first(), '2'],
    [page.getByRole('button', { name: '+ แจ้งเพิ่มรายการสินค้าใหม่' }), '3']] });
});
