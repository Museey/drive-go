import { test, expect } from '../support/test';

// New behaviour (task 3.13, decision R17, the owner's answers 13.2–13.4 and 13.9 of 2026-10-26 and of the asset
// questions the same day):
// · The monthly profit and loss of the health page spreads each asset's year by the days held in each month (the
//   legacy app took a twelfth of the year in every month, even before the asset was bought): January 2569 has
//   157,198.60 × 31 ÷ 365 = 13,351.11 (no expenses or payroll recorded in it; legacy 13,766.53); April has the POS
//   computer of 12/04/2569 for 19 of its 264 days, 555.234, and the others for 30 days, 12,920.433: 13,475.67.
// · A disposed asset needs its disposal date and is depreciated up to the day before: the air conditioning machine
//   of 14/12/2567 sold 30/06/2569 has 180 days in 2569, 11,599.80 × 180 ÷ 365 = 5,720.45.
// · Deleting: only a purchase on credit with nothing paid. A purchase paid when saved is cancelled with a reason,
//   and its payment voucher is cancelled with it; it stays in the register, out of its sums.
test('S212 ระบบใหม่: กำไรรายเดือนคิดค่าเสื่อมตามวัน จำหน่ายสินทรัพย์ต้องมีวันที่ ลบได้เฉพาะเครดิตที่ยังไม่จ่าย นอกนั้นยกเลิกพร้อมเหตุผล', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  await app.signature();   /* the welcome message */
  await page.getByRole('button', { name: '08 บัญชี - การเงิน' }).click();
  await page.getByRole('button', { name: '└ สุขภาพการเงิน', exact: true }).click();
  const month = (m: string) => page.locator('#pnlMonthTbl').getByRole('row').filter({ hasText: m }).getByRole('cell').nth(4);
  await expect(month('ม.ค. 69')).toHaveText('13,351.11');
  await expect(month('เม.ย. 69')).toHaveText('13,475.67');

  // Disposal: the date is needed, and the year stops there.
  await page.getByRole('button', { name: '└ ทะเบียนสินทรัพย์', exact: true }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  const row = (name: string) => page.locator('#assetTbl').getByRole('row').filter({ hasText: name }).filter({ visible: true }).first();
  await row('เครื่องเติมน้ำยาแอร์อัตโนมัติ').getByRole('button', { name: 'แก้ไข' }).click();
  await expect(field('สถานะการชำระ')).toHaveValue('ชำระแล้ว');   /* recorded before: paid in cash */
  await page.getByRole('combobox', { name: /^สถานะ/ }).filter({ visible: true }).selectOption('จำหน่าย / ตัดออกแล้ว');
  await save.click();
  await app.settle();
  expect(await app.signature()).toMatchObject({ messages: ['สถานะจำหน่าย / ตัดออกแล้ว ต้องกรอกวันที่จำหน่าย — ค่าเสื่อมราคาหยุดที่วันนั้น'] });
  await field('วันที่จำหน่าย (ถ้ามี)').fill('2026-06-30');
  await save.click();
  await expect(row('เครื่องเติมน้ำยาแอร์อัตโนมัติ')).toContainText('จำหน่ายแล้ว');
  await expect(page.locator('#depTbl').getByRole('row').filter({ hasText: 'เครื่องเติมน้ำยาแอร์อัตโนมัติ' }))
    .toHaveText(/^เครื่องเติมน้ำยาแอร์อัตโนมัติ\s*14\/12\/2567\s*58,000\.00\s*5,720\.45\s*12,170\.28\s*17,890\.73\s*40,109\.27$/);

  // Recorded before this task: paid in cash, so it cannot be deleted; there is "ยกเลิก" instead.
  await expect(row('คอมพิวเตอร์ POS หน้าร้านพร้อมเครื่องพิมพ์').getByRole('button', { name: 'ลบ' })).toHaveCount(0);

  // On credit, nothing paid: deleted.
  const buy = async (name: string, vendor: string) => {
    await page.getByRole('button', { name: '+ บันทึกการซื้อสินทรัพย์' }).first().click();
    await field('วันที่ได้มา *').fill('2026-10-12');
    await field('ผู้ขาย').fill(vendor);
    await field('ผู้ขาย').dispatchEvent('change');
    const line = page.getByRole('row').filter({ has: page.getByPlaceholder('เช่น เครื่องเชื่อม CO2') }).filter({ visible: true }).first();
    await line.getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill(name);
    await line.getByRole('spinbutton').nth(0).fill('5000');
    await save.click();
    await expect(row(name)).toBeVisible();
  };
  await buy('ตู้เครื่องมือ 7 ชั้น', 'หจก. ไทยพาร์ท ซัพพลาย');   /* 15 days credit */
  await expect(row('ตู้เครื่องมือ 7 ชั้น')).toContainText('ค้างจ่าย');
  await row('ตู้เครื่องมือ 7 ชั้น').getByRole('button', { name: 'ลบ' }).click();
  await page.locator('div').filter({ hasText: 'ลบสินทรัพย์ MA-FA261000001 — ตู้เครื่องมือ 7 ชั้น ?' })
    .filter({ has: page.getByRole('button', { name: 'ไม่ลบ' }) }).last().getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(row('ตู้เครื่องมือ 7 ชั้น')).toHaveCount(0);

  // Paid when saved: cancelled with a reason, the voucher with it.
  await buy('ปั๊มลมโรตารี่ 10 แรง', 'ร้านยางเจริญยนต์');   /* cash */
  let db = (await app.state()).DB;
  expect(db.assets.at(-1)).toMatchObject({ no: 'MA-FA261000002', term: 'cash', paid: true, pvNo: 'MA-PV261000001' });
  await row('ปั๊มลมโรตารี่ 10 แรง').getByRole('button', { name: 'ลบ' }).waitFor({ state: 'detached' });
  await row('ปั๊มลมโรตารี่ 10 แรง').getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(page.getByText('เหตุผลที่ยกเลิก — ยกเลิกทั้งใบซื้อ (1 รายการ) และรายการจ่ายเงินพร้อมใบสำคัญจ่าย')).toBeVisible();
  await page.locator('div.panel').filter({ has: page.getByRole('heading', { name: 'ยกเลิกสินทรัพย์ MA-FA261000002', exact: true }) }).getByRole('textbox').fill('บันทึกซ้ำกับใบเดิม');
  await page.getByRole('button', { name: 'ยกเลิกสินทรัพย์' }).click();
  await expect(row('ปั๊มลมโรตารี่ 10 แรง')).toContainText('ยกเลิกแล้ว');
  await expect(row('ปั๊มลมโรตารี่ 10 แรง')).toContainText('บันทึกซ้ำกับใบเดิม');
  await expect(row('ปั๊มลมโรตารี่ 10 แรง').getByRole('button')).toHaveCount(0);
  await app.settle();
  db = (await app.state()).DB;
  const pump = db.assets.at(-1);
  expect(pump).toMatchObject({ cancelled: true, cancelReason: 'บันทึกซ้ำกับใบเดิม', cancelDate: '2026-10-13', paid: false });
  expect(pump.payments).toEqual([expect.objectContaining({ amt: 5350, pvNo: 'MA-PV261000001', cancelled: true, cancelReason: 'บันทึกซ้ำกับใบเดิม' })]);
  expect(db.audit.at(-1)).toMatchObject({ kind: 'asset', no: 'MA-FA261000002', act: 'cancel', note: 'ยกเลิกสินทรัพย์ ปั๊มลมโรตารี่ 10 แรง · เหตุผล: บันทึกซ้ำกับใบเดิม' });
  // Out of the register's sums and depreciation: the eight of the fixture only.
  await expect(page.getByRole('row', { name: /^รวม 8 รายการ/ })).toBeVisible();
  await expect(page.locator('#depTbl').getByRole('row').filter({ hasText: 'ปั๊มลมโรตารี่ 10 แรง' })).toHaveCount(0);
});
