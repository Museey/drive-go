import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';

test.use({ dataset: 'franchise-trial' });

async function signOut(page: Page) {
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
}

test('S97 แต่ละบทบาทในเครือเห็นอะไร: HQ, พนักงานสาขา (SHB) และหัวหน้าสาขาที่ยังไม่มีข้อมูล', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button /HQ ศูนย์กลางแฟรนไชส์/
      - button /00 Mr\\.DriveGo/
      - button /10 ตั้งค่าองค์กร/
  `);
  await golden.step('HQ เห็นเฉพาะเมนู HQ, 00 และ 10');

  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  await expect(page.getByRole('heading', { name: '🏬 สาขาแฟรนไชส์ — ส่วนนี้เห็นเฉพาะรหัส HQ' })).toBeVisible();
  // Below the HQ panel are the organisation settings of B001, the branch loaded for HQ.
  await expect(page.getByRole('heading', { name: 'ตั้งค่าองค์กร · ข้อมูลผู้ใช้งานที่แสดงบนหัวเอกสาร' })).toBeVisible();
  await golden.step('HQ เปิดเมนู 10 เห็นแผงสาขาแฟรนไชส์และการตั้งค่าองค์กร');
  await golden.screen('hq-settings');

  await signOut(page);
  await app.login('staff001', '5678');
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button /00 Mr\\.DriveGo/
      - button /01 ลูกค้าสัมพันธ์/
      - button /02 ข้อมูลลูกค้า/
      - button /03 ใบเสนอราคา \\/ อนุมัติซ่อม/
      - button /04 ใบเสร็จรับเงิน \\/ ใบกำกับภาษี/
      - button /07 สต๊อกอะไหล่/
  `);
  await golden.step('หัวหน้าช่าง (SHB) ของ B001 เข้าระบบ เห็นเฉพาะเมนูตามสิทธิ');
  await golden.screen('staff001-home');

  await page.getByRole('button', { name: /07 สต๊อกอะไหล่/ }).click();
  await page.getByRole('button', { name: '★ เบิกสินค้าจาก HQ' }).click();
  const before = await app.state();
  await page.getByRole('button', { name: '⚡ เติมรายการอัตโนมัติจากเกณฑ์ Min-Max' }).click();
  await page.getByRole('button', { name: '📨 ส่งใบขอเบิกไป HQ' }).click();
  await expect(page.getByText('ยังไม่มีใบขอเบิก', { exact: false }).filter({ visible: true })).toBeVisible();
  await golden.step('หัวหน้าช่างส่งใบขอเบิกไม่ได้ เพราะไม่มีสิทธิจัดการสต๊อก');
  await golden.stateChange('staff-request-refused', before);

  await signOut(page);
  await app.login('b002', '1234');
  await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
    - navigation:
      - /children: equal
      - button "◀ พับเมนู"
      - button /00 Mr\\.DriveGo/
      - button /01 ลูกค้าสัมพันธ์/
      - button /P1 DriveGo ProX · Ecosystem/
      - button /02 ข้อมูลลูกค้า/
      - button /03 ใบเสนอราคา \\/ อนุมัติซ่อม/
      - button /04 ใบเสร็จรับเงิน \\/ ใบกำกับภาษี/
      - button /05 ข้อมูลผู้ขาย/
      - button /06 รายจ่าย \\/ ซื้อสินค้า/
      - button /07 สต๊อกอะไหล่/
      - button /08 บัญชี - การเงิน/
      - button /09 งานบุคคล/
      - button /P2 ห้องข้อมูลเทคนิค/
      - button /10 ตั้งค่าองค์กร/
      - button /11 ตั้งค่าเพิ่มเติม/
  `);
  await golden.step('หัวหน้าสาขา B002 เข้าระบบ เห็นทุกเมนูยกเว้น HQ แต่ข้อมูลว่าง');
  await golden.screen('b002-home');

  await page.getByRole('button', { name: /10 ตั้งค่าองค์กร/ }).click();
  await expect(page.getByRole('heading', { name: '🟢 บัญชีเข้าระบบของพนักงาน (SHB) — สาขา B002 สาขาบางนา' })).toBeVisible();
  await expect(page.getByText('ยังไม่มีพนักงานในสาขา', { exact: false })).toBeVisible();
  await expect(page.getByText('สาขาแฟรนไชส์ — ส่วนนี้เห็นเฉพาะรหัส HQ')).toBeHidden();
  await golden.step('หัวหน้าสาขา B002 เปิดเมนู 10 เห็นเฉพาะแผงพนักงานของสาขาตัวเอง');
  await golden.screen('b002-settings');
});
