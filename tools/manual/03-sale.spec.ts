import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 3: one repair job from start to end: quotation → approval → stock cut → payment → receipt → tax invoice.
test('03 งานขายและซ่อม', async ({ app, page }) => {
  await app.loginAsOwner();
  const visible = (l: ReturnType<typeof page.getByRole>) => l.filter({ visible: true });

  // Quotation
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await shot(page, '03-quote-list', { mark: [page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' })] });
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill('ปรีชา');
  await shot(page, '03-quote-customer', { mark: [custBox] });
  await custBox.locator('..').getByText('ปรีชา ทองสุข').click();
  await page.getByPlaceholder('1.', { exact: true }).fill('แบตเตอรี่หมด สตาร์ทไม่ติด');
  const quick = visible(page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }));
  await quick.fill('EL-118');
  await shot(page, '03-quote-part', { mark: [quick] });
  await page.getByRole('option', { name: /EL-118/ }).click();
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดค่าแรง / ค่าบริการ' }).click();
  const labor = page.getByRole('row').filter({ has: page.getByText('ค่าแรง', { exact: true }) }).filter({ has: page.getByRole('spinbutton') });
  await labor.getByRole('textbox').fill('ค่าแรงเปลี่ยนแบตเตอรี่');
  await labor.getByRole('spinbutton').nth(1).fill('350');
  await page.waitForTimeout(400);
  await shot(page, '03-quote-filled', { mark: [labor] });
  await shot(page, '03-quote-save', { mark: [visible(page.getByRole('button', { name: 'บันทึก', exact: true })).first()] });
  await visible(page.getByRole('button', { name: 'บันทึก', exact: true })).first().click();
  await expect(visible(page.getByRole('button', { name: 'ยกเลิกเอกสาร' }))).toBeVisible();
  await app.settle();
  const approve = page.getByRole('button', { name: 'อนุมัติเอกสาร' });
  await shot(page, '03-quote-saved', { mark: [approve] });
  await approve.click();
  await expect(approve).toBeHidden();
  await app.settle();
  await visible(page.getByRole('button', { name: 'ปิด', exact: true })).first().click();

  // Stock cut from the approved quotation
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  const waiting = page.getByRole('button', { name: /^ใบเสนอราคาที่รอตัดสต็อก/ });
  await waiting.click();
  await app.settle();
  const q = visible(page.getByText('MA-QT261000005', { exact: true }));
  await shot(page, '03-cut-waiting', { mark: [q] });
  await q.click();
  await expect(visible(page.getByText('รายการมาจากใบเสนอราคา MA-QT261000005', { exact: false }))).toBeVisible();
  await page.waitForTimeout(400);
  const saveCut = visible(page.getByRole('button', { name: 'บันทึก / รอรับชำระ' })).first();
  await shot(page, '03-cut-form', { mark: [saveCut] });
  await saveCut.click();
  await expect(visible(page.getByText('บันทึกข้อมูลสำเร็จ'))).toBeVisible();
  await app.settle();
  await shot(page, '03-cut-saved');
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();
  await app.settle();

  // Payment: from the home page's list of stock cuts waiting for payment
  await page.getByRole('button', { name: /^00 Mr\.DriveGo/ }).click();
  const toPay = page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' });
  await shot(page, '03-pay-home', { mark: [toPay] });
  await toPay.click();
  await app.settle();
  const cut = visible(page.getByText('MA-SA261000015', { exact: true }));
  await shot(page, '03-pay-list', { mark: [cut] });
  await cut.click();
  await app.settle();
  const receive = visible(page.getByRole('button', { name: 'รับชำระ', exact: true }));
  await shot(page, '03-pay-open', { mark: [receive] });
  await receive.click();
  await app.settle();
  const cash = page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' });
  await shot(page, '03-pay-panel', { mark: [cash] });
  await cash.click();
  const savePay = page.getByRole('button', { name: 'บันทึกรับชำระ' });
  await shot(page, '03-pay-cash', { mark: [savePay] });
  await savePay.click();
  await expect(page.getByRole('heading', { name: /^ใบเสร็จรับเงิน MA-RE/ })).toBeVisible();
  await app.settle();
  await shot(page, '03-pay-receipt');
  await page.keyboard.press('Escape');
  await app.settle();
  await page.reload();
  await app.settle();

  // Tax invoice (4.6)
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await app.settle();
  const newTx = page.getByRole('button', { name: '+ ออกใบกำกับภาษีใหม่' });
  await shot(page, '03-tax-list', { mark: [newTx] });
  await newTx.click();
  const row = visible(page.getByRole('row').filter({ hasText: 'MA-SA261000015' }));
  await row.getByRole('radio').check();
  const issue = page.getByRole('button', { name: 'ออกใบกำกับภาษี', exact: true });
  await shot(page, '03-tax-pick', { mark: [[row, '1'], [issue, '2']] });
  await issue.click();
  await page.waitForTimeout(500);
  await app.settle();
  const saveTx = visible(page.getByRole('button', { name: 'บันทึก', exact: true })).first();
  await shot(page, '03-tax-form', { mark: [saveTx] });
  await saveTx.click();
  const printTx = page.getByRole('button', { name: 'พิมพ์ใบกำกับภาษี (ต้นฉบับ + สำเนา)' });
  await expect(printTx).toBeVisible();
  await app.settle();
  await shot(page, '03-tax-saved', { mark: [printTx] });
});
