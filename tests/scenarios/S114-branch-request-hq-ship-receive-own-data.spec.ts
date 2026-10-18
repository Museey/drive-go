import { test, expect } from '../support/test';
import { legacyGolden } from '../support/legacy-golden';
import { hqOwnData } from '../support/hq-own-data';
import type { Page } from '@playwright/test';

test.use({ dataset: 'franchise-trial' });

// Replaces S92 in the new system (tests/intentional-changes.json, decision Q3):
// HQ works on its own data set, so HQ's screens show the chain's name, its own
// licence line and its own badges (tests/support/hq-own-data.ts); its stock
// import still copies the first branch's register. Every step, data change,
// branch screen and the rest of every HQ screen are still S92's.
const S92 = 'S92-branch-request-hq-ship-receive.spec.ts';

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

test('S114 ระบบใหม่: สาขาขอเบิกอะไหล่จาก HQ (ข้อมูลของ HQ เอง) HQ ลดจำนวนอนุมัติและจัดส่งเท่าที่คลังมี สาขายืนยันรับของเข้าสต๊อก', async ({ app, page }, testInfo) => {
  test.slow();
  const golden = legacyGolden(S92, { app, page, testInfo });
  await app.open();
  await app.login('b001', '1234');
  await golden.step('หัวหน้าสาขา B001 เข้าสู่ระบบ');

  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
  await golden.step('เปิดแท็บเบิกสินค้าจาก HQ');
  const before = await app.state();

  await page.getByRole('button', { name: '+ เพิ่มบรรทัดเอง' }).click();
  await page.getByRole('button', { name: '+ เพิ่มบรรทัดเอง' }).click();
  // Draft lines: product code (with a suggestion list), name, unit, quantity — no labels.
  const lines = page.getByRole('table').filter({ hasText: 'จำนวนขอเบิก' }).getByRole('row');
  const fillLine = async (n: number, code: string, qty: string) => {
    const code_ = lines.nth(n).getByRole('combobox');
    await code_.fill(code); await code_.press('Tab');
    const qty_ = lines.nth(n).getByRole('spinbutton');
    await qty_.fill(qty); await qty_.press('Tab');
  };
  await fillLine(1, 'EN-501', '60');
  await fillLine(2, 'OI-801', '30');
  await expect(lines.nth(1).getByRole('textbox').first()).toHaveValue('กรองน้ำมันเครื่อง Toyota');
  await page.getByLabel('หมายเหตุถึง HQ (ถ้ามี)').fill('ขอด่วนภายในสัปดาห์นี้');
  await golden.step('กรอกใบขอเบิก 2 รายการ');
  await golden.screen('branch-draft');

  await page.getByRole('button', { name: '📨 ส่งใบขอเบิกไป HQ' }).click();
  const myReq = page.getByRole('row').filter({ hasText: 'REQ-6910-0001' });
  await expect(myReq).toContainText('รอ HQ อนุมัติ');
  await golden.step('ส่งใบขอเบิกไป HQ แล้ว');
  await golden.stateChange('submit', before);

  await signOut(page);
  await app.login('hq', '1234');
  await golden.step('HQ เข้าสู่ระบบ เห็นใบขอเบิกรออนุมัติ 1 ใบ');

  // HQ stock starts empty: import the register (the first branch's), then HQ has only 20 sets of OI-801 left.
  await page.getByRole('button', { name: '🏭 คลังกลาง HQ (Min-Max)' }).click();
  await page.getByRole('button', { name: '⇪ นำเข้ารายการจากทะเบียนสาขาที่เปิดอยู่' }).click();
  const hqOil = page.getByRole('row').filter({ hasText: 'OI-801' }).getByRole('spinbutton').first();
  await hqOil.fill('20'); await hqOil.press('Tab');
  await golden.step('HQ ตั้งคลังกลาง น้ำมันเครื่อง OI-801 เหลือ 20');
  const beforeShip = await app.state();

  await page.getByRole('button', { name: /📦 ใบขอเบิกจากสาขา/ }).click();
  const hqReq = page.getByRole('row').filter({ hasText: 'REQ-6910-0001' });
  await expect(hqReq).toContainText('B001 · สาขาหลัก รังสิต');
  await golden.step('HQ เปิดรายการใบขอเบิกจากสาขา');
  await golden.screen('hq-request-list', { mask: await hqOwnData(page) });

  await hqReq.getByRole('button', { name: 'ตรวจ / อนุมัติ' }).click();
  // The request window is not a recognised pop-up for the flow referee, so check its title here.
  await expect(page.getByText('ใบขอเบิก REQ-6910-0001 — B001 · สาขาหลัก รังสิต')).toBeVisible();
  const enApprove = page.getByRole('row').filter({ hasText: 'EN-501' }).filter({ visible: true }).getByRole('spinbutton');
  await enApprove.fill('40'); await enApprove.press('Tab');
  await golden.step('HQ แก้จำนวนอนุมัติ EN-501 จาก 60 เป็น 40');
  await golden.screen('hq-request-detail', { mask: await hqOwnData(page) });

  await page.getByRole('button', { name: '✔ อนุมัติและจัดส่ง (ตัดคลัง HQ)' }).click();
  await golden.step('กดอนุมัติและจัดส่ง ป๊อปอัพเตือนของไม่พอเปิดอยู่ใต้หน้าต่างใบขอเบิก');
  // Legacy behaviour reported to the owner: the warning opens behind the request window,
  // so the user has to close the request window to reach it.
  await golden.screen('shortage-warning-hidden', { mask: await hqOwnData(page) });

  await page.getByRole('button', { name: '✕ ปิด' }).click();
  await expect(page.getByText('OI-801 — คงเหลือ 20 / ขอ 30', { exact: false })).toBeVisible();
  await golden.step('ปิดหน้าต่างใบขอเบิก เห็นป๊อปอัพคลัง HQ ไม่พอ');
  await golden.screen('shortage-warning', { mask: await hqOwnData(page) });

  await page.getByRole('button', { name: 'จัดส่งเท่าที่มี', exact: true }).click();
  await expect(hqReq).toContainText('HQ จัดส่งแล้ว — รอสาขายืนยันรับ');
  await golden.step('HQ จัดส่งเท่าที่มี');
  await golden.stateChange('ship', beforeShip);

  await signOut(page);
  await app.login('b001', '1234');
  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
  await expect(myReq).toContainText('HQ จัดส่งแล้ว — รอสาขายืนยันรับ');
  await golden.step('สาขา B001 เห็นใบเบิกที่ HQ จัดส่งแล้ว');
  const beforeReceive = await app.state();

  await myReq.getByRole('button', { name: '✔ ยืนยันรับของเข้าสต๊อก' }).click();
  await golden.step('กดยืนยันรับของ');
  await page.getByRole('button', { name: 'รับของเข้าสต๊อก', exact: true }).click();
  await expect(myReq).toContainText('รับของเข้าสต๊อกแล้ว');
  await golden.step('รับของเข้าสต๊อกสาขาแล้ว');
  await golden.screen('branch-received');
  await golden.stateChange('receive', beforeReceive);
  golden.done();
});
