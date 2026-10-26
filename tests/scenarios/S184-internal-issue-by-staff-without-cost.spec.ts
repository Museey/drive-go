import { test, expect } from '../support/test';
import { managerWithoutCost, sameCostsAsLegacy } from '../support/cost-blind';

// New behaviour (task 3.9, R14-ข): someone without "แสดงต้นทุน" (EMP004 here, without the cost switch and the jobs
// that see purchase prices) gets no cost from the server, yet issues goods for the garage's own use as S33's owner did: the server works out
// the cost of what the issue took from its lot (180) exactly as the legacy app did with every cost.
const S33 = 'S33-internal-issue.spec.ts';

test('S184 ระบบใหม่: พนักงานที่ไม่เห็นทุนเบิกอะไหล่ใช้ภายในและอนุมัติ server คิดต้นทุนที่เบิกออกให้ตรงกับระบบเดิม', async ({ app, page }) => {
  test.slow();
  await managerWithoutCost(app, page);
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เบิกใช้ภายใน' }).click();
  await page.getByRole('button', { name: '+ สร้างใบเบิกใหม่' }).click();
  await page.getByLabel('ผู้เบิก *').filter({ visible: true }).selectOption({ label: 'EMP003 · วิชัย ขยันงาน (ช่างซ่อมทั่วไป)' });
  await page.getByLabel('แผนก / งานที่นำไปใช้').filter({ visible: true }).fill('แผนกซ่อมบำรุง');
  await page.getByLabel('ค้นหาสินค้าเร็ว').filter({ visible: true }).fill('BR-025');
  await page.getByRole('option', { name: /BR-025 · น้ำมันเบรก DOT4/ }).click();
  const line = page.getByRole('row').filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line.getByRole('spinbutton').fill('2');
  await line.getByPlaceholder('เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ').fill('เปลี่ยนน้ำมันเบรกรถกระบะของอู่');
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('เบิกเพื่อซ่อมรถของกิจการเอง');
  // The issue box tells the owner it books the goods at their FIFO cost; this person sees no cost.
  await expect(page.getByText('ลงบัญชีตามทุน FIFO', { exact: false }).filter({ visible: true })).toHaveCount(0);

  const before = await app.serverDB();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await expect(page.getByRole('button', { name: 'ตกลง' })).toBeVisible();
  await sameCostsAsLegacy(app, page, S33, 'approve-issue', before);
});
