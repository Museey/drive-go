import { test, expect } from '../support/test';
import { legacyGolden, legacyStateChange } from '../support/legacy-golden';

// Replaces S32 in the new system (tests/intentional-changes.json, accountant review 4.2, the owner's decision of
// 2026-10-29): approving a count that has goods over asks the approver to confirm each one's unit cost (the register
// cost is filled in) with a note of the evidence. Here the air-conditioning gas AC-230 counted 20 of 19 is confirmed
// at 1,650.00 (its last purchase) instead of the register's 1,600.00: the lot it opens and the other income take
// 1,650.00, the register cost becomes the average of what is left, the count keeps the cost and the evidence, its
// history and its window say so. Every other step, screen and data change is checked against S32's goldens.
const S32 = 'S32-stock-count-adjust.spec.ts';

test('S257 ระบบใหม่: อนุมัติใบตรวจนับที่มีของเกิน ผู้อนุมัติยืนยันทุนต่อหน่วยของของเกิน (ใส่ทุนเฉลี่ยไว้ให้) พร้อมหลักฐาน ล็อตใหม่ใช้ทุนที่ยืนยัน', async ({ app, page }, testInfo) => {
  const golden = legacyGolden(S32, { app, page, testInfo });
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'ตรวจนับสินค้า' }).click();
  await golden.step('ทะเบียนใบตรวจนับสินค้า');

  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await golden.step('ใบตรวจนับสินค้าใหม่');

  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await golden.step('ดึงสินค้าหมวดอะไหล่แอร์ 4 รายการ');

  await page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ visible: true }).getByRole('spinbutton').fill('17');
  await page.getByRole('row').filter({ hasText: 'AC-230' }).filter({ visible: true }).getByRole('spinbutton').fill('20');
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('ตรวจนับประจำเดือน');
  await golden.step('กรอกยอดนับได้จริง');
  await golden.screen('count-filled');

  // The approval asks for the cost of what is over: AC-230 × 1, the register cost 1,600.00 filled in.
  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  const ask = page.locator('#mAsk');
  await expect(ask.getByText('ยืนยันทุนของเกิน', { exact: true })).toBeVisible();
  await expect(ask.getByRole('row')).toHaveCount(2);
  await expect(ask.getByRole('row').nth(1).getByRole('cell')).toHaveText(['AC-230', 'น้ำยาแอร์ R134a (ถัง 13.6 กก.)', '1', '1,600.00', '']);
  const cost = ask.getByRole('spinbutton', { name: 'ทุนต่อหน่วย AC-230' });
  await expect(cost).toHaveValue('1600');
  // The evidence is required: the button waits for it.
  const yes = ask.getByRole('button', { name: 'ยืนยันทุนและอนุมัติ' });
  await expect(yes).toBeDisabled();
  await cost.fill('1650');
  await ask.getByPlaceholder('หลักฐานของทุน เช่น ใบกำกับภาษีที่ซื้อครั้งล่าสุด').fill('ใบกำกับภาษีร้านแอร์ไทย IV-6610 ลงวันที่ 2 ต.ค. 2569 ราคา 1,650 บาท');
  await yes.click();
  await golden.step('หลังกดอนุมัติเอกสาร');

  // S32's data change, but for the cost confirmed: the lot, the register cost, the count and its history.
  const legacy = JSON.parse(legacyStateChange(S32, 'approve-count'));
  const lots = legacy['DB.fifo.lots'];
  lots.added[0].cost = 1650;
  const count = legacy['DB.stockCounts'];
  count.added[0].items[3].surplusCost = 1650;
  count.added[0].surplus = { note: 'ใบกำกับภาษีร้านแอร์ไทย IV-6610 ลงวันที่ 2 ต.ค. 2569 ราคา 1,650 บาท', date: '2026-10-13', by: '', byName: 'เจ้าของกิจการ / ผู้ดูแลระบบ' };
  const audit = legacy['DB.audit'];
  audit.added.splice(2, 0, { ...audit.added[1], id: '@DB.audit[MA-CT261000001#52]', act: 'surplus',
    note: 'ยืนยันทุนของเกิน AC-230 × 1 ทุน 1,650.00 (ทุนเฉลี่ย 1,600.00) — หลักฐาน: ใบกำกับภาษีร้านแอร์ไทย IV-6610 ลงวันที่ 2 ต.ค. 2569 ราคา 1,650 บาท' });
  audit.added[3].id = '@DB.audit[MA-CT261000001#53]';
  const ac230 = before.DB.stock.find((s: any) => s.code === 'AC-230');
  const left = before.DB.fifo.lots.filter((l: any) => l.stockId === ac230.id && l.left > 0);
  const q = left.reduce((t: number, l: any) => t + l.left, 0), v = left.reduce((t: number, l: any) => t + l.left * l.cost, 0);
  const avg = Math.round((v + 1650) / (q + 1) * 100) / 100;
  expect(avg).toBeGreaterThan(1600);
  await golden.stateChange('approve-count', before, { 'DB.fifo.lots': lots, 'DB.stockCounts': count, 'DB.audit': audit,
    'DB.stock[AC-230].cost': [1600, avg] });

  // The count's window says what it booked and the cost confirmed.
  await expect(page.getByText(/^ลงบัญชีตามทุน FIFO:/).filter({ visible: true })).toContainText(
    'ลงบัญชีตามทุน FIFO: ค่าใช้จ่ายสินค้าขาด 240.00 บาท · รายได้อื่น (สินค้าเกิน) 1,650.00 บาท'
    + 'ทุนของเกินยืนยันโดย เจ้าของกิจการ / ผู้ดูแลระบบ: AC-230 × 1 ทุน 1,650.00 — หลักฐาน: ใบกำกับภาษีร้านแอร์ไทย IV-6610 ลงวันที่ 2 ต.ค. 2569 ราคา 1,650 บาท');

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  await golden.step('กลับไปที่ทะเบียนใบตรวจนับ');
  await golden.screen('count-list');
  golden.done();

  // A second count, AC-204 counted 20 of 19: approving several at once leaves it for its own window.
  const toast = (text: string) => expect(page.getByText(text, { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await page.getByRole('row').filter({ hasText: 'AC-204' }).filter({ visible: true }).getByRole('spinbutton').fill('20');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click();
  const row = page.locator('#scTbl').getByRole('row').filter({ hasText: 'MA-CT261000002' });
  await expect(row).toContainText('รออนุมัติ');
  await row.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'อนุมัติใบที่เลือก' }).click();
  await toast('ไม่มีใบที่อนุมัติได้ในรายการที่เลือก — มีของเกินที่ต้องยืนยันทุน (อนุมัติทีละใบ) 1');

  // In its window: every unit cost must be more than 0; nothing is approved until it is.
  await row.getByRole('button', { name: 'เปิด' }).click();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await expect(ask.getByText('ยืนยันทุนของเกิน · ใบตรวจนับ MA-CT261000002', { exact: true })).toBeVisible();
  await expect(ask.getByRole('row').nth(1).getByRole('cell')).toHaveText(['AC-204', 'คอมเพรสเซอร์แอร์ D-Max', '1', /^[\d,]+\.\d\d$/, '']);
  await ask.getByRole('spinbutton', { name: 'ทุนต่อหน่วย AC-204' }).fill('0');
  await ask.getByPlaceholder('หลักฐานของทุน เช่น ใบกำกับภาษีที่ซื้อครั้งล่าสุด').fill('ของแถมจากผู้ขาย');
  await ask.getByRole('button', { name: 'ยืนยันทุนและอนุมัติ' }).click();
  await toast('กรอกทุนต่อหน่วยของของเกินให้ครบทุกรายการ');
  await app.settle();
  const second = (await app.state()).DB.stockCounts.find((d: any) => d.no === 'MA-CT261000002');
  expect(second.applied).toBeFalsy();
  expect(second.surplus).toBeUndefined();
  expect(second.apv?.status).not.toBe('approved');
});
