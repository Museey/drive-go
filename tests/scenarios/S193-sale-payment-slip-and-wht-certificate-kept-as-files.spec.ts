import { test, expect } from '../support/test';
import { LINK, fetchFile } from '../support/files';

// New behaviour (task 3.11, decision R19-ค): a customer pays MA-SA261000009 (as S22) by transfer with the slip
// attached, withholding 3% whose certificate (50 ทวิ) arrives later; when it arrives its picture is attached in
// 4.4 ใบหัก ณ ที่จ่าย. Both pictures are kept by the server as files: DB.paySlips[<settlement>] and
// DB.whtDocs[<payment>] hold their links instead of the pictures, and "ดูรูป" shows the certificate from its
// link. No scenario uploaded a slip or a 50 ทวิ picture before.
test('S193 ระบบใหม่: สลิปโอนของลูกค้าและรูปหนังสือรับรอง 50 ทวิ ที่ได้รับภายหลัง เก็บเป็นไฟล์ที่ server ข้อมูลเก็บลิงก์', async ({ app, page }) => {
  await app.loginAsOwner();

  const row = page.getByRole('row').filter({ hasText: 'MA-SA261000009' }).filter({ visible: true });
  await row.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000009' }).waitFor();
  await page.getByRole('button', { name: 'ยังไม่ได้รับ — ตามทีหลัง' }).click();
  await page.getByRole('button', { name: 'โอนเต็มจำนวน' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'บัญชีร้านที่รับโอน' })
    .selectOption({ label: 'ธนาคารไทยพาณิชย์ 456-7-89012-3 (หจก.เอกหม้อน้ำ)' });
  await page.getByRole('textbox', { name: 'เลขอ้างอิง / เลขที่สลิป' }).fill('SCB-771020');
  let chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'แนบสลิป' }).click();
  await (await chooser).setFiles('tests/assets/S192-transfer-slip.png');
  await page.locator('#pkgStView').getByRole('button', { name: 'ปิด' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ยืนยันบันทึกรับชำระ ฿3,676.40' }).click();
  await expect(page.getByText('บันทึกชำระ 1 ใบ รวม 3,676.40 บาทแล้ว')).toBeAttached();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.4 ใบหัก ณ ที่จ่าย' }).click();
  const wht = page.getByRole('row').filter({ hasText: 'MA-SA261000009' }).filter({ visible: true });
  await expect(wht).toContainText('ยังไม่ได้รับ');
  await wht.getByRole('button', { name: 'ได้รับแล้ว' }).click();
  const got = page.locator('#mWhtGot');
  chooser = page.waitForEvent('filechooser');
  await got.getByRole('button', { name: 'แนบรูป' }).click();
  await (await chooser).setFiles('tests/assets/S193-wht-certificate.png');
  await expect(got.getByRole('img', { name: 'รูปหนังสือรับรอง' })).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await got.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByText('บันทึกแล้ว — ได้รับหนังสือรับรอง')).toBeAttached();
  await app.settle();

  const db = (await app.state() as any).DB;
  const pay = db.receipts.flatMap((r: any) => r.payments || []).find((p: any) => p.wht && p.ref === 'SCB-771020');
  expect(pay.wht).toMatchObject({ amt: 90, got: true, img: true });
  expect(db.paySlips[pay.payId]).toEqual([{ url: expect.stringMatching(LINK), name: 'S192-transfer-slip.png', line: 1 }]);
  expect(db.whtDocs[pay.id]).toEqual({ url: expect.stringMatching(LINK), name: 'S193-wht-certificate.png' });
  const server = await app.serverDB();
  expect([server.paySlips[pay.payId], server.whtDocs[pay.id]]).toEqual([db.paySlips[pay.payId], db.whtDocs[pay.id]]);
  for (const url of [db.paySlips[pay.payId][0].url, db.whtDocs[pay.id].url])
    expect(await fetchFile(page, url).then(f => [f.status, f.type])).toEqual([200, 'image/jpeg']);

  // "ดูรูป" opens the certificate from its link.
  await wht.getByRole('button', { name: 'ดูรูป' }).click();
  await expect(page.locator('#pkgStView img').first()).toHaveAttribute('src', db.whtDocs[pay.id].url);
});
