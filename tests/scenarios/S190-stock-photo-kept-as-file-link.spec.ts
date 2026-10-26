import { test, expect } from '../support/test';
import type { Locator } from '@playwright/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { LINK, bytesOfDataUrl, fetchFile, fileState, sha256 } from '../support/files';

// Replaces S52 in the new system (tests/intentional-changes.json, task 3.11, decision R19-ค, owner's answers
// "พฤติกรรมที่เปลี่ยน"): the product picture is kept by the server as a file and the product's img field holds
// its link (/api/files/<SHA-256 of the picture>) instead of the picture itself. Every step and screen is S52's
// (the picture shows the same, now loaded from the link); deleting the picture deletes the file (restorable for
// 30 days, S197).
const S52 = 'S52-stock-item-photo-upload-delete.spec.ts';

async function waitUntilStill(header: Locator) {
  let last = '', still = 0;
  await expect.poll(async () => {
    const box = JSON.stringify(await header.boundingBox());
    still = box === last ? still + 1 : 0;
    last = box;
    return still;
  }, { intervals: [250], timeout: 60_000 }).toBeGreaterThanOrEqual(4);
}

test('S190 ระบบใหม่: รูปสินค้าเก็บเป็นไฟล์ที่ server ข้อมูลสินค้าเก็บลิงก์ หน้าจอเหมือน S52 ลบรูปแล้วไฟล์ถูกลบ', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S52, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await expect(page.getByText('พบ 52 รายการ · แสดง 1–10 · หน้า 1/6').first()).toBeVisible();
  await waitUntilStill(page.getByText('5 · ราคาขาย A', { exact: true }).filter({ visible: true }));
  await golden.step('ทะเบียนอะไหล่');
  const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await search.fill('MS-995');
  await search.press('Enter');
  const row = page.getByRole('row').filter({ hasText: 'น้ำยาล้างระบบเชื้อเพลิง' }).filter({ visible: true });
  await expect(row).toHaveCount(1);
  await golden.step('ค้นหา MS-995 ในทะเบียนอะไหล่');

  await row.getByRole('button', { name: 'ไม่มีรูป' }).click();
  await expect(page.getByText('ยังไม่มีรูปสินค้า')).toBeVisible();
  await golden.step('กดช่อง "ไม่มีรูป" เปิดหน้าต่างรูปสินค้า');

  let before = await app.state();
  const chooser = page.waitForEvent('filechooser');
  await page.getByText('อัปโหลดรูปใหม่ / เปลี่ยนรูป').click();
  await (await chooser).setFiles('tests/assets/S52-fuel-system-cleaner.png');
  const delPhoto = page.getByRole('button', { name: 'ลบรูป' });
  await expect(delPhoto).toBeVisible();
  await golden.step('เลือกไฟล์รูป ระบบย่อและบันทึกรูปทันที');
  const link = (await app.state() as any).DB.stock.find((s: any) => s.code === 'MS-995').img;
  expect(link).toMatch(LINK);
  // The legacy change, with the link where the picture was.
  await golden.stateChange('upload-photo', before, { 'DB.stock[MS-995].img': [null, link] });
  expect(JSON.parse(legacyStateChange(S52, 'upload-photo'))['DB.stock[MS-995].img'][1]).toMatch(/^data:image\/jpeg;base64,/);
  // The file is the picture the app made (the preview still shows it as the app made it), named by its SHA-256.
  const made = bytesOfDataUrl(await page.locator('#imgPreviewWrap img').getAttribute('src') as string);
  const file = await fetchFile(page, link);
  expect({ status: file.status, type: file.type, nosniff: file.nosniff, same: file.bytes.equals(made) }).toEqual({ status: 200, type: 'image/jpeg', nosniff: 'nosniff', same: true });
  expect(link).toBe(`/api/files/${sha256(made)}`);
  expect((await app.serverDB()).stock.find((s: any) => s.code === 'MS-995').img).toBe(link);
  await golden.screen('photo-uploaded');

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await expect(delPhoto).toBeHidden();
  const thumb = row.getByRole('img', { name: 'น้ำยาล้างระบบเชื้อเพลิง' });
  await expect(thumb).toBeVisible();
  await golden.step('ปิดหน้าต่าง ทะเบียนแสดงรูปย่อ');
  await golden.screen('register-thumbnail');

  await thumb.click();
  await expect(delPhoto).toBeVisible();
  await delPhoto.click();
  await expect(page.getByText('ลบรูปสินค้าของ MS-995 ?')).toBeAttached();
  await golden.step('เปิดรูปจากทะเบียนแล้วกดลบรูป ป๊อปอัพยืนยันขึ้นอยู่หลังหน้าต่างรูป');
  await golden.screen('confirm-hidden-behind-photo-window');

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await expect(delPhoto).toBeHidden();
  await expect(page.getByText('ลบรูปสินค้าของ MS-995 ?')).toBeVisible();
  await golden.step('ปิดหน้าต่างรูปก่อน จึงเห็นป๊อปอัพยืนยันลบรูป');
  await golden.screen('confirm-delete-photo');

  before = await app.state();
  await page.getByRole('button', { name: 'ลบ', exact: true }).filter({ visible: true }).click();
  await expect(row.getByRole('button', { name: 'ไม่มีรูป' })).toBeVisible();
  await golden.step('หลังยืนยันลบรูป ทะเบียนกลับเป็น "ไม่มีรูป"');
  await golden.stateChange('delete-photo', before, { 'DB.stock[MS-995].img': [link, null] });
  // Deleted with the picture: no longer served, kept 30 days for staff to restore (S197).
  expect(await fileState(page, link.match(LINK)[1])).toBe('deleted');
  expect((await fetchFile(page, link)).status).toBe(404);
  golden.done();
});
