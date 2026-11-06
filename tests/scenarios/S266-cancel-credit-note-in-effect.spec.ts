import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (owner's decision 2026-11-06, NOTES.md "งานบัญชีที่ค้าง" 2): a credit note in effect can be cancelled
// with a reason while its month's VAT is open — everything comes back. The owner cancels a return with money paid
// back: the goods leave stock again, the sale is back to its amount and the customer owes the money paid back; the
// credit note keeps its number, marked cancelled, and leaves the sales tax report. Staff with "ออกใบลดหนี้" only ask:
// the owner approves the request from the pending approvals.
const form = (page: Page) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: /ใบลดหนี้/ }) });
async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}
async function newCreditNote(page: Page, saleNo: string) {
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await page.getByRole('button', { name: '+ ออกใบลดหนี้' }).click();
  await form(page).getByLabel('ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า').fill(saleNo);
  await form(page).getByRole('row').filter({ hasText: saleNo }).getByRole('button', { name: 'เลือก' }).click();
}
async function reason(page: Page, text: string, yes: string) {
  await page.getByText('ระบุเหตุผลที่ยกเลิก (จำเป็น)').locator('..').getByRole('textbox').fill(text);
  await page.getByRole('button', { name: yes, exact: true }).click();
}
const salesVat = (page: Page) => page.getByRole('row', { name: /^ภาษีขาย / });

test('S266 ระบบใหม่: ยกเลิกใบลดหนี้ที่มีผลแล้ว สินค้ากลับออกจากสต๊อก ลูกค้ากลับมาค้างเงินที่คืนไป ออกจากรายงานภาษีขาย พนักงานขอยกเลิกแล้วเจ้าของอนุมัติ', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const start = (await app.state()).DB;
  const qty = (db: any) => db.stock.find((s: any) => s.code === 'BR-001').qty;
  const cut = (db: any, no: string) => db.stockCuts.find((c: any) => c.no === no);

  // A return from a paid sale, money paid back in cash (as S142).
  await newCreditNote(page, 'MA-SA261000010');
  await form(page).getByRole('spinbutton', { name: 'จำนวนที่คืน BR-001' }).fill('1');
  await form(page).getByLabel('เหตุผล (ต้องกรอก)').fill('ลูกค้านำผ้าเบรกที่ยังไม่ได้ใช้มาคืน');
  await form(page).getByRole('button', { name: 'บันทึกใบลดหนี้' }).click();
  await expect(form(page).getByRole('heading', { name: 'ใบลดหนี้ MA-CN261000001' })).toBeVisible();
  await app.settle();
  expect(qty((await app.state()).DB)).toBe(qty(start) + 1);

  // The owner cancels it: the reason box says the customer will owe the money paid back.
  await form(page).getByRole('button', { name: 'ยกเลิกใบลดหนี้' }).click();
  await expect(page.getByText(/ลูกค้ากลับมาค้างชำระ 1,476\.60 บาทที่คืนเงินไปแล้ว/)).toBeVisible();
  await reason(page, 'ลูกค้าเปลี่ยนใจ ขอซื้อผ้าเบรกคืน', 'ยืนยันยกเลิกใบลดหนี้');
  await expect(page.getByText('ยกเลิกใบลดหนี้ MA-CN261000001 แล้ว', { exact: true })).toBeVisible();
  await expect(form(page).getByText('ยกเลิกแล้ว', { exact: true })).toBeVisible();
  await expect(form(page).getByRole('button', { name: 'พิมพ์ใบลดหนี้ (ต้นฉบับ + สำเนา)' })).toHaveCount(0);
  await expect(form(page).getByRole('button', { name: 'ยกเลิกใบลดหนี้' })).toHaveCount(0);
  await app.settle();
  let db = (await app.state()).DB;
  expect(db.creditNotes[0].voided).toMatchObject({ reason: 'ลูกค้าเปลี่ยนใจ ขอซื้อผ้าเบรกคืน', date: '2026-10-13', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' });
  expect(db.creditNotes[0].apv.status).toBe('approved');
  expect(qty(db)).toBe(qty(start));
  expect(db.moves.at(-1)).toMatchObject({ type: 'out', qty: 1, ref: 'ยกเลิกใบลดหนี้ MA-CN261000001 · ใบตัดสต็อก MA-SA261000010', refNo: 'MA-SA261000010' });
  expect(db.receipts.find((r: any) => r.no === 'MA-SA261000010').adj).toEqual([
    expect.objectContaining({ type: 'down', amt: 1476.6, cn: 'MA-CN261000001' }),
    expect.objectContaining({ type: 'up', amt: 1476.6, cn: 'MA-CN261000001', voids: true, reason: 'ยกเลิกใบลดหนี้ MA-CN261000001', note: 'ลูกค้าเปลี่ยนใจ ขอซื้อผ้าเบรกคืน' })]);
  expect(cut(db, 'MA-SA261000010').st).toMatchObject({ rem: 1476.6 });   // the money paid back is owed again
  expect(db.audit.at(-1)).toMatchObject({ kind: 'stockcut', act: 'cnvoid',
    note: 'ยกเลิกใบลดหนี้ MA-CN261000001 · 1,476.60 บาท · ลูกค้ากลับมาค้างชำระ 1,476.60 บาทที่คืนเงินไปแล้ว — ลูกค้าเปลี่ยนใจ ขอซื้อผ้าเบรกคืน' });
  await form(page).getByRole('button', { name: 'ปิด' }).click();

  // The sales tax report of October no longer takes it off.
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
  await expect(salesVat(page)).toContainText('3,631.95');
  await expect(page.getByRole('row').filter({ hasText: 'MA-CN261000001' })).toHaveCount(0);

  // A price cut on an unpaid sale, then the front desk (EMP005), who may issue credit notes, asks to cancel it.
  await newCreditNote(page, 'MA-SA261000003');
  await form(page).getByLabel('กรณี').selectOption('ลดราคาหลังขาย');
  await form(page).getByLabel('มูลค่าที่ลด (ก่อน VAT)').fill('500');
  await form(page).getByLabel('เหตุผล (ต้องกรอก)').fill('งานติดตั้งล่าช้ากว่าที่ตกลง ลดราคาให้ลูกค้า');
  await form(page).getByRole('button', { name: 'บันทึกใบลดหนี้' }).click();
  await expect(form(page).getByRole('heading', { name: 'ใบลดหนี้ MA-CN261000002' })).toBeVisible();
  await form(page).getByRole('button', { name: 'ปิด' }).click();
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('row').filter({ hasText: 'EMP005' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  await page.getByRole('checkbox', { name: 'ออกใบลดหนี้ / ใบเพิ่มหนี้', exact: true }).check();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const staff = page.getByRole('row').filter({ hasText: 'EMP005' });
  await staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('55555555');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(staff).toContainText('ใช้งานได้');
  await signOut(page);

  await app.login('092-111-2233', '55555555');
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText('MA-SA261000003', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ใบลดหนี้ MA-CN261000002' }).click();
  await form(page).getByRole('button', { name: 'ยกเลิกใบลดหนี้' }).click();
  await reason(page, 'คิดส่วนลดผิดบิล', 'ยืนยันยกเลิกใบลดหนี้');
  await expect(page.getByText('ส่งคำขอยกเลิกใบลดหนี้ MA-CN261000002 แล้ว รออนุมัติ', { exact: true })).toBeVisible();
  await expect(form(page).getByText('ขอยกเลิก · รออนุมัติ', { exact: true })).toBeVisible();
  await expect(form(page).getByRole('button', { name: 'อนุมัติการยกเลิก' })).toHaveCount(0);
  await app.settle();
  db = (await app.state()).DB;
  expect(db.creditNotes[1].voided).toBeUndefined();
  expect(db.creditNotes[1].voidReq).toMatchObject({ status: 'pending', reason: 'คิดส่วนลดผิดบิล', byName: 'EMP005 · ฝนทิพย์ ต้อนรับ' });
  expect(cut(db, 'MA-SA261000003').st).toMatchObject({ rem: 9378.55 });   // nothing changes yet
  await form(page).getByRole('button', { name: 'ปิด' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await signOut(page);

  // The owner approves it from the pending approvals: what is owed goes back up.
  await app.loginAsOwner();
  await page.getByTitle('เอกสารรอการอนุมัติ').click();
  const row = page.getByRole('row').filter({ hasText: 'MA-CN261000002' });
  await expect(row).toContainText('ขอยกเลิกใบลดหนี้');
  await row.getByText('MA-CN261000002', { exact: true }).click();
  await form(page).getByRole('button', { name: 'อนุมัติการยกเลิก', exact: true }).click();
  await expect(page.getByText('ยกเลิกใบลดหนี้ MA-CN261000002 แล้ว', { exact: true })).toBeVisible();
  await app.settle();
  db = (await app.state()).DB;
  expect(db.creditNotes[1].voided).toMatchObject({ reason: 'คิดส่วนลดผิดบิล', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ', req: { byName: 'EMP005 · ฝนทิพย์ ต้อนรับ' } });
  expect(db.creditNotes[1].voidReq).toBeUndefined();
  expect(cut(db, 'MA-SA261000003').st).toMatchObject({ rem: 9913.55 });
});
