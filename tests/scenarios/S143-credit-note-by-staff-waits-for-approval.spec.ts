import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.3, decision T10): staff issue credit notes only with
// the right "ออกใบลดหนี้", which no one has until the owner ticks it, and their
// credit note waits for approval: nothing changes until the owner (or whoever
// may approve tax invoices) approves it from the pending approvals.
const form = (page: Page) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: /ใบลดหนี้/ }) });

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();   // a Biz shop signs out at once (S101)
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}
async function newCreditNote(page: Page, saleNo: string) {
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await page.getByRole('button', { name: '+ ออกใบลดหนี้' }).click();
  await form(page).getByLabel('ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า').fill(saleNo);
  await form(page).getByRole('row').filter({ hasText: saleNo }).getByRole('button', { name: 'เลือก' }).click();
  await expect(form(page).getByRole('heading', { name: 'ออกใบลดหนี้ · ใบตัดสต็อก ' + saleNo })).toBeVisible();
}
async function unpaidSale(page: Page, no: string) {
  await page.getByRole('button', { name: '00 Mr.DriveGo' }).click();
  await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();
  await page.getByText(no, { exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'ใบตัดสต็อกขายสินค้า ' + no })).toBeVisible();
}

test('S143 ระบบใหม่: พนักงานที่ได้สิทธิ์ออกใบลดหนี้ ใบลดหนี้รออนุมัติ ยังไม่มีผล เจ้าของอนุมัติจากรายการรออนุมัติแล้วจึงลดยอดค้าง', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();

  // The owner gives the front desk (EMP005) the right, then her login.
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('row').filter({ hasText: 'EMP005' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  await page.getByRole('checkbox', { name: 'ออกใบลดหนี้', exact: true }).check();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const staff = page.getByRole('row').filter({ hasText: 'EMP005' });
  await staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('55555555');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(staff).toContainText('ใช้งานได้');
  await signOut(page);

  // She issues a price cut of 500.00 on an unpaid sale: it waits for approval and changes nothing yet.
  await app.login('092-111-2233', '55555555');
  const before = (await app.state()).DB;
  await newCreditNote(page, 'MA-SA261000003');
  await form(page).getByLabel('กรณี').selectOption('ลดราคาหลังขาย');
  await form(page).getByLabel('มูลค่าที่ลด (ก่อน VAT)').fill('500');
  await form(page).getByLabel('เหตุผล (ต้องกรอก)').fill('งานติดตั้งล่าช้ากว่าที่ตกลง ลดราคาให้ลูกค้า');
  await form(page).getByRole('button', { name: 'บันทึกใบลดหนี้' }).click();
  await expect(form(page).getByRole('heading', { name: 'ใบลดหนี้ MA-CN261000001' })).toBeVisible();
  await expect(form(page).getByText('รออนุมัติ', { exact: true })).toBeVisible();
  await expect(form(page).getByRole('button', { name: 'อนุมัติ', exact: true })).toHaveCount(0);
  await app.settle();
  let db = (await app.state()).DB;
  expect(db.creditNotes).toEqual([expect.objectContaining({ no: 'MA-CN261000001', gross: 535,
    apv: { status: 'pending', by: expect.any(String), byName: 'EMP005 · ฝนทิพย์ ต้อนรับ', date: '2026-10-13' } })]);
  expect(db.creditNotes[0].money).toBeUndefined();
  const sale = (d: any) => d.stockCuts.find((c: any) => c.no === 'MA-SA261000003');
  expect(sale(db).adj).toEqual(sale(before).adj);
  expect(sale(db).st).toEqual(sale(before).st);
  await form(page).getByRole('button', { name: 'ปิด' }).click();
  await unpaidSale(page, 'MA-SA261000003');
  await expect(page.getByRole('button', { name: 'ใบลดหนี้ MA-CN261000001 · รออนุมัติ' })).toBeVisible();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await signOut(page);

  // The owner sees it among the documents waiting for approval and approves it: now what is owed goes down.
  await app.loginAsOwner();
  await page.getByTitle('เอกสารรอการอนุมัติ').click();
  const row = page.getByRole('row').filter({ hasText: 'MA-CN261000001' });
  await expect(row).toContainText('ใบลดหนี้');
  await row.getByText('MA-CN261000001', { exact: true }).click();
  await expect(form(page).getByRole('heading', { name: 'ใบลดหนี้ MA-CN261000001' })).toBeVisible();
  await form(page).getByRole('button', { name: 'อนุมัติ', exact: true }).click();
  await expect(form(page).getByText('อนุมัติแล้ว', { exact: true })).toBeVisible();
  await app.settle();
  db = (await app.state()).DB;
  expect(db.creditNotes[0]).toMatchObject({ apv: { status: 'approved', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' }, money: { reduce: 535, refund: 0, method: '' } });
  expect(sale(db).st).toMatchObject({ k: 'wait', rem: 9378.55 });
  expect(db.audit.slice(-2)).toEqual([
    expect.objectContaining({ kind: 'stockcut', act: 'creditnote', note: 'ใบลดหนี้ MA-CN261000001 · ลดราคาหลังขาย · 535.00 บาท — งานติดตั้งล่าช้ากว่าที่ตกลง ลดราคาให้ลูกค้า' }),
    expect.objectContaining({ kind: 'stockcut', act: 'approve', note: 'อนุมัติใบลดหนี้ MA-CN261000001', userName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' }),
  ]);
});
