import type { Page } from '@playwright/test';
import { test, expect } from '../support/test';

// New behaviour (task 3.13, the owner's answer 13.11 of 2026-10-26 and of the asset questions the same day): an asset
// with VAT dated in a closed tax month. Its life, salvage and status can still change (they are not tax), and it can be
// paid; its tax fields (here the cost, and so the VAT) cannot, and it cannot be cancelled — like a goods receipt, the
// owner opens the month again first. The server checks the same (tests/db/rules.test.mjs).
const popup = (page: Page, title: string) => page.locator('div.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const LOCKED = 'เดือน ต.ค. 2569 ปิดงวดภาษีแล้ว ใช้ใบลดหนี้แทน';

test('S213 ระบบใหม่: สินทรัพย์ที่มี VAT ในเดือนที่ปิดงวดภาษีแล้ว แก้อายุและจ่ายเงินได้ แก้ราคาทุนหรือยกเลิกไม่ได้', async ({ app, page }) => {
  test.slow();
  await page.clock.setFixedTime(new Date('2026-11-02T09:00:00+07:00'));
  await app.loginAsOwner();
  await app.signature();   /* the welcome message */

  // Bought on credit on 20/10/2569, before October is closed.
  await page.getByRole('button', { name: '06 รายจ่าย / ซื้อสินค้า' }).click();
  await page.getByRole('button', { name: '3 · ซื้อสินทรัพย์' }).click();
  await page.getByRole('button', { name: '+ บันทึกการซื้อสินทรัพย์' }).click();
  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const save = page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last();
  await field('วันที่ได้มา *').fill('2026-10-20');
  await field('ผู้ขาย').fill('บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด');
  await field('ผู้ขาย').dispatchEvent('change');
  await field('เลขที่ใบกำกับภาษี').fill('IV-6910-0777');
  const line = (i: number) => page.getByRole('row').filter({ has: page.getByPlaceholder('เช่น เครื่องเชื่อม CO2') }).filter({ visible: true }).nth(i);
  await line(0).getByRole('combobox').selectOption('เครื่องมือช่าง');
  await line(0).getByPlaceholder('เช่น เครื่องเชื่อม CO2').fill('เครื่องตั้งศูนย์ล้อ 3D');
  await line(0).getByRole('spinbutton').nth(0).fill('10000');
  await save.click();
  const row = page.locator('#basTbl').getByRole('row').filter({ hasText: 'เครื่องตั้งศูนย์ล้อ 3D' });
  await expect(row).toContainText('ค้างจ่าย');

  // October is closed.
  await page.getByRole('button', { name: /^08 บัญชี/ }).click();
  await page.getByRole('button', { name: '└ รายงานภาษี' }).click();
  await page.getByLabel('งวดเดือน').filter({ visible: true }).fill('2026-10');
  await page.getByRole('button', { name: 'ปิดงวดภาษี', exact: true }).click();
  await popup(page, 'ปิดงวดภาษีเดือน ต.ค. 2569?').getByRole('button', { name: 'ปิดงวดภาษี', exact: true }).click();
  await expect(page.getByText('ปิดงวดภาษีแล้ว', { exact: true })).toBeVisible();
  await app.signature();

  // The life changes; the cost does not.
  await page.getByRole('button', { name: '└ ทะเบียนสินทรัพย์', exact: true }).click();
  const reg = page.locator('#assetTbl').getByRole('row').filter({ hasText: 'เครื่องตั้งศูนย์ล้อ 3D' }).filter({ visible: true }).first();
  await reg.getByRole('button', { name: 'แก้ไข' }).click();
  await line(0).getByRole('spinbutton').nth(1).fill('8');
  await save.click();
  await expect(reg).toContainText('1,249.88');   /* (10,000 − 1) ÷ 8 a year */
  await app.settle();
  expect(await app.signature()).toMatchObject({ messages: ['บันทึกการแก้ไขสินทรัพย์แล้ว'] });
  await reg.getByRole('button', { name: 'แก้ไข' }).click();
  let before = (await app.state()).DB;
  await line(0).getByRole('spinbutton').nth(0).fill('9000');
  await save.click();
  await expect(page.getByText(LOCKED, { exact: true })).toBeVisible();
  await app.settle();
  expect((await app.state()).DB.assets).toEqual(before.assets);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  // It cannot be cancelled.
  await reg.getByRole('button', { name: 'ยกเลิก' }).click();
  await app.settle();
  expect(await app.signature()).toMatchObject({ messages: [LOCKED] });
  expect((await app.state()).DB.assets).toEqual(before.assets);

  // It is paid as usual: 10,000 + VAT 700 on 02/11/2569, voucher of November.
  await page.getByRole('button', { name: '└ เจ้าหนี้ (ค้างจ่าย)', exact: true }).click();
  await page.getByRole('button', { name: '+ ชำระเงินเจ้าหนี้' }).click();
  await page.getByRole('button').filter({ hasText: 'บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด' }).filter({ visible: true }).click();
  await page.getByRole('checkbox', { name: 'เลือก MA-FA261000001' }).check();
  await page.getByRole('button', { name: 'เต็มจำนวน' }).first().click();
  await page.getByRole('button', { name: 'บันทึกจ่ายชำระ' }).click();
  await page.getByRole('button', { name: 'ยืนยันบันทึกจ่ายชำระ ฿10,700.00' }).click();
  await expect(page.getByText('ใบสำคัญจ่าย MA-PV261100001')).toBeVisible();
  await app.settle();
  const a = (await app.state()).DB.assets.find((x: any) => x.no === 'MA-FA261000001');
  expect(a).toMatchObject({ paid: true, payDate: '2026-11-02', life: 8, cost: 10000 });
  expect(a.payments).toEqual([expect.objectContaining({ amt: 10700, date: '2026-11-02', pvNo: 'MA-PV261100001' })]);
});
