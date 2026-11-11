import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { restoreLocalStorage } from '../support/browser.mjs';
import { openTestShopWith } from '../support/new-shop.mjs';

// New behaviour (SECURITY-REVIEW.md proposal 4, the owner's go of 2026-11-11): text typed into the program never runs
// as a script. esc() also escapes ', and a value inside a JS string of an onclick (a stock category, a category of
// the category manager, an account code, a topic) is JS-escaped first (jsq, frontend/CHANGES.md 148–149). The shop's
// data holds four kinds of attack text in names; the screens show them as text, nothing they carry runs, and the
// buttons that pass such a name (with an apostrophe too) still do their work.
const HIT = 'window.__xss=(window.__xss||0)+1';
const ATTACKS = {
  tag: `<img src=x onerror="${HIT}">`,
  jsString: `x');${HIT};//`,
  dq: `"><svg onload="${HIT}">`,
  sq: `' autofocus onfocus='${HIT}' x='`,
};
const CAT = `แอร์ ${ATTACKS.jsString}`;
const ODD = "O'Neil";

test('S286 ระบบใหม่: ข้อความโจมตีในชื่อลูกค้า สินค้า หมวด ผู้ขาย พนักงาน และรหัสบัญชี แสดงเป็นตัวอักษร ไม่ทำงานเป็นสคริปต์ ปุ่มที่ส่งชื่อเหล่านี้ยังทำงาน', async ({ page }) => {
  test.slow();
  const shop = await openTestShopWith('biz-trial', db => {
    db.cust[0].name = ATTACKS.tag; db.cust[1].name = ATTACKS.dq; db.cust[2].name = ATTACKS.sq;
    db.stock[0].name = ATTACKS.dq; db.stock[0].cat = CAT; db.stock[1].name = ATTACKS.sq; db.stock[2].cat = ODD;
    db.vendors[0].name = ATTACKS.tag; db.emp[0].name = ATTACKS.sq;
    db.cats = [...(db.cats || []), CAT, ODD];
    db.coa.push({ code: `9${ATTACKS.jsString}`, name: ATTACKS.tag, type: 'expense' });
  });
  const dialogs: string[] = [];
  page.on('dialog', d => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
  const app = legacyApp(page, { dataset: 'biz-trial', url: `${LEGACY_ORIGIN}/${shop.code}/`, restore: restoreLocalStorage });
  await app.loginAsOwner();
  const ran = () => page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0);

  // Every menu with the names in its lists, then the home page.
  for (const menu of [/^02 ข้อมูลลูกค้า/, /^05 ข้อมูลผู้ขาย/, /^09 งานบุคคล/, /^00 Mr\.DriveGo/]) {
    await page.getByRole('button', { name: menu }).click();
    await app.settle();
  }

  // The home page's row of a category passes it to the stock list, which filters on it (the chip shows in the row of
  // the category filtered on: the very name reached setCat). Then the summary's row of the category named O'Neil.
  await page.locator('#homeCatTbl').getByRole('row').filter({ hasText: CAT }).click();
  const sum = (name: string) => page.locator('#catSumTbl').getByRole('row').filter({ hasText: name });
  await expect(sum(CAT).getByText('กำลังกรอง')).toBeVisible();
  await expect(page.getByText(ATTACKS.dq, { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await sum(ODD).click();
  await expect(sum(ODD).getByText('กำลังกรอง')).toBeVisible();

  // The category manager: deleting the category named O'Neil works.
  await page.getByRole('button', { name: 'ตั้งค่าสินค้าและอะไหล่' }).click();
  const odd = page.getByRole('row').filter({ hasText: ODD }).filter({ visible: true }).filter({ has: page.getByText(/^(มาตรฐาน|เพิ่มเอง)$/) });
  await odd.getByRole('button', { name: 'ลบ' }).click();
  await page.getByRole('button', { name: 'ลบหมวด', exact: true }).click();
  await expect(odd).toHaveCount(0);

  // The chart of accounts: the account whose code carries a JS string opens for editing (its name, the tag, in the box).
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ ผังบัญชี', exact: true }).click();
  const acc = page.locator('#coaTbl').getByRole('row').filter({ hasText: ATTACKS.jsString });
  await expect(acc).toContainText(ATTACKS.tag);
  await acc.getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.locator('input:visible').first()).toHaveValue(ATTACKS.tag);

  expect(await ran(), 'attack text ran as a script').toBe(0);
  expect(dialogs).toEqual([]);
});
