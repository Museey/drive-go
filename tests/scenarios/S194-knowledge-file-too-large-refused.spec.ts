import { test, expect } from '../support/test';

test.use({ dataset: 'prox-trial' });

// New behaviour (task 3.11, owner's answer 11.4): a knowledge-library file over 5 MB, or a clip over 15 MB, is
// refused when it is picked, with a message to make it smaller. The legacy app took it and kept only its name
// ("… ใหญ่เกินเก็บในเครื่อง — จะบันทึกเป็นรายการอ้างอิง"). The server refuses such a file too (413).
const MB = 1024 * 1024;

test('S194 ระบบใหม่: แนบไฟล์คลังความรู้เกิน 5 MB หรือคลิปเกิน 15 MB ไม่รับ พร้อมข้อความให้ลดขนาด', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: /ห้องข้อมูลเทคนิค/ }).click();
  await page.getByRole('button', { name: '🌐 Publish Data · แบ่งปันเครือข่าย' }).click();
  await page.getByRole('button', { name: '+ เพิ่มบทความ / อัปโหลดคลิป' }).click();
  const input = page.getByLabel('แนบไฟล์บทความ (PDF / รูป / เอกสาร) หรือคลิปวิดีโอ');
  const info = page.locator('#lnFileInfo');

  await input.setInputFiles({ name: 'คู่มือซ่อมเกียร์.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(6 * MB, 0x25) });
  await expect(info).toHaveText('⚠ คู่มือซ่อมเกียร์.pdf (6.0 MB) ไฟล์ใหญ่เกิน 5 MB — กรุณาลดขนาดไฟล์ก่อนแนบ');
  await expect(page.getByText('ไฟล์ใหญ่เกิน 5 MB — กรุณาลดขนาดไฟล์ก่อนแนบ', { exact: true })).toBeAttached();
  await expect(info).not.toContainText('รายการอ้างอิง');
  expect(await input.inputValue()).toBe('');

  await input.setInputFiles({ name: 'ถอดเกียร์.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(16 * MB, 1) });
  await expect(info).toHaveText('⚠ ถอดเกียร์.mp4 (16.0 MB) คลิปใหญ่เกิน 15 MB — กรุณาลดขนาดคลิปก่อนแนบ');
  await expect(page.getByText('คลิปใหญ่เกิน 15 MB — กรุณาลดขนาดคลิปก่อนแนบ', { exact: true })).toBeAttached();

  // Saving now keeps a text article: no file, not even its name.
  await page.getByLabel('ชื่อเรื่อง *').fill('ขั้นตอนถอดเกียร์');
  await page.getByLabel('คำอธิบาย / สรุปเนื้อหา (ไม่แนบไฟล์ก็บันทึกเป็นบทความข้อความได้)').fill('ดูคลิปในกลุ่มไลน์ของอู่');
  await page.getByRole('button', { name: 'บันทึกเข้าคลังความรู้' }).click();
  await app.settle();
  const item = (await app.state() as any).DB.px.learn.find((x: any) => x.title === 'ขั้นตอนถอดเกียร์');
  expect(item).toMatchObject({ kind: 'note', fname: '', mime: '', data: null });

  // The server refuses such files whoever sends them.
  const status = await page.evaluate(async () => (await fetch('/api/files?key=garage.v22&use=knowledge', {
    method: 'POST', headers: { 'content-type': 'application/pdf' }, body: new Uint8Array(5 * 1024 * 1024 + 1) })).status);
  expect(status).toBe(413);
});
