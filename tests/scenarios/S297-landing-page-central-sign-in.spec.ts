import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (the owner's decisions of 2026-11-17, docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง"): the system's own
// address (/) is DriveGo's landing page, with a sign-in button and LINE; /login signs in with the shop code, user and
// password on one page, then opens that shop as that person, through the shop page's own sign-in. A wrong password gets
// the shop's own message; a user or a shop that does not exist gets one message that does not say which part was wrong.
// The device keeps the shop code for next time. A shop's own address works as before.
// Owner 2026-11-17 (sales): the page has one card per package (BaziX, ProX, Franchise) and the form opens in the card
// picked; right sign-in on another package's card is refused with the card to use (S459: ProX and Franchise shops).
// The landing page is the team's design (same day): Thai and English, what the system does not do yet tagged "เร็ว ๆ นี้",
// a demo request summed up for the visitor to send on LINE (nothing stored); since 2026-11-20 a sign-up for a trial (S474).
const signIn = async (page: Page, code: string, user: string, pass: string) => {
  await page.getByLabel('รหัสร้าน').fill(code);
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill(user);
  await page.getByLabel('รหัสผ่าน').fill(pass);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
};

test('S297 ระบบใหม่: หน้าแรกของเว็บมีปุ่มเข้าสู่ระบบ หน้าเข้าระบบกลางมีการ์ดของ 3 แพ็กเกจ เลือกการ์ด Biz แล้วกรอกรหัสร้าน ชื่อผู้ใช้ รหัสผ่าน เข้าร้านของตัวเองในนามเจ้าของร้าน รหัสผิดหรือผิดการ์ดถูกปฏิเสธ และเครื่องจำรหัสร้าน', async ({ app, page }) => {
  // The test's own shop and the system's address.
  await app.open();
  const at = new URL(page.url()), code = at.pathname.split('/')[1], origin = at.origin;

  // Anything the pages' Content-Security-Policy blocks (an inline style or script left in the design's code would stop its
  // animations: the team's feedback of 2026-11-19). The test browser's own start-up style (tests/support/browser.mjs) has no
  // file and is left out.
  const csp: string[] = [];
  page.on('console', m => { if (/Content Security Policy/.test(m.text()) && m.location().url) csp.push(`${m.location().url}:${m.location().lineNumber} ${m.text()}`); });

  // The landing page.
  await page.goto(`${origin}/`);
  await expect(page).toHaveTitle('DriveGo X · ระบบบริหารอู่และศูนย์บริการรถยนต์บน Cloud');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveText('ข้อมูลเพื่อการจัดการที่ดี นำสู่ความสำเร็จ');
  await expect(page.getByRole('link', { name: 'LINE Official' })).toHaveAttribute('href', 'https://lin.ee/tV7nV8x');
  // What the system does not do yet carries its tag (here the API row of the comparison table).
  await expect(page.getByRole('row', { name: /เชื่อมต่อระบบภายนอก \(API\) เร็ว ๆ นี้/ })).toBeAttached();
  // English, and back to Thai.
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(h1).toHaveText('Accurate information leads to successful management');
  await expect(page.getByRole('row', { name: /External system connection \(API\) Coming soon/ })).toBeAttached();
  await page.getByRole('button', { name: 'TH', exact: true }).click();
  await expect(h1).toHaveText('ข้อมูลเพื่อการจัดการที่ดี นำสู่ความสำเร็จ');
  // The team's update of 2026-11-18: the package cards' tags, a privacy section with the full policy behind it (/privacy,
  // also linked from the demo form and the footer), and the company's name and address in the footer. The design's own
  // pages are in the menus (owner 2026-11-18): Test Drive and the articles (S466).
  await expect(page.locator('#pk')).toContainText('Top PerformanceSystem');
  const privacy = page.locator('#privacy');
  await expect(privacy.getByRole('heading', { name: 'นโยบายความเป็นส่วนตัว', exact: true })).toBeVisible();
  await expect(privacy.getByRole('link', { name: 'sales@drivegox.com' })).toHaveAttribute('href', 'mailto:sales@drivegox.com');
  await expect(privacy.getByText('ถอนความยินยอม', { exact: true })).toBeVisible();
  await expect(privacy.getByRole('link', { name: 'อ่านนโยบายฉบับเต็ม' })).toHaveAttribute('href', '/privacy');
  await expect(page.locator('#demoForm').getByRole('link', { name: 'นโยบายความเป็นส่วนตัว' })).toHaveAttribute('href', '/privacy');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'นโยบายความเป็นส่วนตัว' })).toHaveAttribute('href', '/privacy');
  await expect(footer.getByRole('link', { name: 'Test Drive', exact: true })).toHaveAttribute('href', '/testdrive');
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link'))
    .toHaveText(['ระบบนิเวศ', 'แพ็กเกจ', 'Test Drive', 'บทความน่ารู้', 'ติดต่อ']);
  await expect(page.locator('#show').getByRole('link', { name: 'Test Drive ดูภาพหน้าจอจริงทั้ง 58 หน้าจอ' })).toHaveAttribute('href', '/testdrive');
  await expect(footer.getByText('บริษัท ไดร์ฟบิซ เมคคาไลซ์ โซลูชั่น จำกัด', { exact: true })).toBeVisible();
  await expect(footer.getByText('เลขที่ 66 ซอยแสมดำ 13 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพมหานคร 10150', { exact: true })).toBeVisible();
  // Every link goes somewhere that exists: a part of this page, sign-in, the design's pages, LINE, the phone or the e-mail.
  for (const href of await page.locator('body a[href]').evaluateAll(as => as.map(a => a.getAttribute('href') ?? ''))) {
    expect(href).toMatch(/^(#[a-z]+|\/(login|testdrive|articles|privacy)|https:\/\/lin\.ee\/tV7nV8x|tel:\+66821087000|mailto:sales@drivegox\.com)$/);
    if (href.startsWith('#')) await expect(page.locator(href)).toHaveCount(1);
  }
  // On a phone (owner 2026-11-18): the section links, sign-in and the demo button are behind the menu button, a link
  // closes the menu; the comparison table shows both packages without swiping.
  const desk = page.viewportSize()!;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'เมนู', exact: true }).click();
  const menu = page.getByRole('navigation', { name: 'Main' });
  await expect(menu.getByRole('link')).toHaveText(['ระบบนิเวศ', 'แพ็กเกจ', 'Test Drive', 'บทความน่ารู้', 'ติดต่อ', 'เข้าระบบ', 'ทดลองใช้งานฟรี']);
  await menu.getByRole('link', { name: 'แพ็กเกจ', exact: true }).click();
  await expect(menu).toBeHidden();
  const table = page.getByRole('table');
  await expect(table.getByRole('columnheader')).toHaveText(['ความสามารถ', 'BaziX', 'ProX']);
  expect(await page.locator('#cmp').evaluate(box => box.scrollWidth - box.clientWidth)).toBe(0);
  await page.setViewportSize(desk);
  // The demo request became a sign-up for a trial (owner 2026-11-20; the whole flow: S474).
  await expect(page.locator('#contact').getByRole('heading', { name: 'ลงทะเบียนเพื่อทดลองใช้ DriveGo X' })).toBeVisible();
  await page.getByRole('link', { name: 'เข้าระบบ', exact: true }).first().click();
  await expect(page).toHaveURL(`${origin}/login`);
  // The sign-in page follows the team's design (owner 2026-11-19): its heading, cards and the garage drawing behind them.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('เข้าสู่ระบบ DriveGo');
  await expect(page.getByText('เลือกระบบที่อู่ของคุณสมัครใช้งาน แล้วเข้าสู่หน้าลงชื่อเข้าใช้ของระบบนั้น')).toBeVisible();
  for (const name of ['DriveGo BaziX', 'DriveGo ProX', 'DriveGo-Franchise'])
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'DriveGo ProX' }).getByText('Top Performance System')).toBeVisible();
  await expect(page.locator('#garage path').first()).toBeAttached();
  // The design's animations run: nothing of theirs was blocked by the page's CSP (which allows no inline styles).
  expect(await page.evaluate(() => document.getAnimations().map(a => (a as CSSAnimation).animationName)))
    .toEqual(expect.arrayContaining(['draw', 'fade', 'spin', 'flow', 'nodep', 'ring', 'lift', 'roll']));
  expect(csp).toEqual([]);
  await expect(page.locator('#help').getByRole('link', { name: 'เปิด Test Drive คู่มือภาพออนไลน์ทุกหน้าจอ' })).toHaveAttribute('href', '/testdrive');
  for (const href of await page.locator('body a[href]').evaluateAll(as => as.map(a => a.getAttribute('href') ?? '')))
    expect(href).toMatch(/^(\/|\/#[a-z]+|\/(login|testdrive|articles|privacy)|https:\/\/lin\.ee\/tV7nV8x|tel:\+66821087000|mailto:sales@drivegox\.com|\/site\/manual\/drivego-(bazix|prox|franchise)-manual\.pdf)$/);
  // The user manuals of the three packages (owner 2026-11-19): each link downloads its PDF.
  const manuals = page.locator('#man').getByRole('link');
  await expect(manuals).toHaveText(['คู่มือ DriveGo BaziXPDF', 'คู่มือ DriveGo ProXPDF', 'คู่มือ DriveGo-FranchisePDF']);
  for (const href of await manuals.evaluateAll(as => as.map(a => a.getAttribute('href') ?? ''))) {
    const r = await page.request.get(origin + href);
    expect([r.status(), r.headers()['content-type'], (await r.body()).subarray(0, 5).toString()]).toEqual([200, 'application/pdf', '%PDF-']);
  }
  // No form until a card is picked; picked, it opens in that card.
  await expect(page.getByLabel('รหัสร้าน')).toBeHidden();
  await page.getByRole('button', { name: 'เข้าสู่ระบบ BaziX', exact: true }).click();
  const biz = page.getByRole('region', { name: 'DriveGo BaziX' });
  await expect(biz.getByLabel('รหัสร้าน')).toBeVisible();
  await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ BaziX', exact: true })).toBeHidden();
  await expect(page.getByLabel('รหัสร้าน')).toHaveValue('');

  // Refused: an empty form, a wrong password, a shop that does not exist; the page stays.
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('กรุณากรอกรหัสร้าน ชื่อผู้ใช้ และรหัสผ่าน');
  await signIn(page, code, 'dg1688', 'not-the-password');
  await expect(page.getByRole('alert')).toHaveText('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');   // the shop's own message, as at its address
  await signIn(page, code, 'nobody', '123456');
  await expect(page.getByRole('alert')).toHaveText('รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
  await signIn(page, 'no-such-shop', 'dg1688', '123456');
  await expect(page.getByRole('alert')).toHaveText('รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
  await expect(page).toHaveURL(`${origin}/login`);

  // Right, but on the ProX card: refused, with the card to use; what was typed moves with the form.
  await page.getByRole('button', { name: 'เข้าสู่ระบบ ProX', exact: true }).click();
  await expect(page.getByRole('region', { name: 'DriveGo ProX' }).getByLabel('รหัสร้าน')).toHaveValue('no-such-shop');
  await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ BaziX', exact: true })).toBeVisible();
  await signIn(page, code, 'dg1688', '123456');
  await expect(page.getByRole('alert')).toHaveText('ร้านนี้ใช้แพ็กเกจ DriveGo BaziX — กรุณาเข้าสู่ระบบที่การ์ด DriveGo BaziX');
  await expect(page).toHaveURL(`${origin}/login`);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ BaziX', exact: true }).click();
  await expect(page.getByRole('alert')).toBeHidden();

  // Right: the shop opens, signed in as its owner; what was handed over is gone.
  await signIn(page, code, 'dg1688', '123456');
  await page.waitForURL(u => u.pathname === `/${code}/`);
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
  await expect(page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^00 Mr\.DriveGo/ })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('dg_signin'))).toBeNull();

  // Signed out, the sign-in page has the shop code already; signing in again opens the shop.
  // (a Biz shop signs out at once, S101)
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.settle();
  await page.goto(`${origin}/login`);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ BaziX', exact: true }).click();
  await expect(page.getByLabel('รหัสร้าน')).toHaveValue(code);
  await page.getByLabel('ชื่อผู้ใช้ / อีเมล / เบอร์โทร').fill('dg1688');
  await page.getByLabel('รหัสผ่าน').fill('123456');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await page.waitForURL(u => u.pathname === `/${code}/`);
  await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
  await app.settle();
});
