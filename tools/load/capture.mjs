// The load test's job (tools/load-test.mjs, docs/LOAD-TEST.md): one repair job done through the real screens, as a
// shop's front desk does it, with every save the browser sends to the server recorded, so k6 sends the same saves
// (tools/load/pilot.js). Also opens the shop once (the first sign-in of a shop whose data is older than FIFO lots
// moves its stock into lots, and the day's backup point is made), so that is not in the measurements.
//
// The job: a new quotation (a customer of the shop, one part in stock, one labour line) → approve it → the stock
// cut from it, paid in cash in full at once (the payment panel's "ปิดการขาย"), which issues the receipt.
import { chromium } from 'playwright';

// Signs in and waits until the browser has nothing more to save (the first open's saves).
async function signIn(page, url, user, pass) {
  await page.goto(url);
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor({ timeout: 120_000 });
  await page.getByPlaceholder('ชื่อผู้ใช้ อีเมล หรือเบอร์โทร').fill(user);
  await page.getByPlaceholder('กรอกรหัสผ่าน').fill(pass);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().waitFor({ timeout: 120_000 });
  await quiet(page);
}

// No request to the server for a while (window.storage saves shortly after a change).
async function quiet(page, ms = 2500) {
  let last = Date.now(), open = 0;
  const on = r => { if (r.url().includes('/api/') && !r.url().includes('/api/live')) { open++; last = Date.now(); } };
  const off = r => { if (r.url().includes('/api/') && !r.url().includes('/api/live')) { open--; last = Date.now(); } };
  page.on('request', on); page.on('requestfinished', off); page.on('requestfailed', off);
  try { while (open > 0 || Date.now() - last < ms) await page.waitForTimeout(200); }
  finally { page.off('request', on); page.off('requestfinished', off); page.off('requestfailed', off); }
}

// Opens the shop (warm-up only).
export async function openShop({ url, user, pass }) {
  const browser = await chromium.launch();
  try { await signIn(await browser.newPage(), url, user, pass); } finally { await browser.close(); }
}

// What a browser sends while it opens the shop and signs in, and during one repair job:
//   { pick, quoteNo, boot: [{ method, path, body, signedIn }], job: [{ step, body, answer }] }
// boot: every request to /api/ but the live stream (k6 opens it itself) and error reports, from the first page load
// until the browser is quiet after signing in (signedIn: after the sign-in). Its own first open is not the shop's
// first (openShop ran before), so boot has the day's ordinary open. job: the saves of garage.v22 of the second of two
// jobs (the first job of a shop may write a field the data has not had yet), with the server's answers.
export async function captureJob({ url, user, pass }) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const boot = [];
  let saves = [], step = 'sign in', quoteNo = '', signedIn = false, booting = true;
  page.on('request', r => {
    const u = new URL(r.url());
    if (!booting || !u.pathname.startsWith('/api/') || /^\/api\/(live|errors)\b/.test(u.pathname)) return;
    // (the password is not kept: k6 puts in the one it is given)
    const body = r.postData() ?? null;
    boot.push({ method: r.method(), path: u.pathname + u.search, body: body && body.split(JSON.stringify(pass).slice(1, -1)).join('__PASS__'), signedIn });
  });
  page.on('requestfinished', async r => {
    if (booting || r.method() !== 'POST' || !/\/api\/storage\/garage\.v22$/.test(new URL(r.url()).pathname)) return;
    const res = await r.response();
    saves.push({ step, body: JSON.parse(r.postData()), status: res.status(), answer: await res.json().catch(() => null) });
  });
  const visible = l => l.filter({ visible: true }).first();
  try {
    await page.goto(url);
    await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor({ timeout: 120_000 });
    await quiet(page);
    signedIn = true;
    await page.getByPlaceholder('ชื่อผู้ใช้ อีเมล หรือเบอร์โทร').fill(user);
    await page.getByPlaceholder('กรอกรหัสผ่าน').fill(pass);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().waitFor({ timeout: 120_000 });
    await quiet(page);
    booting = false;
    // A customer with a car and a part with enough stock, from the shop's own data.
    const pick = await page.evaluate(() => {
      const cust = DB.cust.find(c => (c.vehicles || []).length && c.tel);
      const part = DB.stock.find(s => s.qty >= 5 && s.code && s.pa > 0);
      return cust && part ? { tel: cust.tel, part: part.code } : null;
    });
    if (!pick) throw new Error('the shop has no customer with a car or no part with 5 or more in stock');

    for (let round = 1; round <= 2; round++) {
      saves = [];
      step = 'quote';
      await visible(page.getByRole('button', { name: /^03 ใบเสนอราคา/ })).click();
      await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
      const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
      await custBox.fill(pick.tel);
      await custBox.locator('..').getByText(pick.tel, { exact: true }).first().click();
      await page.getByPlaceholder('1.', { exact: true }).fill('ตรวจเช็กตามระยะ');
      await visible(page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' })).fill(pick.part);
      await page.getByRole('option', { name: new RegExp(pick.part) }).first().click();
      await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).click();
      const labor = page.getByRole('row').filter({ has: page.getByText('ค่าแรง', { exact: true }) }).filter({ has: page.getByRole('spinbutton') });
      await labor.getByRole('textbox').fill('ค่าแรงตรวจเช็ก');
      await labor.getByRole('spinbutton').nth(1).fill('350');
      await labor.getByRole('spinbutton').nth(1).press('Tab');
      await visible(page.getByRole('button', { name: 'บันทึก', exact: true })).click();
      await visible(page.getByRole('button', { name: 'ยกเลิกเอกสาร' })).waitFor();
      await quiet(page);

      step = 'approve';
      await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
      await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).waitFor({ state: 'hidden' });
      await quiet(page);
      quoteNo = await page.evaluate(() => DB.quotes[DB.quotes.length - 1].no);
      await visible(page.getByRole('button', { name: 'ปิด', exact: true })).click();

      // The stock cut from the quotation; the side bar's "บันทึก" opens the payment panel: paid in cash in full and
      // the sale closed (the cut and its payment).
      step = 'sale';
      await visible(page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ })).click();
      // (the sub-menu's number differs between the trial and the 36-month data)
      await visible(page.getByText(/^4\.\d ตัดสต็อกสินค้า$/)).click();
      await page.getByRole('button', { name: /^ใบเสนอราคาที่รอตัดสต็อก/ }).click();
      await visible(page.getByText(quoteNo, { exact: true })).click();
      await page.getByRole('button', { name: 'ชำระเงิน / บันทึก' }).click();
      await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
      await page.getByRole('button', { name: 'ปิดการขาย' }).click();
      await visible(page.getByText('บันทึกข้อมูลสำเร็จ')).waitFor();
      await quiet(page);
      await visible(page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' })).click();

      const bad = saves.filter(s => s.status !== 200);
      if (bad.length) throw new Error(`the server refused a save: ${bad.map(s => `${s.step} ${s.status} ${JSON.stringify(s.answer)}`).join('; ')}`);
      if (saves.map(s => s.step).join() !== 'quote,approve,sale') throw new Error(`unexpected saves: ${saves.map(s => s.step).join()}`);
    }
    return { shop: new URL(url).pathname.split('/').filter(Boolean)[0], pick, quoteNo, boot, job: saves.map(({ step, body, answer }) => ({ step, body, answer })) };
  } catch (e) {
    if (process.env.CAPTURE_SHOT) await page.screenshot({ path: process.env.CAPTURE_SHOT, fullPage: true }).catch(() => {});
    throw new Error(`the job stopped at "${step}": ${e.message}`);
  } finally {
    await browser.close();
  }
}
