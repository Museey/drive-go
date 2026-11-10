import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';

// Two small actions of 07 สต๊อกอะไหล่: a product picture dragged from the computer onto the picture window's drop area
// ("แตะเพื่อเลือกรูป หรือลากรูปมาวางที่นี่"), and in a vendor claim's pick window, a picked item taken back out with the
// × on its chip ("เอาออกจากใบเคลม").
test('S408 ลากรูปสินค้ามาวางในหน้าต่างรูปสินค้า และเอารายการที่หยิบเข้าใบเคลมผู้ขายออกด้วยปุ่ม × บนป้ายรายการ', async ({ app, page, golden }) => {
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
  await golden.stateChange('drop-picture', before);
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
});
