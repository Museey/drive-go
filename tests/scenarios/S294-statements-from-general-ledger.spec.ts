import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (the owner's decisions of 2026-11-12: the statements are read from the general ledger, then the proposal
// of docs/NOTES.md "ข้อเสนอ: งบการเงินจากบัญชีแยกประเภท", "เอาตามที่เสนอทุกข้อ"): 08 → งบการเงิน for 2569 on the trial data.
// · The profit and loss has the rows it had and the same figures (the ledger agrees with it on this data).
// · The balance sheet on 31/12/2569 has the tax to claim or get back (1055 57,260.00 + 1060 90.00) and the tax to remit
//   (2030 3,631.95 + 2050 1,355.00), and equity as capital less drawings (3,000,000 − 660,000), the loss brought forward
//   (3030, −236,300.67) and the year's loss (−123,586.02): assets 2,425,100.26 = liabilities 444,986.95 + equity
//   1,980,113.31 (the old sheet had no tax and equity as what was left: 2,367,750.26 / 440,000.00 / 1,927,750.26).
// · The cash flow is the money in and out of cash and bank in 2569 by the day it moved: 2,238,980.00 at the start; from
//   customers 11,849.00 (the old one had 10,349.00, bills paid in full only: here also the 1,500.00 paid by transfer on
//   08/10/2569 towards MA-SA261000006); the other income and expenses of the capital menu, net 7,000.00 (25,000.00 −
//   18,000.00), which the old one left out; 935,644.00 at the end, the trial balance's 1010 960,625.60 less the 1020
//   24,981.60 on its credit side.
// · Printed, the sheets carry the same rows.
async function go(page: Page, item: string) {
  const sub = page.getByRole('button', { name: item, exact: true });
  if (!(await sub.isVisible())) await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await sub.click();
}
const rows = (t: Locator) => t.evaluate(e => [...e.querySelectorAll('tr')]
  .map(r => [...(r as HTMLTableRowElement).cells].map(c => (c as HTMLElement).innerText.replace(/\s+/g, ' ').trim()).join(' | ')));

const PL = [
  '4010 / 4020 รายได้จากการขายและบริการ | 51,885.00',
  '5010 หัก ต้นทุนอะไหล่และวัสดุที่ขาย | 25,390.00',
  'กำไรขั้นต้น | 26,495.00',
  '6000 ค่าใช้จ่ายในการขายและบริหาร | 28,500.00',
  '6010 เงินเดือนและเงินสมทบนายจ้าง | 0.00',
  '6130 ค่าเสื่อมราคา | 128,581.02',
  'รวมค่าใช้จ่ายดำเนินงาน | 157,081.02',
  '4030 บวก รายได้อื่น (รายรับอื่น ๆ) | 25,000.00',
  '6190 หัก ค่าใช้จ่ายเบ็ดเตล็ด (รายจ่ายอื่น ๆ) | 18,000.00',
  'กำไร (ขาดทุน) สุทธิก่อนภาษี | -123,586.02',
  'อัตรากำไรขั้นต้น 51.1% · อัตรากำไรสุทธิ -238.2%',
];
const BS = [
  'สินทรัพย์',
  'เงินสดและเงินฝากธนาคาร | 935,644.00',
  'ลูกหนี้การค้า | 43,577.95',
  'สินค้าคงเหลือ (ราคาทุน) | 935,410.00',
  'ภาษีรอใช้สิทธิ์ / ขอคืน (ภาษีซื้อ ภาษีถูกหัก ณ ที่จ่าย ลูกหนี้กรมสรรพากร) | 57,350.00',
  'ที่ดิน อาคาร และอุปกรณ์ — สุทธิ | 453,118.31',
  'รวมสินทรัพย์ | 2,425,100.26',
  'หนี้สินและส่วนของเจ้าของ',
  'เจ้าหนี้การค้าและค่าใช้จ่ายค้างจ่าย | 0.00',
  'ภาษีและเงินสมทบค้างนำส่ง (ภาษีขาย ภาษีมูลค่าเพิ่ม ภาษีหัก ณ ที่จ่าย ประกันสังคม) | 4,986.95',
  'เงินกู้ยืมคงเหลือ | 440,000.00',
  'รวมหนี้สิน | 444,986.95',
  'ทุน (หักถอนทุน) | 2,340,000.00',
  'กำไร (ขาดทุน) สะสมต้นปี | -236,300.67',
  'กำไร (ขาดทุน) สุทธิปีนี้ | -123,586.02',
  'ส่วนของเจ้าของ (ทุน + กำไรสะสม) | 1,980,113.31',
  'รวมหนี้สินและส่วนของเจ้าของ | 2,425,100.26',
];
const CF = [
  'เงินสดและเงินฝากธนาคารต้นงวด | 2,238,980.00',
  'กระแสเงินสดจากกิจกรรมดำเนินงาน',
  'เงินสดรับจากลูกค้า | 11,849.00',
  'เงินสดจ่ายค่าอะไหล่และผู้ขาย | 960,800.00',
  'เงินสดจ่ายค่าใช้จ่ายดำเนินงาน | 27,145.00',
  'เงินสดจ่ายเงินเดือนและประกันสังคม | 0.00',
  'เงินสดจ่ายภาษี (ภ.พ.30 ภ.ง.ด.1 ภ.ง.ด.3 ภ.ง.ด.53) | 0.00',
  'รายรับ / รายจ่ายอื่น ๆ (สุทธิ) | 7,000.00',
  'กระแสเงินสดจากกิจกรรมลงทุน',
  'เงินสดจ่ายซื้อสินทรัพย์ถาวร | 34,240.00',
  'เงินสดรับจากการขายสินทรัพย์ | 0.00',
  'กระแสเงินสดจากกิจกรรมจัดหาเงิน',
  'เงินลงทุนเพิ่มจากเจ้าของ | 0.00',
  'เงินกู้ยืมรับ | 0.00',
  'ถอนทุนและชำระคืนเงินกู้ | 300,000.00',
  'เงินสดคงเหลือปลายงวด | 935,644.00',
];

test('S294 ระบบใหม่: งบการเงินจากบัญชีแยกประเภท งบกำไรขาดทุนบรรทัดเดิม งบแสดงฐานะการเงินมีภาษีค้างรับค้างจ่ายและส่วนของเจ้าของแยกทุน กำไรสะสม กำไรปีนี้ งบกระแสเงินสดจากเงินสดและธนาคาร และพิมพ์', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await go(page, '└ งบการเงิน');
  await expect.poll(() => rows(page.locator('#plTbl'))).toEqual(PL);
  expect(await rows(page.locator('#bsTbl'))).toEqual(BS);
  expect(await rows(page.locator('#cfTbl'))).toEqual(CF);

  // The end of the cash flow is the trial balance's cash and bank.
  await go(page, '└ ผังบัญชี');
  const tb = (code: string) => page.locator('#tbTbl').getByRole('row').filter({ has: page.getByRole('cell', { name: code, exact: true }) }).getByRole('cell');
  await expect(tb('1010')).toHaveText(['1010', 'เงินสด', /สินทรัพย์/, '960,625.60', '']);
  await expect(tb('1020')).toHaveText(['1020', 'เงินฝากธนาคาร', /สินทรัพย์/, '', '24,981.60']);

  // Printed: the same rows.
  await go(page, '└ งบการเงิน');
  await page.getByRole('button', { name: 'พิมพ์งบการเงิน' }).click();
  const sheet = page.locator('#printStage');
  await expect(sheet).toContainText('งบแสดงฐานะการเงิน');
  const printed = await rows(sheet);
  for (const r of [...PL, ...BS, ...CF]) expect(printed).toContain(r);
});
