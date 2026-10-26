import { test, expect } from '../support/test';
import { LINK, fetchFile, fileState, staffRestore } from '../support/files';

// New behaviour (task 3.11, decision R19-ค, owner's answer 11.1): a deleted file can be restored for 30 days;
// during the pilot staff do it on request with the server tool (tools/files.mjs restore <shop> <file id>,
// server/lib/file-restore.ts). The owner deletes MS-995's picture by mistake; staff restore the file and the
// picture is back on the product, with the same link.
test('S196 ระบบใหม่: ลบรูปสินค้าแล้วทีมงานกู้คืนไฟล์ด้วยเครื่องมือฝั่ง server รูปกลับมาที่สินค้าเดิม', async ({ app, page }) => {
  await app.loginAsOwner();
  const openPhoto = async () => {
    await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
    const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
    await search.fill('MS-995');
    await search.press('Enter');
    return page.getByRole('row').filter({ hasText: 'น้ำยาล้างระบบเชื้อเพลิง' }).filter({ visible: true });
  };
  let row = await openPhoto();
  await row.getByRole('button', { name: 'ไม่มีรูป' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByText('อัปโหลดรูปใหม่ / เปลี่ยนรูป').click();
  await (await chooser).setFiles('tests/assets/S52-fuel-system-cleaner.png');
  await expect(page.getByRole('button', { name: 'ลบรูป' })).toBeVisible();
  await app.settle();
  const link = (await app.state() as any).DB.stock.find((s: any) => s.code === 'MS-995').img;
  expect(link).toMatch(LINK);
  const id = link.match(LINK)[1];

  // Deleted by mistake (the legacy steps of S52).
  await page.getByRole('button', { name: 'ลบรูป' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();
  await page.getByRole('button', { name: 'ลบ', exact: true }).filter({ visible: true }).click();
  await expect(row.getByRole('button', { name: 'ไม่มีรูป' })).toBeVisible();
  await app.settle();
  expect(await fileState(page, id)).toBe('deleted');
  expect((await fetchFile(page, link)).status).toBe(404);

  // Staff restore it on the server; the shop opens its page again.
  expect(await staffRestore(page, id)).toMatchObject({ unit: 'DB.stock', storeKey: 'garage.v22', how: 'field' });
  expect(await fileState(page, id)).toBe('in use');
  await app.open();
  row = await openPhoto();
  const thumb = row.getByRole('img', { name: 'น้ำยาล้างระบบเชื้อเพลิง' });
  await expect(thumb).toHaveAttribute('src', link);
  expect(await thumb.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect((await app.state() as any).DB.stock.find((s: any) => s.code === 'MS-995').img).toBe(link);
  expect((await fetchFile(page, link)).status).toBe(200);
});
