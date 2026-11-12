import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (accountant round 3, J32; the owner's decision 6 of 2026-11-11, docs/ACCOUNTANT-ANSWERS.md): 08 บัญชี →
// ยอดยกมา. The day the books start (the first day of the month of the first sale: 01/10/2569) and every account's
// balance on the day before; "ใช้ยอดจากข้อมูลในระบบ" fills them from the documents up to then (cash 1,911,740.00,
// the assets, capital, 1055 57,260.00 of input VAT on the assets bought in 2566–2567, …). The shop knows that VAT was
// claimed on its returns long ago and refunded in cash: 1055 to nothing, cash 57,260.00 more. Saved only when debits
// equal credits. The general ledger then starts on 01/10/2569 with one "ยอดยกمา" entry, and October's ภ.พ.30 has no
// input VAT carried in: 3,631.95 to pay. Removing the opening balances brings the old carry back.
async function go(page: Page, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await sub.click();
}
const box = (page: Page, side: 'เดบิต' | 'เครดิต', code: string) => page.locator('#a-opening').getByLabel(`${side} ${code}`, { exact: true });
const vatLine = (page: Page) => page.locator('#taxSumTbl').getByRole('row').filter({ hasText: /^ภ\.พ\.30 เดือน/ });

test('S292 ระบบใหม่: ยอดยกมา วันเริ่มใช้ ใส่ยอดจากข้อมูลในระบบ แก้ยอด เดบิตต้องเท่าเครดิต บัญชีแยกประเภทเริ่มที่ยอดยกมา ภ.พ.30 ไม่ยกภาษีซื้อเก่า และล้างยอดยกมา', async ({ app, page }) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-05T09:00:00+07:00'));
  await app.loginAsOwner();
  await go(page, '└ ยอดยกมา');
  const pane = page.locator('#a-opening');
  await expect(pane.getByRole('heading', { name: 'ยอดยกมา' })).toBeVisible();
  await expect(pane.getByText('ยังไม่ได้บันทึก — บัญชีแยกประเภทใช้รายการตั้งแต่เอกสารแรก')).toBeVisible();
  await expect(pane.getByLabel('วันเริ่มใช้โปรแกรม')).toHaveValue('2026-10-01');

  // From the documents up to 30/09/2569.
  await pane.getByRole('button', { name: 'ใช้ยอดจากข้อมูลในระบบ' }).click();
  await expect(page.getByText('ใส่ยอดจากข้อมูลในระบบ ณ สิ้นวัน 30/09/2569 แล้ว — ตรวจและแก้ก่อนบันทึก')).toBeVisible();
  await expect(box(page, 'เดบิต', '1010')).toHaveValue('1911740.00');
  await expect(box(page, 'เดบิต', '1055')).toHaveValue('57260.00');
  await expect(box(page, 'เครดิต', '3010')).toHaveValue('3000000.00');
  await expect(pane.locator('tfoot')).toContainText('3,823,903.05');

  // The old input VAT was refunded in cash: unbalanced first, refused; then balanced.
  await box(page, 'เดบิต', '1055').fill('');
  await pane.getByRole('button', { name: 'บันทึกยอดยกมา' }).click();
  await expect(page.getByText('ยอดเดบิตและเครดิตต้องเท่ากัน (ต่างกัน 57,260.00 บาท)')).toBeVisible();
  await box(page, 'เดบิต', '1010').fill('1969000');
  await pane.getByRole('button', { name: 'บันทึกยอดยกมา' }).click();
  await expect(page.getByText('บันทึกยอดยกมาแล้ว · บัญชีแยกประเภทเริ่มวันที่ 01/10/2569')).toBeVisible();
  await expect(pane.getByText(/^บันทึกแล้ว 05\/11\/2569 โดย .+ · บัญชีแยกประเภทเริ่มวันที่ 01\/10\/2569$/)).toBeVisible();
  let db = (await app.state()).DB;
  expect(db.opening).toMatchObject({ date: '2026-10-01' });
  expect(db.opening.lines.find((l: any) => l.a === '1010')).toMatchObject({ dr: 1969000, cr: 0 });
  expect(db.opening.lines.find((l: any) => l.a === '1055')).toBeUndefined();
  expect(db.audit.find((x: any) => x.kind === 'opening').note).toBe('บันทึกยอดยกมา วันเริ่มใช้ 01/10/2569 · 18 บัญชี · 3,823,903.05 บาท');

  // The general ledger starts on 01/10/2569 with the opening entry; every entry balances.
  await go(page, '└ บัญชีแยกประเภท');
  const ledger = page.locator('#a-ledger');
  await ledger.getByLabel('บัญชี', { exact: true }).selectOption('1010');
  const rows = ledger.locator('tbody tr');
  await expect(rows.nth(0).getByRole('cell')).toHaveText(['', '', 'ยอดยกมา', '', '', '0.00']);
  await expect(rows.nth(1).getByRole('cell')).toHaveText(['01/10/2569', '', 'ยอดยกมา', '1,969,000.00', '', '1,969,000.00']);
  expect(await page.evaluate(() => (window as any).PKG_LEDGER.check().length)).toBe(0);

  // October's ภ.พ.30: nothing carried in from before the books started.
  await go(page, '└ รายงานภาษี');
  await page.getByLabel('งวดเดือน').filter({ visible: true }).fill('2026-10');
  await expect(vatLine(page)).toHaveText('ภ.พ.30 เดือนตุลาคม 2569: ภาษีขาย − ภาษีซื้อ 3,631.95 บาท · ต้องชำระ 3,631.95 บาท บันทึกนำส่ง ภ.พ.30');

  // Removed: the old carry is back.
  await go(page, '└ ยอดยกมา');
  await pane.getByRole('button', { name: 'ล้างยอดยกมา' }).click();
  // The page has a "ล้างยอดยกมา" button too: press the one on the confirm card.
  const card = page.locator('div').filter({ hasText: 'บัญชีแยกประเภทจะกลับไปใช้รายการตั้งแต่เอกสารแรก' }).filter({ has: page.getByRole('button', { name: 'ไม่ล้าง' }) }).last();
  await card.getByRole('button', { name: 'ล้างยอดยกมา', exact: true }).click();
  await expect(page.getByText('ล้างยอดยกมาแล้ว')).toBeVisible();
  await expect(pane.getByText('ยังไม่ได้บันทึก — บัญชีแยกประเภทใช้รายการตั้งแต่เอกสารแรก')).toBeVisible();
  db = (await app.state()).DB;
  expect(db.opening).toBeNull();
  await go(page, '└ รายงานภาษี');
  await expect(vatLine(page)).toContainText('หักภาษีซื้อที่ยกมา 3,631.95 บาท · ต้องชำระ 0.00 บาท');
});
