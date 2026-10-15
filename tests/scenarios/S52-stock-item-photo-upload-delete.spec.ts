import { test, expect } from '../support/test';
import type { Locator } from '@playwright/test';

// A register sizes its columns from the rows it has drawn, a moment after drawing them, and never narrows them
// again. Before a search narrows the list, wait until a column header has stopped moving (1 s); otherwise the
// column widths (and so the screenshots) depend on timing.
async function waitUntilStill(header: Locator) {
  let last = '', still = 0;
  await expect.poll(async () => {
    const box = JSON.stringify(await header.boundingBox());
    still = box === last ? still + 1 : 0;
    last = box;
    return still;
  }, { intervals: [250], timeout: 60_000 }).toBeGreaterThanOrEqual(4);
}

test('S52 อัปโหลดรูปสินค้าน้ำยาล้างระบบเชื้อเพลิงจากช่อง "ไม่มีรูป" ในทะเบียนอะไหล่ แล้วลบรูปออก', async ({ app, page, golden }) => {
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
  await golden.stateChange('upload-photo', before);
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
  // Legacy behaviour reported to the owner: the confirm card opens BEHIND the picture window, so its
  // "ลบ" button cannot be clicked; the user has to close the picture window first to reach it.
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
  await golden.stateChange('delete-photo', before);
});
