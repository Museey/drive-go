import { test, expect } from '../../tests/support/test';
import { shot } from './shots';

// Chapter 6: the parts register, a new part, internal use, stock counts.
test('06 สต๊อกอะไหล่', async ({ app, page }) => {
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await app.settle();
  const add = page.getByRole('button', { name: '+ เพิ่มอะไหล่' });
  await shot(page, '06-register', { mark: [add] });
  await add.click();
  await page.getByLabel('รหัสสินค้าของอู่ *').filter({ visible: true }).fill('BR-030');
  await page.getByLabel('รหัสสินค้าอ้างอิง (OEM)').filter({ visible: true }).fill('04465-0K290');
  await page.getByLabel('ชื่อสินค้า *').filter({ visible: true }).fill('ผ้าเบรกหน้า Isuzu D-Max');
  await page.getByRole('combobox').filter({ has: page.getByRole('option', { name: 'ระบบเบรก', exact: true }) })
    .filter({ hasNot: page.getByRole('option', { name: /ทุกหมวด/ }) }).filter({ visible: true }).first().selectOption('ระบบเบรก');
  await page.getByLabel('ราคาซื้อ (ต้นทุน)').filter({ visible: true }).fill('900');
  const margin = page.getByPlaceholder('กำไร %').filter({ visible: true });
  await margin.nth(0).fill('75');
  await margin.nth(1).fill('60');
  await margin.nth(2).fill('50');
  await page.getByLabel('ปริมาณคงคลัง').filter({ visible: true }).fill('6');
  await page.getByLabel('Min — จุดสั่งซื้อ (เตือนสีเหลือง)').filter({ visible: true }).fill('2');
  await page.waitForTimeout(300);
  await shot(page, '06-item-form', { mark: [[page.getByLabel('รหัสสินค้าของอู่ *').filter({ visible: true }), '1'], [margin.nth(0), '2'], [page.getByLabel('ปริมาณคงคลัง').filter({ visible: true }), '3']], scroll: false });
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  await page.keyboard.press('Escape').catch(() => {});

  // Internal use
  await page.reload();
  await app.settle();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เบิกใช้ภายใน' }).click();
  await app.settle();
  const newIssue = page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' });
  await shot(page, '06-issue-list', { mark: [newIssue] });
  await newIssue.click();
  await page.getByLabel('ผู้เบิก *').filter({ visible: true }).selectOption({ index: 1 });
  await page.getByLabel('แผนก / งานที่นำไปใช้').filter({ visible: true }).fill('แผนกซ่อมบำรุง');
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025 · น้ำมันเบรก DOT4/ }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').fill('2');
  await line.getByPlaceholder('เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ').fill('เปลี่ยนน้ำมันเบรกรถส่งของของร้าน');
  await page.waitForTimeout(300);
  await shot(page, '06-issue-form', { mark: [[page.getByLabel('ผู้เบิก *').filter({ visible: true }), '1'], [line, '2']] });
  const approve = page.getByRole('button', { name: 'อนุมัติเอกสาร' });
  await shot(page, '06-issue-approve', { mark: [approve] });
  await approve.click();
  await page.getByRole('button', { name: 'ตกลง' }).click();
  await app.settle();
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).first().click().catch(() => {});

  // Stock count
  await page.getByRole('button', { name: 'ตรวจนับสินค้า' }).click();
  await app.settle();
  const newCount = page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' });
  await shot(page, '06-count-list', { mark: [newCount] });
  await newCount.click();
  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ index: 1 });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ visible: true }).getByRole('spinbutton').fill('17');
  await page.waitForTimeout(300);
  await shot(page, '06-count-form', { mark: [[page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }), '1'], [page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ visible: true }).getByRole('spinbutton'), '2']] });
});
