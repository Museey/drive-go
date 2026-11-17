import { test, expect } from '../../tests/support/test';
import type { Page } from '@playwright/test';
import { shot } from './shots';

async function go(page: Page, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await sub.click();
  await page.waitForTimeout(500);
}

// Chapter 8: the accounts: chart of accounts and trial balance, general ledger, statements, opening balances,
// capital and cash/bank, financial health.
test('08 บัญชีและการเงิน', async ({ app, page }) => {
  await app.loginAsOwner();
  await go(page, '└ ผังบัญชี');
  await app.settle();
  await shot(page, '08-coa', { mark: [page.getByRole('button', { name: 'พิมพ์งบทดลอง' })] });
  const csv = page.getByRole('button', { name: 'ส่งออก CSV ให้สำนักงานบัญชี' });
  await shot(page, '08-tb', { mark: [[page.getByRole('button', { name: 'พิมพ์งบทดลอง' }), '1'], [csv, '2']] });

  await go(page, '└ บัญชีแยกประเภท');
  await app.settle();
  const ledger = page.locator('#a-ledger');
  await ledger.getByLabel('บัญชี', { exact: true }).selectOption('1010');
  await app.settle();
  await shot(page, '08-ledger', { mark: [[ledger.getByLabel('บัญชี', { exact: true }), '1'], [ledger.getByLabel('ตั้งแต่วันที่'), '2'], [ledger.getByRole('button', { name: 'ส่งออก Excel' }), '3']] });

  await go(page, '└ งบการเงิน');
  await app.settle();
  await shot(page, '08-fs', { mark: [page.getByRole('button', { name: 'พิมพ์งบการเงิน' })] });
  await page.locator('#bsTbl').scrollIntoViewIfNeeded();
  await shot(page, '08-fs-bs', { mark: [page.locator('#bsTbl')], scroll: false });

  await go(page, '└ ยอดยกมา');
  await app.settle();
  const pane = page.locator('#a-opening');
  await shot(page, '08-opening', { mark: [[pane.getByLabel('วันเริ่มใช้โปรแกรม'), '1'], [pane.getByRole('button', { name: 'ใช้ยอดจากข้อมูลในระบบ' }), '2'], [pane.getByRole('button', { name: 'บันทึกยอดยกมา' }), '3']], scroll: false });

  await go(page, '└ เงินลงทุน / เงินสด');
  await app.settle();
  const addCap = page.getByRole('button', { name: '+ บันทึกรายการ' });
  await shot(page, '08-capital', { mark: [addCap] });
  await addCap.click();
  const form = page.locator('#mCap');
  await form.getByLabel('ประเภทรายการ *').selectOption({ label: 'ฝากเงินสดเข้าธนาคาร' });
  await form.getByLabel('จำนวนเงิน (บาท) *').fill('50000');
  await form.getByLabel('รายละเอียด').fill('นำเงินสดหน้าร้านฝากธนาคาร');
  await shot(page, '08-capital-deposit', { mark: [[form.getByLabel('ประเภทรายการ *'), '1'], [form.getByLabel('จำนวนเงิน (บาท) *'), '2']], scroll: false });
  await form.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await app.settle();

  await go(page, '└ สุขภาพการเงิน');
  await app.settle();
  await shot(page, '08-health');
});
