import { test, expect, type Page } from '../support/test';
import { secondDevice } from '../support/live';

// New behaviour (task 3.10, answer 10.3): the window of a new employee is open here when another device deletes that
// employee (as in S140). The bar says who deleted it and when; pressing it closes the window, and the list behind no
// longer has the employee.
const row = (p: Page, code: string) => p.getByRole('row').filter({ hasText: code }).filter({ visible: true });

test('S243 ระบบใหม่: เปิดข้อมูลพนักงานค้างไว้ อีกเครื่องลบพนักงานคนนั้น ขึ้นแถบว่าถูกลบโดยใครเมื่อไร กดแถบแล้วหน้าต่างปิด', async ({ app, page, browser }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('button', { name: '+ เพิ่มพนักงาน' }).click();
  const field = (label: string) => page.getByLabel(label).filter({ visible: true });
  await field('ชื่อ - นามสกุล *').fill('สมหญิง ทดลองงาน');
  await field('อัตราเงินเดือน (บาท)').fill('12000');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await expect(row(page, 'EMP012')).toContainText('สมหญิง ทดลองงาน');
  await app.settle();
  await row(page, 'EMP012').getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  await expect(field('ชื่อ - นามสกุล *')).toHaveValue('สมหญิง ทดลองงาน');

  const other = await secondDevice(browser, page);
  await other.app.loginAsOwner();
  await other.page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await row(other.page, 'EMP012').getByRole('button', { name: 'ลบ' }).click();
  await other.page.locator('div').filter({ hasText: 'ลบพนักงาน EMP012 สมหญิง ทดลองงาน ?' })
    .filter({ has: other.page.getByRole('button', { name: 'ไม่ลบ' }) }).last()
    .getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(row(other.page, 'EMP012')).toHaveCount(0);
  await other.app.settle();

  const bar = page.locator('#mEmp').getByRole('button', { name: /^เอกสารนี้ถูกลบโดย/ });
  await expect(bar).toHaveText('เอกสารนี้ถูกลบโดย เจ้าของกิจการ / ผู้ดูแลระบบ เมื่อ 13/10/2569 09:00 — กดเพื่อปิด');
  await bar.click();
  await expect(page.locator('#mEmp')).toBeHidden();
  await expect(row(page, 'EMP012')).toHaveCount(0);
  expect(((await app.state()) as any).DB.emp.some((e: any) => e.code === 'EMP012')).toBe(false);
  await other.context.close();
});
