import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';
import { LINK, bytesOfDataUrl, fetchFile, sha256 } from '../support/files';

// Replaces S408 in the new system (tests/intentional-changes.json; as S190 for S52, task 3.11, decision R19-ค,
// owner's answers 11.1–11.6): the picture dropped onto the picture window is kept by the server as a file and the
// product's img field holds its link (/api/files/<SHA-256 of the picture>) instead of the picture itself. Every step
// is S408's, and each data change is S408's with the link in place of the picture.
const S408 = 'S408-drop-product-picture-claim-pull-remove.spec.ts';

test('S451 ระบบใหม่: ลากรูปสินค้ามาวาง รูปเก็บเป็นไฟล์ที่ server ข้อมูลสินค้าเก็บลิงก์ และเอารายการที่หยิบเข้าใบเคลมผู้ขายออกด้วยปุ่ม ×', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S408, { app, page, testInfo });
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  const search = page.getByPlaceholder('ค้นหา รหัสอู่ / OEM / ชื่อสินค้า / แบรนด์').filter({ visible: true });
  await search.fill('MS-995');
  await search.press('Enter');
  const row = page.getByRole('row').filter({ hasText: 'น้ำยาล้างระบบเชื้อเพลิง' }).filter({ visible: true });
  await expect(row).toHaveCount(1);
  await golden.step('ค้นหา MS-995 ในทะเบียนอะไหล่');
  await row.getByRole('button', { name: 'ไม่มีรูป' }).click();
  await expect(page.getByText('ยังไม่มีรูปสินค้า')).toBeVisible();
  await golden.step('หน้าต่างรูปสินค้า ยังไม่มีรูป');

  // The picture file dropped onto the drop area, as a file dragged from the computer.
  let before = await app.state();
  const png = readFileSync('tests/assets/S52-fuel-system-cleaner.png').toString('base64');
  const dataTransfer = await page.evaluateHandle(b64 => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], 'S52-fuel-system-cleaner.png', { type: 'image/png' }));
    return dt;
  }, png);
  const zone = page.getByText('อัปโหลดรูปใหม่ / เปลี่ยนรูป');
  await zone.dispatchEvent('dragenter', { dataTransfer });
  await zone.dispatchEvent('dragover', { dataTransfer });
  await zone.dispatchEvent('drop', { dataTransfer });
  await expect(page.getByRole('button', { name: 'ลบรูป' })).toBeVisible();
  await golden.step('ลากรูปมาวาง บันทึกรูปสินค้าแล้ว');
  const link = (await app.state() as any).DB.stock.find((s: any) => s.code === 'MS-995').img;
  expect(link).toMatch(LINK);
  // The legacy change, with the link where the picture was.
  await golden.stateChange('drop-picture', before, { 'DB.stock[MS-995].img': [null, link] });
  expect(JSON.parse(legacyStateChange(S408, 'drop-picture'))['DB.stock[MS-995].img'][1]).toMatch(/^data:image\/jpeg;base64,/);
  // The file is the picture the app made (the preview shows it as the app made it), named by its SHA-256.
  const made = bytesOfDataUrl(await page.locator('#imgPreviewWrap img').getAttribute('src') as string);
  const file = await fetchFile(page, link);
  expect({ status: file.status, type: file.type, same: file.bytes.equals(made) }).toEqual({ status: 200, type: 'image/jpeg', same: true });
  expect(link).toBe(`/api/files/${sha256(made)}`);
  expect((await app.serverDB()).stock.find((s: any) => s.code === 'MS-995').img).toBe(link);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // Vendor claim: two items picked from the goods received note, one taken back out on its chip.
  await page.getByRole('button', { name: 'เคลมผู้ขาย' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเคลมใหม่' }).click();
  await expect(page.getByRole('button', { name: '+ เพิ่มบรรทัดรายการเคลม' })).toBeHidden();
  await golden.step('ใบเคลมสินค้าใหม่ (ไม่มีปุ่มเพิ่มบรรทัดรายการเคลม)');
  await page.getByPlaceholder('— เลือกผู้ขาย · พิมพ์ค้นหาได้ —').filter({ visible: true }).click();
  await page.keyboard.type('รุ่งเรือง');
  await page.getByText('บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('พิมพ์เลขที่ใบ / ชื่อผู้ขาย').filter({ visible: true }).click();
  await page.keyboard.type('MA-RC');
  await page.getByText('MA-RC261000001', { exact: true }).filter({ visible: true }).click();
  await golden.step('อ้างอิงใบรับสินค้า MA-RC261000001 เปิดหน้าหยิบรายการ');
  await page.getByRole('row').filter({ hasText: 'EL-101' }).getByRole('button', { name: '+ เคลมชิ้นนี้' }).click();
  const second = page.getByRole('row').filter({ has: page.getByRole('button', { name: '+ เคลมชิ้นนี้' }) }).filter({ visible: true }).first();
  await second.getByRole('button', { name: '+ เคลมชิ้นนี้' }).click();
  await expect(page.getByText(/เลือกเข้าใบเคลมแล้ว\s*2\s*รายการ/)).toBeVisible();
  await golden.step('หยิบ 2 รายการเข้าใบเคลม');
  before = await app.state();
  await page.getByTitle('เอาออกจากใบเคลม').first().click();
  await expect(page.getByText(/เลือกเข้าใบเคลมแล้ว\s*1\s*รายการ/)).toBeVisible();
  await golden.step('กด × เอา EL-101 ออกจากใบเคลม');
  await golden.stateChange('remove-picked', before);
  await page.getByRole('button', { name: 'เสร็จ — กลับไปที่ใบเคลม' }).click();
  await golden.step('กลับไปที่ใบเคลม เหลือ 1 รายการ');
  golden.done();
});
