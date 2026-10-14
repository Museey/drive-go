import { test } from '../support/test';

test('S33 เบิกอะไหล่ใช้ภายในอู่และอนุมัติตัดสต๊อก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เบิกใช้ภายใน' }).click();
  await golden.step('ทะเบียนใบเบิกของ');

  await page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' }).click();
  await golden.step('ใบเบิกของใหม่');

  await page.getByLabel('ผู้เบิก *').filter({ visible: true }).selectOption({ label: 'EMP003 · วิชัย ขยันงาน (ช่างซ่อมทั่วไป)' });
  await page.getByLabel('แผนก / งานที่นำไปใช้').filter({ visible: true }).fill('แผนกซ่อมบำรุง');
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025 · น้ำมันเบรก DOT4/ }).click();
  await golden.step('เลือกน้ำมันเบรก DOT4 เข้าใบเบิก');

  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').fill('2');
  await line.getByPlaceholder('เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ').fill('เปลี่ยนน้ำมันเบรกรถกระบะของอู่');
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('เบิกเพื่อซ่อมรถของกิจการเอง');
  await golden.step('กรอกจำนวน 2 ชิ้นและเหตุผล');
  await golden.screen('issue-filled');

  const before = await app.state();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await golden.step('หลังกดอนุมัติเอกสาร');
  await golden.stateChange('approve-issue', before);
  await golden.screen('issue-approved');

  await page.getByRole('button', { name: 'ตกลง' }).click();
  await golden.step('ปิดหน้าต่างแจ้งอนุมัติ');
});
