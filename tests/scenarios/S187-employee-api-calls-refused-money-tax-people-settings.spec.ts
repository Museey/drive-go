import { test, expect } from '../support/test';
import { storageApi } from '../support/storage-api';

// New behaviour (task 3.9, part 3; the owner's answer of 2026-10-26 "เรื่องเงิน ภาษี บุคคล ตั้งค่า"): the server checks
// again what the screens check for money, tax, people and settings, and the rules of tasks 3.3–3.8
// (server/lib/rules.ts). The cashier (EMP008: receives payments, nothing else of these) calls the API directly with
// their own session; every one of these saves is refused and nothing changes. The screens never make them.
test('S187 ระบบใหม่: แคชเชียร์เรียก API ตรงเพื่อปิดงวดภาษี บันทึกเงินเดือน แก้ค่าใช้จ่าย เงินเดือนตัวเอง ตั้งค่าองค์กร ไม่คิด VAT ออกใบลดหนี้ หรือยกเลิกการขาย ถูกปฏิเสธทั้งหมด', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const cashier = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashier.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('88888888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await app.settle();
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-333-4455', '88888888');

  const api = storageApi(page);
  const before = (await api.read('garage.v22')).data;
  const self = before.emp.find((e: any) => e.code === 'EMP008');
  const cut = before.stockCuts.find((c: any) => c.no === 'MA-SA261000003');
  const expense = before.expenses[0];
  const refused = (what: string) => ({ status: 403, body: { error: 'not allowed', what } });

  // Tax: closing September, a quotation without VAT, a credit note.
  expect(await api.save('garage.v22', 'DB.taxPeriods', '', { '2026-09': { closed: true, date: '2026-10-13', hist: [{ act: 'close', date: '2026-10-13' }] } }))
    .toEqual(refused('DB.taxPeriods|2026-09'));
  expect(await api.save('garage.v22', 'DB.quotes', 'q1', { ...before.quotes[0], id: 'q1', no: 'MA-QT261000099', vat: 0, noVatReason: 'ไม่ต้องการ' }))
    .toEqual(refused('DB.quotes|q1: VAT left off'));
  expect(await api.save('garage.v22', 'DB.creditNotes', 'cn1', { id: 'cn1', no: 'MA-CN261000001', date: '2026-10-13', saleId: cut.id, saleNo: cut.no, gross: 107, apv: { status: 'approved' } }))
    .toEqual(refused('DB.creditNotes|cn1'));
  // Money: a payroll period, an expense, cancelling a sale.
  expect(await api.save('garage.v22', 'DB.payroll', 'p1', { id: 'p1', month: '2026-10', label: 'งวด ต.ค. 2569', lines: [], totals: {} }))
    .toEqual(refused('DB.payroll|p1'));
  expect(await api.save('garage.v22', 'DB.expenses', expense.id, { ...expense, base: 1 })).toEqual(refused(`DB.expenses|${expense.id}`));
  expect(await api.save('garage.v22', 'DB.stockCuts', cut.id, { ...cut, cancelled: true })).toEqual(refused(`DB.stockCuts|${cut.id}: cancel`));
  // People: their own salary. Settings: the shop's VAT registration.
  expect(await api.save('garage.v22', 'DB.emp', self.id, { ...self, salary: 99999 })).toEqual(refused(`DB.emp|${self.id}`));
  expect(await api.save('garage.v22', 'DB.shop', '', { ...before.shop, vatReg: false })).toEqual(refused('DB.shop: vatReg'));

  // Nothing changed.
  const after = (await api.read('garage.v22')).data;
  for (const k of ['taxPeriods', 'creditNotes', 'payroll']) expect(after[k], k).toEqual(before[k]);
  expect(after.quotes).toEqual(before.quotes);
  expect(after.expenses).toEqual(before.expenses);
  expect(after.stockCuts.find((c: any) => c.id === cut.id).cancelled).toBe(false);
  expect(after.emp.find((e: any) => e.id === self.id).salary).toBe(self.salary);
  expect(after.shop.vatReg).toBe(true);
});
