import { test, expect } from '../support/test';

test('S70 สร้างนัดตรวจเช็กตามระยะรับประกันจากใบเสร็จ 2 ใบที่เลือก แล้วใบที่มีนัดแล้วหายจากรายการให้เลือก', async ({ app, page, golden }) => {
  test.slow(); // many steps; each one waits for the saved data to settle
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /01 ลูกค้าสัมพันธ์/ }).click();
  await page.getByRole('button', { name: 'สร้างนัดจากใบเสร็จอัตโนมัติ' }).click();
  await expect(page.getByText('ยังไม่มีนัด 11 ใบ')).toBeVisible();
  await golden.step('ป๊อปอัพสร้างนัดหมายจากใบเสร็จ (30 วันล่าสุด)');

  // A receipt row of the pop-up: the one with a tick box (the register behind it lists appointments).
  const receipt = (no: string) => page.getByRole('row').filter({ hasText: no }).filter({ has: page.getByRole('checkbox') }).filter({ visible: true });
  await receipt('MA-SA261000004').getByRole('checkbox').check();
  await receipt('MA-SA261000003').getByRole('checkbox').check();
  await expect(page.getByText('เลือกแล้ว 2 จาก 11 รายการ')).toBeVisible();
  await golden.step('ติ๊กเลือกใบเสร็จ MA-SA261000004 และ MA-SA261000003');
  await golden.screen('two-receipts-picked');

  await page.getByRole('button', { name: 'สร้างนัดหมาย 2 รายการ' }).click();
  await golden.step('ระบบถามยืนยันก่อนสร้าง');
  const before = await app.state();
  await page.getByRole('button', { name: 'สร้างนัดหมาย', exact: true }).click();
  await expect(page.getByText('ยังไม่มีนัด 11 ใบ')).toBeHidden();
  await golden.step('สร้างนัดหมาย 2 รายการแล้ว');
  await golden.stateChange('create-appointments', before);

  // The register shows only appointments due within 7 days at first; these are 3 months away.
  await page.getByLabel('แสดงนัดหมาย').selectOption({ label: 'ทั้งหมด' });
  await expect(page.getByRole('row').filter({ hasText: 'อ้างอิงใบเสร็จ MA-SA26100000' })).toHaveCount(2);
  await golden.step('เลือกแสดงนัดหมายทั้งหมด เห็น 2 นัด');
  await page.getByRole('row').filter({ hasText: 'อ้างอิงใบเสร็จ MA-SA261000004' }).scrollIntoViewIfNeeded();
  await golden.screen('appointment-register');

  await page.getByRole('button', { name: 'สร้างนัดจากใบเสร็จอัตโนมัติ' }).click();
  await expect(page.getByText('ยังไม่มีนัด 9 ใบ')).toBeVisible();
  await expect(receipt('MA-SA261000004')).toHaveCount(0);
  await golden.step('เปิดป๊อปอัพอีกครั้ง ใบเสร็จที่มีนัดแล้วไม่อยู่ในรายการ');
});
