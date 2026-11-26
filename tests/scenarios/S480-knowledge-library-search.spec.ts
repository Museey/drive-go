import { test, expect } from '../support/test';

test.use({ dataset: 'prox-trial' });

// New behaviour (the owner, 2026-11-26: "ทำเลยครับ ใช้ข้อความตามที่เสนอ"): the knowledge library of P2 ห้องข้อมูลเทคนิค
// (tabs Publish Data and Private Data) has a search box, which the legacy app does not. Every word typed must be in an
// entry's title, details, category, author or file name, upper or lower case alike; it works together with the
// category chips, and the count beside the heading still counts the whole tab; when it finds nothing in a category
// that has entries it says "ไม่พบเนื้อหาที่ตรงกับคำค้น" (frontend/CHANGES.md 183–184). The box is
// left out of the screenshots compared with the legacy goldens (tests/support/screenshot-new-items.css).
test('S480 ระบบใหม่: ค้นหาในคลังความรู้ Private Data และ Publish Data ด้วยหัวข้อ รายละเอียด หมวด ผู้บันทึก หรือชื่อไฟล์ ใช้ร่วมกับปุ่มหมวดหมู่ได้', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: /ห้องข้อมูลเทคนิค/ }).click();
  await page.getByRole('button', { name: '🔒 Private Data · เฉพาะภายในอู่' }).click();
  const list = page.locator('#pxLearnList');
  const titles = () => list.locator('.lrnCard b').allInnerTexts();
  const empty = page.getByText('ยังไม่มีเนื้อหาในหมวดนี้', { exact: false }).filter({ visible: true });
  const noMatch = page.getByText('ไม่พบเนื้อหาที่ตรงกับคำค้น', { exact: true }).filter({ visible: true });
  const search = page.getByPlaceholder('ค้นหาหัวข้อ รายละเอียด หรือชื่อไฟล์...');
  await expect(search).toBeVisible();
  const PRIVATE = 'วิธีเคลียร์ Code P0420 หลังเปลี่ยนแคทฯ (ภายในอู่)';
  expect(await titles()).toEqual([PRIVATE]);

  // By the title, lower case; by two words of the details; by the author; a word that is nowhere: nothing, and
  // "ไม่พบเนื้อหาที่ตรงกับคำค้น" (the owner, 2026-11-26) instead of the tab's own empty message.
  await search.fill('p0420');
  expect(await titles()).toEqual([PRIVATE]);
  await search.fill('drive cycle   READINESS');
  expect(await titles()).toEqual([PRIVATE]);
  await search.fill('ช่างเอก');
  expect(await titles()).toEqual([PRIVATE]);
  await search.fill('P0420 คอมเพรสเซอร์');
  expect(await titles()).toEqual([]);
  await expect(noMatch).toBeVisible();
  await expect(empty).toHaveCount(0);
  await expect(page.getByText('🔒 Private Data · เฉพาะภายในอู่ · 1 รายการ', { exact: true })).toBeVisible();
  await search.fill('');
  expect(await titles()).toEqual([PRIVATE]);

  // Publish Data: the same box; by the category; together with a category chip.
  await page.getByRole('button', { name: '🌐 Publish Data · แบ่งปันเครือข่าย' }).click();
  const PUBLISHED = 'ตารางปริมาณน้ำยาแอร์ + น้ำมันคอมพ์ 12 รุ่นยอดนิยม';
  expect(await titles()).toEqual([PUBLISHED]);
  await search.fill('ปริมาณเติมน้ำยาแอร์');
  expect(await titles()).toEqual([PUBLISHED]);
  await search.fill('poe');
  expect(await titles()).toEqual([PUBLISHED]);
  // A category with nothing published: the tab's own empty message, as without a search.
  await page.locator('#pxTopicChips').getByRole('button', { name: 'การแก้ Code', exact: true }).click();
  expect(await titles()).toEqual([]);
  await expect(empty).toBeVisible();
  await expect(noMatch).toHaveCount(0);
  await page.locator('#pxTopicChips').getByRole('button', { name: 'ปริมาณเติมน้ำยาแอร์', exact: true }).click();
  expect(await titles()).toEqual([PUBLISHED]);

  // A new private article with a file name is found by that name.
  await page.getByRole('button', { name: '🔒 Private Data · เฉพาะภายในอู่' }).click();
  await page.locator('#pxTopicChips').getByRole('button', { name: 'ทั้งหมด', exact: true }).click();
  await search.fill('');
  await page.getByRole('button', { name: '+ เพิ่มบทความ / อัปโหลดคลิป' }).click();
  await page.getByLabel('ชื่อเรื่อง *').fill('คู่มือเปลี่ยนน้ำมันเกียร์ CVT');
  await page.getByLabel(/^คำอธิบาย/).fill('ขั้นตอนเติมและเช็คระดับ');
  await page.getByLabel('การมองเห็น').selectOption('private');
  await page.getByLabel(/^แนบไฟล์บทความ/).setInputFiles({ name: 'cvt-fluid-guide.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
  await page.getByRole('button', { name: 'บันทึกเข้าคลังความรู้' }).click();
  await expect(list.getByText('คู่มือเปลี่ยนน้ำมันเกียร์ CVT', { exact: true })).toBeVisible();
  await search.fill('CVT-FLUID');
  expect(await titles()).toEqual(['คู่มือเปลี่ยนน้ำมันเกียร์ CVT']);
  await search.fill('น้ำมันเกียร์');
  expect(await titles()).toEqual(['คู่มือเปลี่ยนน้ำมันเกียร์ CVT']);
});
