import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.5, decisions R2, R8-ก / F3 = ก, R8-ข and the owner's
// answers of 2026-10-25), the parts no legacy scenario covers:
// · a new sale paid at once ("ชำระเงิน" on the draft) has its receipt and its
//   audit line for the money (the legacy app wrote neither), and the receipt opens;
// · the debtor settle window takes a card surcharge too, like the sale window:
//   "ชาร์จเพิ่ม (%)" on the card, the fee and what is swiped, in the check card
//   and on the receipt; with "แยกใบเสร็จตามบิล" each receipt holds its own bill's
//   share of the methods (bills oldest first, methods in the order entered);
// · the daily report: the card surcharges of the day (not income) and money paid
//   back to customers by credit notes.
const BBL = 'ธนาคารกรุงเทพ 789-0-12345-6 (หจก.เอกหม้อน้ำ)';
const fig = (page: Page, label: string) => page.locator('#sdSum2 > div').filter({ has: page.getByText(label, { exact: true }) });

test('S156 ระบบใหม่: ขายแล้วชำระทันทีได้ใบเสร็จ หน้ารับชำระเงินลูกหนี้ชาร์จบัตรได้ แยกใบเสร็จตามบิลเก็บเงินส่วนของแต่ละบิล รายงานประจำวันบอกค่าธรรมเนียมบัตรและเงินคืนตามใบลดหนี้', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();

  // 1 · A new sale paid in cash at once: MA-SA261000015, its receipt MA-RE261000004 opens, and the money is in the audit log.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '+ สร้างข้อมูลใหม่' }).filter({ visible: true }).click();
  await page.getByRole('combobox', { name: 'ค้นหาสินค้าเร็ว' }).filter({ visible: true }).fill('BR-001');
  await page.getByRole('option', { name: /BR-001/ }).click();
  await expect(page.getByText('1,476.60').filter({ visible: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'ชำระเงิน', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'ชำระเงินสดเต็มจำนวน' }).click();
  await page.getByRole('button', { name: 'ตัดสต็อกและบันทึกรับชำระ' }).click();
  await expect(page.getByRole('heading', { name: 'ใบเสร็จรับเงิน MA-RE261000004' })).toBeVisible();
  await app.settle();
  let db = (await app.state()).DB;
  expect(db.receipts.find((r: any) => r.no === 'MA-SA261000015').payments).toEqual([expect.objectContaining({ amt: 1476.6, method: 'cash', reNo: 'MA-RE261000004' })]);
  expect(db.audit.at(-1)).toMatchObject({ kind: 'stockcut', no: 'MA-SA261000015', act: 'pay', note: 'รับชำระ 1,476.60 บาท (เงินสด) · ใบเสร็จ MA-RE261000004 · ชำระครบแล้ว' });
  await page.locator('#mSaleRcpt').getByRole('button', { name: 'ปิด', exact: true }).last().click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // 2 · วิภา ศรีสมบูรณ์ pays two bills in the settle window: cash 5,000.00, the rest by card with a 3% surcharge, one receipt per bill.
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ ลูกหนี้ (ค้างรับ)' }).click();
  await page.getByRole('button', { name: '+ รับชำระเงิน' }).click();
  await page.getByPlaceholder('พิมพ์ชื่อลูกค้า').filter({ visible: true }).fill('วิภา');
  await page.getByRole('button', { name: /^วิภา ศรีสมบูรณ์/ }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-SA261000004' }).check();
  await page.getByRole('checkbox', { name: 'เลือก MA-SA261000014' }).check();
  await page.getByRole('button', { name: 'เงินสด แตะเพื่อเพิ่ม' }).filter({ visible: true }).click();
  await page.getByRole('textbox', { name: 'จำนวนเงินที่รับจริง เงินสด' }).fill('5000');
  await page.getByRole('button', { name: 'บัตร แตะเพื่อเพิ่ม' }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ยอดที่เหลือ' }).filter({ visible: true }).last().click();
  await page.getByRole('combobox', { name: 'ธนาคารของบัตร *' }).fill('KTC');
  await page.getByRole('textbox', { name: 'เลข 4 ตัวท้ายบัตร *' }).fill('4321');
  await page.getByRole('textbox', { name: 'ชาร์จเพิ่ม (%)' }).fill('3');
  await expect(page.getByText('ค่าธรรมเนียม 161.05 บาท · ยอดที่ต้องรูดรวม 5,529.35 บาท', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'แยกใบเสร็จตามบิล' }).check();
  await page.getByRole('button', { name: 'บันทึกรับชำระ' }).filter({ visible: true }).click();
  await expect(page.getByText('ค่าธรรมเนียมบัตร 3% ฿161.05 — ยอดที่ต้องรูดรวม ฿5,529.35', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ยืนยันบันทึกรับชำระ ฿10,368.30' }).click();
  await app.settle();
  db = (await app.state()).DB;
  const pay = (no: string) => db.receipts.find((r: any) => r.no === no).payments.at(-1);
  expect(pay('MA-SA261000014')).toMatchObject({ amt: 310.3, method: 'cash', reNo: 'MA-RE261000005', methods: [{ k: 'cash', amt: 310.3 }] });
  expect(pay('MA-SA261000004')).toMatchObject({ amt: 10058, method: 'card', reNo: 'MA-RE261000006',
    methods: [{ k: 'cash', amt: 4689.7 }, { k: 'card', amt: 5368.3, bank: 'KTC', card4: '4321', pct: 3, fee: 161.05 }] });
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();

  // The receipt of MA-SA261000004: its cash share, the card swiped with the fee, the sale's amount and the fee on lines of their own.
  await page.getByRole('button', { name: /^04 ใบเสร็จรับเงิน/ }).click();
  await page.getByRole('button', { name: '└ 4.3 ใบเสร็จรับเงิน' }).click();
  await page.getByText('MA-RE261000006', { exact: true }).filter({ visible: true }).first().click();
  const rcpt = page.locator('#mSaleRcpt');
  await expect(rcpt.getByRole('row', { name: /^เงินสด/ })).toContainText('4,689.70');
  await expect(rcpt.getByRole('row', { name: /^บัตรเครดิต/ })).toContainText('5,529.35');
  await expect(rcpt.getByRole('row', { name: /^ยอดตามใบตัดสต็อก/ })).toContainText('10,058.00');
  await expect(rcpt.getByRole('row', { name: /^ค่าธรรมเนียมบัตรเครดิต 3%/ })).toContainText('161.05');
  await expect(rcpt.getByRole('row', { name: /^ยอดรับครั้งนี้/ })).toContainText('10,219.05');
  await rcpt.getByRole('button', { name: 'ปิด', exact: true }).last().click();

  // 3 · A credit note pays 1,476.60 back in cash for MA-SA261000010 (as in S142).
  await page.getByRole('button', { name: '└ 4.6 ใบกำกับภาษี' }).click();
  await page.getByRole('button', { name: '+ ออกใบลดหนี้' }).click();
  const cn = page.locator('div.panel').filter({ has: page.getByRole('heading', { name: /ใบลดหนี้/ }) });
  await cn.getByLabel('ค้นหาเลขที่ใบตัดสต็อก / ใบกำกับภาษี / ชื่อลูกค้า').fill('MA-SA261000010');
  await cn.getByRole('row').filter({ hasText: 'MA-SA261000010' }).getByRole('button', { name: 'เลือก' }).click();
  await cn.getByRole('spinbutton', { name: 'จำนวนที่คืน BR-001' }).fill('1');
  await cn.getByLabel('เหตุผล (ต้องกรอก)').fill('ลูกค้านำผ้าเบรกที่ยังไม่ได้ใช้มาคืน');
  await cn.getByRole('button', { name: 'บันทึกใบลดหนี้' }).click();
  await expect(cn.getByRole('heading', { name: 'ใบลดหนี้ MA-CN261000001' })).toBeVisible();
  await cn.getByRole('button', { name: 'ปิด' }).click();

  // The daily report: money received counted once by method, the day's card surcharges (not income), the money paid back.
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: 'รายงานประจำวัน' }).click();
  await expect(fig(page, 'รับเงินรวม')).toContainText('15,709.70');   // 1,476.60 + 10,368.30 + the fixture's 3,864.80
  await expect(fig(page, 'เงินสด')).toContainText('10,341.40');      // 1,476.60 + 5,000.00 + 3,864.80
  await expect(fig(page, 'บัตร')).toContainText('5,368.30');
  await expect(page.getByText('ค่าธรรมเนียมบัตรที่ลูกค้าจ่ายเพิ่มวันนี้ 161.05 บาท — ไม่ใช่รายได้ ใช้หักกับค่าธรรมเนียมที่ธนาคารเก็บ (ไม่รวมในยอดบัตรข้างบน)')).toBeVisible();
  await expect(page.getByText('คืนเงินลูกค้าตามใบลดหนี้', { exact: true })).toBeVisible();
  await expect(page.getByText('MA-CN261000001 · MA-SA261000010 · −1,476.60 (เงินสด)', { exact: true })).toBeVisible();
});
