import { test } from '../support/test';

test.use({ dataset: 'prox-trial' });

test('S84 บันทึกหน้าร้านบนแอป BOOK (ป้ายรูปเกิน 10 รูป ระบบเก็บแค่ 10 รูปแรก)', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  await page.getByRole('button', { name: 'หน้าร้านบนแอป BOOK' }).click();
  await golden.step('แท็บหน้าร้านบนแอป BOOK');

  await page.getByLabel('คำบรรยายร้าน (3–4 บรรทัด ที่ลูกค้าเห็น)').fill(
    'อู่ซ่อมรถครบวงจร รับซ่อมทั้งรถสันดาป ไฮบริด และ EV\nช่างประสบการณ์กว่า 15 ปี มีเครื่องมือวิเคราะห์ระบบไฟฟ้าแรงดันสูง\nเปิดทุกวัน 08:00–18:00 จอดรถรอได้ มีห้องรับรองติดแอร์');
  await page.getByLabel('LINE ID').fill('@drivegoservice');
  await page.getByLabel('Facebook').fill('facebook.com/drivegoservice');
  await page.getByLabel('ป้ายชื่อรูปภาพร้าน (สูงสุด 10 รูป — คั่นด้วย , )').fill(
    'หน้าร้าน, โซนซ่อม ,ลิฟต์ยกรถ,  ห้องรับรอง, , โซนแอร์, โซนช่วงล่าง, โซน EV, ห้องเครื่องมือ, ลานจอด, ป้ายร้าน, มุมกาแฟ, ห้องน้ำ');
  await golden.step('กรอกคำบรรยาย LINE Facebook และป้ายรูป 12 รูป');
  await golden.screen('shop-form-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก — ลูกค้าเห็นทันที' }).click();
  await golden.step('หลังกดบันทึก');
  await golden.stateChange('save-shop', before);
  await golden.screen('shop-after-save');

  // ออกไปแท็บอื่นแล้วกลับมา: ฟอร์มต้องแสดงค่าที่บันทึกไว้
  await page.getByRole('button', { name: 'คิวจองจาก BOOK' }).click();
  await page.getByRole('button', { name: 'หน้าร้านบนแอป BOOK' }).click();
  await golden.step('ออกไปแท็บคิวจองแล้วกลับมาหน้าร้าน');
  await golden.screen('shop-reopened');
});
