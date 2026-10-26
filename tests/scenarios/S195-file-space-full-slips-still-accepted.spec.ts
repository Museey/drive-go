import { test, expect } from '../support/test';
import { LINK, fillSpace } from '../support/files';

// New behaviour (task 3.11, owner's answers 11.2): each shop has 2 GB for its files. Menu 10 says how much is
// used ("ใช้พื้นที่ไฟล์ … MB จาก 2 GB", under the size of the data). Once it is used up, a product picture
// (and a knowledge-library file or clip) is refused when it is picked, with a message; payment slips and 50 ทวิ
// pictures are accounting evidence and are still accepted. (The test fills the space with one file the data
// does not refer to, a stand-in for 2 GB of pictures.)
test('S195 ระบบใหม่: เมนู 10 บอกพื้นที่ไฟล์ที่ใช้ พื้นที่เต็มแล้วแนบรูปสินค้าไม่ได้ แต่แนบสลิปการชำระเงินได้', async ({ app, page }) => {
  await app.loginAsOwner();
  const settings = async () => {
    await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
    const info = page.locator('#storeInfo');
    await info.scrollIntoViewIfNeeded();
    return info;
  };
  await expect(await settings()).toContainText('ใช้พื้นที่ไฟล์ 0.00 MB จาก 2 GB');

  await fillSpace(page, 0);
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await expect(await settings()).toContainText('ใช้พื้นที่ไฟล์ 2048.00 MB จาก 2 GB');

  // A product picture: refused at once, nothing saved.
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await search.fill('MS-995');
  await search.press('Enter');
  const row = page.getByRole('row').filter({ hasText: 'น้ำยาล้างระบบเชื้อเพลิง' }).filter({ visible: true });
  await row.getByRole('button', { name: 'ไม่มีรูป' }).click();
  const before = await app.state();
  const chooser = page.waitForEvent('filechooser');
  await page.getByText('อัปโหลดรูปใหม่ / เปลี่ยนรูป').click();
  await (await chooser).setFiles('tests/assets/S52-fuel-system-cleaner.png');
  await expect(page.getByText('พื้นที่ไฟล์ของร้านเต็มแล้ว (2 GB) — แนบรูปสินค้า ไฟล์คลังความรู้ และคลิปไม่ได้ ลบไฟล์ที่ไม่ใช้แล้วก่อน', { exact: true })).toBeAttached();
  await expect(page.getByText('ยังไม่มีรูปสินค้า')).toBeVisible();
  await app.settle();
  expect(await app.state()).toEqual(before);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // A customer's transfer slip: accepted.
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  const sale = page.getByRole('row').filter({ hasText: 'MA-SA261000009' }).filter({ visible: true });
  await sale.getByRole('button', { name: 'รับชำระ', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'หัก ณ ที่จ่ายของ MA-SA261000009' }).waitFor();
  await page.getByRole('button', { name: 'ได้รับแล้ว' }).click();
  await page.getByRole('button', { name: 'โอนเต็มจำนวน' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'บัญชีร้านที่รับโอน' })
    .selectOption({ label: 'ธนาคารไทยพาณิชย์ 456-7-89012-3 (หจก.เอกหม้อน้ำ)' });
  await page.getByRole('textbox', { name: 'เลขอ้างอิง / เลขที่สลิป' }).fill('SCB-771020');
  const slipChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'แนบสลิป' }).click();
  await (await slipChooser).setFiles('tests/assets/S192-transfer-slip.png');
  await page.locator('#pkgStView').getByRole('button', { name: 'ปิด' }).click();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ยืนยันบันทึกรับชำระ ฿3,676.40' }).click();
  await expect(page.getByText('บันทึกชำระ 1 ใบ รวม 3,676.40 บาทแล้ว')).toBeAttached();
  await app.settle();
  const db = (await app.state() as any).DB;
  const pay = db.receipts.flatMap((r: any) => r.payments || []).find((p: any) => p.ref === 'SCB-771020');
  expect(db.paySlips[pay.payId]).toEqual([{ url: expect.stringMatching(LINK), name: 'S192-transfer-slip.png', line: 1 }]);
  expect((await app.serverDB()).paySlips[pay.payId]).toEqual(db.paySlips[pay.payId]);
  expect(db.stock.find((s: any) => s.code === 'MS-995').img).toBeUndefined();
});
