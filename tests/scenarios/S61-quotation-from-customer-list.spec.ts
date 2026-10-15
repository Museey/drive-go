import { test, expect } from '../support/test';

test('S61 เปิดใบเสนอราคาจากรายชื่อลูกค้านิติบุคคลระดับราคา A แล้วบันทึก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /^02 ข้อมูลลูกค้า/ }).click();
  await golden.step('รายชื่อลูกค้า (หนึ่งแถวต่อรถหนึ่งคัน)');

  // แถวของรถคันที่ 3 ของบริษัท โลจิสติกส์สยามด่วน จำกัด (Isuzu D-Max ทะเบียน 3กก 1562)
  await page.getByRole('row').filter({ hasText: '3กก 1562' }).filter({ visible: true })
    .getByRole('button', { name: 'เปิดใบเสนอราคา' }).click();
  await expect(page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ')).toHaveValue(/^บริษัท โลจิสติกส์สยามด่วน จำกัด/);
  // Legacy behaviour reported to the owner: the quote opens with the customer's FIRST car, not the row that was clicked.
  const car = page.getByLabel('รถที่รับซ่อม').filter({ visible: true });
  await expect(car).toHaveValue('0');
  await expect(page.getByLabel('ระดับราคาขาย').filter({ visible: true })).toHaveValue('A');
  await golden.step('ใบเสนอราคาใหม่ เติมลูกค้า รถ และระดับราคา A ให้');
  await golden.screen('quote-opened');

  await car.selectOption({ label: 'Isuzu (อีซูซุ) · D-Max Blue Power · น้ำเงิน · 3กก 1562 สมุทรปราการ' });
  // Legacy behaviour reported to the owner: the mileage stays at the first car's 96,620 (this car's record says 241,980).
  await expect(page.getByPlaceholder('กม.').filter({ visible: true })).toHaveValue('96620');
  await page.getByPlaceholder('1.', { exact: true }).fill('มีเสียงดังที่ช่วงล่างหน้าเวลาขับผ่านลูกระนาด');

  // SU-350 ลูกหมากปีกนกล่าง ราคา A 1,140 จำนวน 2
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('SU-350');
  await page.getByRole('option', { name: /SU-350/ }).click();
  const part = page.getByRole('row', { name: /SU-350 .*ลูกหมากปีกนกล่าง/ }).filter({ has: page.getByRole('spinbutton') }).filter({ visible: true });
  await part.getByRole('spinbutton').nth(0).fill('2');
  await part.getByRole('spinbutton').nth(0).press('Tab');

  // ค่าแรง 800 บาท
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).click();
  const labor = page.getByRole('row')
    .filter({ has: page.getByText('ค่าแรง', { exact: true }) })
    .filter({ has: page.getByRole('spinbutton') });
  await labor.getByRole('textbox').fill('ค่าแรงเปลี่ยนลูกหมากปีกนกล่าง 2 ข้าง');
  await labor.getByRole('spinbutton').nth(1).fill('800');
  await labor.getByRole('spinbutton').nth(1).press('Tab');
  const net = page.getByRole('row', { name: /ยอดรวมสุทธิ/ }).filter({ visible: true }).first();
  await expect(net).toContainText('3,295.60');
  await net.scrollIntoViewIfNeeded();
  await golden.step('เลือกรถคันที่ถูกต้อง กรอกอาการ อะไหล่ และค่าแรง');
  await golden.screen('quote-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true })).toBeVisible();
  await golden.step('หลังบันทึกใบเสนอราคา');
  await golden.stateChange('save-quote', before);

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const newRow = page.getByText('MA-QT261000005', { exact: true }).filter({ visible: true });
  await expect(newRow).toBeVisible();
  await newRow.scrollIntoViewIfNeeded();
  await golden.step('รายการใบเสนอราคาหลังบันทึก');
  await golden.screen('quote-list');
});
