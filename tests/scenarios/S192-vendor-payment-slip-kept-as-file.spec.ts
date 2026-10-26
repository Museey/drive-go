import { test, expect } from '../support/test';
import { LINK, fetchFile, sha256 } from '../support/files';

// New behaviour (task 3.11, decision R19-ค): the slip picture attached to a vendor payment (ชำระเงินเจ้าหนี้,
// the settlement window of 47.js) is kept by the server as a file; DB.paySlips[<settlement>] holds its link
// instead of the picture, the rest of the payment is what the legacy app writes (as in S31). No scenario
// uploaded a payment slip before.
test('S192 ระบบใหม่: แนบสลิปตอนชำระเงินเจ้าหนี้ด้วยการโอน สลิปเก็บเป็นไฟล์ที่ server ข้อมูลการชำระเก็บลิงก์', async ({ app, page }) => {
  await app.loginAsOwner();

  // As S31: buy brake pads on 15 days' credit from หจก. ไทยพาร์ท ซัพพลาย and approve them into stock.
  await page.getByText('รายจ่าย / ซื้อสินค้า', { exact: true }).click();
  await page.getByRole('button', { name: '+ สร้างใบรับสินค้าใหม่' }).click();
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('ไทยพาร์ท');
  await page.getByText('หจก. ไทยพาร์ท ซัพพลาย', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('ค้นหาสินค้า — พิมพ์ชื่อ / รหัส / OEM / แบรนด์ แล้วเลือก').filter({ visible: true }).click();
  await page.keyboard.type('BR-001');
  await page.getByText('BR-001 · ผ้าเบรกหน้า Toyota Revo').filter({ visible: true }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').nth(0).fill('10');
  await line.getByRole('spinbutton').nth(1).fill('870');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  await page.getByText('บัญชี - การเงิน', { exact: true }).click();
  await page.getByRole('button', { name: 'เจ้าหนี้ (ค้างจ่าย)' }).click();
  await page.getByRole('button', { name: '+ ชำระเงินเจ้าหนี้' }).click();
  await page.getByRole('button').filter({ hasText: 'หจก. ไทยพาร์ท ซัพพลาย' }).filter({ visible: true }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-RC261000002' }).check();
  await page.getByRole('button', { name: 'โอนเต็มจำนวน' }).click();
  await page.getByLabel('โอนจากบัญชีร้าน *').filter({ visible: true })
    .selectOption({ label: 'ธนาคารกสิกรไทย 123-4-56789-0 (หจก.เอกหม้อน้ำ)' });
  await page.getByLabel('เลขอ้างอิง / เลขที่สลิป').filter({ visible: true }).fill('KB2610130001');

  // The transfer line's own "แนบสลิป": the picture opens full screen at once (legacy), shrunk to a JPEG.
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'แนบสลิป' }).click();
  await (await chooser).setFiles('tests/assets/S192-transfer-slip.png');
  const viewer = page.locator('#pkgStView');
  const shown = await viewer.locator('img').first().getAttribute('src');
  expect(shown).toMatch(/^data:image\/jpeg;base64,/);
  await viewer.getByRole('button', { name: 'ปิด' }).click();

  await page.getByRole('button', { name: 'บันทึกจ่ายชำระ' }).click();
  await page.getByRole('button', { name: 'ยืนยันบันทึกจ่ายชำระ ฿9,309.00' }).click();
  await expect(page.getByText('บันทึกชำระ 1 ใบ รวม 9,309.00 บาทแล้ว')).toBeAttached();
  await app.settle();

  const db = (await app.state() as any).DB;
  const pay = db.purchases.find((p: any) => p.no === 'MA-RC261000002').payments[0];
  expect(pay.transLines[0]).toMatchObject({ ref: 'KB2610130001', slip: true });
  const slips = db.paySlips[pay.payId];
  expect(slips).toEqual([{ url: expect.stringMatching(LINK), name: 'S192-transfer-slip.png', line: 1 }]);
  expect((await app.serverDB()).paySlips[pay.payId]).toEqual(slips);
  // The file is the picture the app made of the slip, named by its SHA-256.
  const file = await fetchFile(page, slips[0].url);
  const made = Buffer.from(shown!.slice(shown!.indexOf(',') + 1), 'base64');
  expect({ status: file.status, type: file.type, same: file.bytes.equals(made) }).toEqual({ status: 200, type: 'image/jpeg', same: true });
  expect(slips[0].url).toBe(`/api/files/${sha256(made)}`);
  expect(JSON.stringify(db)).not.toContain('data:image/jpeg');
});
