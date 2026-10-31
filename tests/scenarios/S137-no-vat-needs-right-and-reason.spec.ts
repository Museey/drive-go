import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.3, decisions R4-ข, T12): in a VAT-registered shop,
// leaving VAT off a sale ("ไม่มี" in the stock cut's VAT box, "ไม่คิด VAT" on
// a quotation or receipt) takes the right "เลือกไม่คิด VAT (ต้องใส่เหตุผล)",
// which no staff member has until the owner ticks it, and a reason. The
// document keeps the reason and the audit log records it. In the legacy app
// anyone who could make the document could leave VAT off.
const vatBox = (page: Page) => page.locator('span', { hasText: /^ภาษีมูลค่าเพิ่ม/ }).filter({ visible: true }).getByRole('combobox');
// The question: a pop-up headed "ไม่คิด VAT" with a box for the reason.
const reasonAsk = (page: Page) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: 'ไม่คิด VAT', exact: true }) });

async function newSaleOfTwoBrakePads(page: Page) {
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อลูกค้า / เบอร์โทร / ทะเบียน').filter({ visible: true });
  await custBox.fill('วิภา');
  await custBox.locator('..').getByText('วิภา ศรีสมบูรณ์').click();
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001/ }).click();
  const row = page.getByRole('row').filter({ hasText: 'BR-001' }).filter({ has: page.getByRole('spinbutton') });
  await row.getByRole('spinbutton').nth(1).fill('2');
  await row.getByRole('spinbutton').nth(1).press('Tab');
  // 2 × 1,380.00 = 2,760.00 + VAT 7% 193.20
  await expect(page.getByText('2,953.20').filter({ visible: true }).first()).toBeVisible();
}

test('S137 ระบบใหม่: ร้านที่จด VAT เลือกไม่คิด VAT ได้เฉพาะผู้มีสิทธิ์ ต้องใส่เหตุผล เอกสารเก็บเหตุผล และลงประวัติการใช้งาน', async ({ app, page }) => {
  await app.loginAsOwner();

  // The owner gives the front desk (EMP005: may sell, may not change the shop's tax settings) a login.
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const staff = page.getByRole('row').filter({ hasText: 'EMP005' });
  await staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('55555555');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(staff).toContainText('ใช้งานได้');

  // The owner leaves VAT off: the reason is asked first, and "ตกลง" waits for one.
  await newSaleOfTwoBrakePads(page);
  const vat = vatBox(page);
  await expect(vat).toHaveValue('7');
  await vat.selectOption('ไม่มี');
  const ask = reasonAsk(page);
  await expect(ask.getByText('เหตุผลที่ไม่คิด VAT', { exact: true })).toBeVisible();
  const ok = ask.getByRole('button', { name: 'ตกลง', exact: true });
  await expect(ok).toBeDisabled();
  await expect(vat).toHaveValue('7');
  await ask.getByRole('textbox').press('Enter');
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await expect(ask).toBeHidden();
  await expect(vat).toHaveValue('7');
  await expect(page.getByText('2,953.20').filter({ visible: true }).first()).toBeVisible();

  await vat.selectOption('ไม่มี');
  await ask.getByRole('textbox').fill('ขายให้สถานทูต ได้รับยกเว้นภาษี');
  await expect(ok).toBeEnabled();
  await ok.click();
  await expect(ask).toBeHidden();
  await expect(vat).toHaveValue('0');
  await expect(page.getByText('2,760.00').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('2,953.20').filter({ visible: true })).toHaveCount(0);

  const before = (await app.state()).DB;
  await page.getByRole('button', { name: 'บันทึก / รอรับชำระ' }).filter({ visible: true }).first().click();
  await expect(page.getByText('บันทึกข้อมูลสำเร็จ').filter({ visible: true })).toBeVisible();
  await app.settle();
  const after = (await app.state()).DB;
  const sale = after.stockCuts.find((c: any) => !before.stockCuts.some((b: any) => b.id === c.id));
  expect(sale).toMatchObject({ no: 'MA-SA261000015', vat: 0, total: 2760, noVatReason: 'ขายให้สถานทูต ได้รับยกเว้นภาษี' });
  expect(after.audit.filter((a: any) => a.kind === 'stockcut' && a.no === 'MA-SA261000015')).toEqual([expect.objectContaining({
    act: 'cut', note: 'ตัดสต็อก 1 รายการ · ขายหน้าร้าน · ไม่คิด VAT: ขายให้สถานทูต ได้รับยกเว้นภาษี', userName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' })]);

  // The same on a quotation ("ไม่คิด VAT"); the reason goes into the audit line of the save.
  await page.getByRole('button', { name: 'กลับไปยังหน้าค้นหาเอกสาร' }).click();
  await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
  await page.getByRole('button', { name: '+ สร้างใบเสนอราคาใหม่' }).click();
  const custBox = page.getByPlaceholder('พิมพ์ชื่อ / เบอร์โทร / ทะเบียนรถ');
  await custBox.fill('ปรีชา');
  await custBox.locator('..').getByText('ปรีชา ทองสุข').click();
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('EL-118');
  await page.getByRole('option', { name: /EL-118/ }).click();
  const quoteVat = page.getByRole('combobox', { name: 'ภาษีมูลค่าเพิ่ม', exact: true }).filter({ visible: true });
  await expect(quoteVat).toHaveValue('7');
  await quoteVat.selectOption('ไม่คิด VAT');
  await reasonAsk(page).getByRole('textbox').fill('ลูกค้าเป็นองค์การระหว่างประเทศ ได้รับยกเว้นภาษี');
  await reasonAsk(page).getByRole('button', { name: 'ตกลง', exact: true }).click();
  await expect(quoteVat).toHaveValue('0');
  const beforeQuote = (await app.state()).DB;
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('button', { name: 'ยกเลิกเอกสาร' }).filter({ visible: true })).toBeVisible();
  await app.settle();
  const afterQuote = (await app.state()).DB;
  const quote = afterQuote.quotes.find((q: any) => !beforeQuote.quotes.some((b: any) => b.id === q.id));
  expect(quote).toMatchObject({ no: 'MA-QT261000005', vat: 0, noVatReason: 'ลูกค้าเป็นองค์การระหว่างประเทศ ได้รับยกเว้นภาษี' });
  expect(afterQuote.audit.filter((a: any) => a.kind === 'quote' && a.no === 'MA-QT261000005' && a.act === 'save')).toEqual([expect.objectContaining({
    note: expect.stringMatching(/^ยอดรวม [\d,.]+ บาท · ไม่คิด VAT: ลูกค้าเป็นองค์การระหว่างประเทศ ได้รับยกเว้นภาษี$/) })]);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The front desk cannot: the box stays at 7% and nothing is asked.
  // A Biz shop signs out at once, without asking (S101).
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-111-2233', '55555555');
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true }).click();
  await expect(vatBox(page)).toHaveValue('7');
  await vatBox(page).selectOption('ไม่มี');
  await expect(page.getByText('บัญชีนี้ไม่มีสิทธิ์เลือกไม่คิด VAT', { exact: true })).toBeVisible();
  await expect(vatBox(page)).toHaveValue('7');
  await expect(reasonAsk(page)).toBeHidden();

  // The owner gives her the right "เลือกไม่คิด VAT (ต้องใส่เหตุผล)" (under การเงิน in the staff form): now she is asked for the reason.
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('row').filter({ hasText: 'EMP005' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  const right = page.getByRole('checkbox', { name: 'เลือกไม่คิด VAT (ต้องใส่เหตุผล)' });
  await expect(right).not.toBeChecked();
  await right.check();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  expect((await app.state()).DB.emp.find((e: any) => e.code === 'EMP005').perms.doc).toMatchObject({ noVat: true, taxClose: false, creditNote: false });
  // Saving the staff form keeps her login (the legacy app dropped it; fixed with the owner's approval, 2026-10-25).
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  await expect(staff).toContainText('ใช้งานได้');
  await expect(staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' })).toHaveCount(0);
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-111-2233', '55555555');
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true }).click();
  await vatBox(page).selectOption('ไม่มี');
  await expect(reasonAsk(page).getByText('เหตุผลที่ไม่คิด VAT', { exact: true })).toBeVisible();
  await reasonAsk(page).getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await expect(vatBox(page)).toHaveValue('7');
});
