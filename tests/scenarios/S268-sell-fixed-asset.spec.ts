import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (owner's decision 2026-11-06, NOTES.md "งานบัญชีที่ค้าง" 4): selling a fixed asset. The owner sells
// the air-conditioning refill machine (MA-FA241200001, cost 58,000.00) from its window to a customer for 40,000.00
// before VAT, by transfer: a VAT-registered shop issues a full tax invoice (MA-TX…), which prints; the asset is sold on
// that day; the sales tax of October takes its VAT; the trial balance takes the asset's cost and depreciation out, adds
// the gain (sale price less the value left) to 4030 and the money to cash. The sale cannot be edited afterwards.
async function go(page: Page, menu: string | RegExp, item: string) {
  const sub = page.getByRole('button', { name: item });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: menu }).click();
  await sub.click();
}
const num = (s: string) => Number((s || '0').replace(/,/g, '')) || 0;
async function tb(page: Page): Promise<Record<string, [number, number]>> {
  await go(page, /^08 บัญชี/, '└ ผังบัญชี');
  const out: Record<string, [number, number]> = {};
  for (const r of await page.locator('#tbTbl tbody tr').all()) {
    const c = await r.getByRole('cell').allTextContents();
    if (c.length >= 5) out[c[0].trim()] = [num(c[3]), num(c[4])];
  }
  return out;
}
const machine = 'เครื่องเติมน้ำยาแอร์อัตโนมัติ';

test('S268 ระบบใหม่: ขายสินทรัพย์ ออกใบกำกับภาษี ภาษีขายของเดือน กำไรจากการขายเข้า 4030 งบทดลองตัดทุนและค่าเสื่อม แก้ไขการขายไม่ได้', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const before = await tb(page);

  await go(page, '06 รายจ่าย / ซื้อสินค้า', '3 · ซื้อสินทรัพย์');
  await page.locator('#basTbl').getByRole('row').filter({ hasText: machine }).getByRole('button', { name: 'แก้ไข' }).click();
  await page.getByRole('button', { name: 'ขายสินทรัพย์' }).click();
  await expect(page.getByText(/^MA-FA241200001 · เครื่องเติมน้ำยาแอร์อัตโนมัติ · มูลค่าตามบัญชี ณ วันนี้ /)).toBeVisible();
  await page.getByLabel('ผู้ซื้อ (จากทะเบียนลูกค้า)').fill('บริษัท ขนส่งไทยรุ่งเรือง จำกัด');
  await page.getByLabel('ราคาขาย (ก่อน VAT)').fill('40000');
  await page.getByLabel('วิธีรับเงิน').selectOption('เงินโอน');
  await page.getByRole('button', { name: 'บันทึกการขาย' }).click();
  await expect(page.getByText(/^บันทึกการขาย MA-FA241200001 แล้ว · ใบกำกับภาษี MA-TX2610\d{5} · กำไร [\d,]+\.\d\d บาท$/)).toBeVisible();
  await app.settle();
  let db = (await app.state()).DB;
  const a = db.assets.find((x: any) => x.no === 'MA-FA241200001');
  const taxNo = a.sale.taxNo;
  expect(a).toMatchObject({ status: 'sold', out: '2026-10-13' });
  expect(a.sale).toMatchObject({ date: '2026-10-13', buyer: 'บริษัท ขนส่งไทยรุ่งเรือง จำกัด', tax: '0105561234567', rate: 7, base: 40000, vat: 2800, gross: 42800, method: 'เงินโอน' });
  expect(Math.abs(a.sale.gain - (40000 - a.sale.nbv))).toBeLessThan(0.005);
  expect(a.sale.nbv).toBeGreaterThan(30000);
  expect(a.sale.nbv).toBeLessThan(40000);

  // Its tax invoice printed (original and copy).
  const sheet = page.locator('#printStage');
  for (const t of ['ใบกำกับภาษี / ใบเสร็จรับเงิน', taxNo, 'บริษัท ขนส่งไทยรุ่งเรือง จำกัด', '0105561234567',
    'ขายสินทรัพย์ เครื่องเติมน้ำยาแอร์อัตโนมัติ (MA-FA241200001)', '40,000.00', '2,800.00', '42,800.00', 'เงินโอน วันที่ 13/10/2569'])
    await expect(sheet).toContainText(t);

  // The register shows it sold; its window no longer sells it, and its sale cannot be edited.
  await go(page, /^08 บัญชี/, '└ ทะเบียนสินทรัพย์');
  const row = page.locator('#assetTbl').getByRole('row').filter({ hasText: machine });
  await expect(row).toContainText('จำหน่ายแล้ว');
  await expect(row).toContainText(`ขายให้ บริษัท ขนส่งไทยรุ่งเรือง จำกัด 13/10/2569 · 42,800.00 บาท · ${taxNo}`);
  await row.getByRole('button', { name: 'แก้ไข' }).click();
  await expect(page.getByText(new RegExp(`· ขายแล้ว · ใบกำกับภาษี ${taxNo}$`))).toBeVisible();
  await expect(page.getByRole('button', { name: 'ขายสินทรัพย์' })).toBeHidden();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByText('สินทรัพย์นี้ขายแล้ว — แก้ไขไม่ได้', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The sales tax report of October has its tax invoice.
  await go(page, /^08 บัญชี/, '└ รายงานภาษี');
  await expect(page.getByRole('row', { name: /^ภาษีขาย / })).toContainText('6,431.95');   // 3,631.95 + 2,800.00

  // The trial balance: cost and depreciation out, the gain in 4030, the money in, the VAT owed.
  const after = await tb(page);
  const d = (code: string, i: 0 | 1) => Math.round(((after[code]?.[i] ?? 0) - (before[code]?.[i] ?? 0)) * 100) / 100;
  expect(d('1230', 0)).toBe(-58000);
  expect(d('1231', 1)).toBeLessThan(-15000);
  expect(d('4030', 1)).toBe(Math.round(a.sale.gain * 100) / 100);
  expect(d('2030', 1)).toBe(2800);
  expect(d('1010', 0)).toBe(42800);
  db = (await app.state()).DB;
  expect(db.audit.find((x: any) => x.kind === 'asset' && x.act === 'save' && /^ขายสินทรัพย์ MA-FA241200001/.test(x.note)).note)
    .toBe(`ขายสินทรัพย์ MA-FA241200001 ให้ บริษัท ขนส่งไทยรุ่งเรือง จำกัด 42,800.00 บาท (เงินโอน) · ใบกำกับภาษี ${taxNo} · กำไร ${(Math.round(a.sale.gain * 100) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`);
});
