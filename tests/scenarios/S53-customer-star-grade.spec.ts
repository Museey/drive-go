import { test, expect } from '../support/test';

test('S53 เปลี่ยนเกรดดาวลูกค้านภาพร บุญรอด จาก 2 ดาวเป็น 4 ดาว แล้วดูรายชื่อลูกค้าประจำจากหน้าสรุปเกรดดาว', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: '02 ข้อมูลลูกค้า' }).click();
  const row = page.getByRole('row').filter({ hasText: 'นภาพร บุญรอด' }).filter({ visible: true });
  await expect(row).toContainText('ลูกค้าขาจร');
  await row.scrollIntoViewIfNeeded();
  await golden.step('รายชื่อลูกค้า นภาพร บุญรอด เป็นลูกค้าขาจร 2 ดาว');

  await row.getByTitle('4 ดาว · ลูกค้าประจำ').click();
  await expect(page.getByRole('button', { name: 'เปลี่ยนเกรด' })).toBeVisible();
  await golden.step('กดดาวดวงที่ 4 ระบบถามยืนยันก่อนเปลี่ยนเกรด');
  await golden.screen('confirm-grade');

  const before = await app.state();
  await page.getByRole('button', { name: 'เปลี่ยนเกรด' }).click();
  await expect(row).toContainText('ลูกค้าประจำ');
  await golden.step('หลังยืนยันเปลี่ยนเกรด');
  await golden.stateChange('grade-2-to-4', before);

  await page.getByRole('button', { name: '★ สรุปชื่อลูกค้าตามเกรดดาว' }).click();
  const regular = page.getByRole('row').filter({ hasText: 'ลูกค้าประจำ' }).filter({ has: page.getByRole('button', { name: 'ดูรายชื่อ' }) });
  await expect(regular).toContainText('11');
  await golden.step('หน้าสรุปเกรดดาว ลูกค้าประจำ 11 ราย ลูกค้าขาจร 2 ราย');
  await golden.screen('grade-summary');

  await regular.getByRole('button', { name: 'ดูรายชื่อ' }).click();
  // Legacy behaviour reported to the owner: the button filters the old customer table at the very bottom of
  // this page and jumps to the top, so nothing visible changes where the user clicked.
  // Rows of that old table carry the price tier ("ระดับราคา B"); the grade lists on top do not.
  const oldRows = page.getByRole('row').filter({ hasText: 'ระดับราคา' }).filter({ visible: true });
  await expect(oldRows).toHaveCount(11);
  await golden.step('กดดูรายชื่อของลูกค้าประจำ');
  await golden.screen('after-view-names');

  await oldRows.first().scrollIntoViewIfNeeded();
  await expect(oldRows.filter({ hasText: 'นภาพร บุญรอด' })).toBeVisible();
  await golden.step('เลื่อนลงล่างสุด ตารางข้อมูลลูกค้าถูกกรองเหลือลูกค้าประจำ 11 ราย');
  await golden.screen('filtered-table-at-bottom');

  await page.getByRole('button', { name: /^ลูกค้าทั้งหมด/ }).click();
  await expect(oldRows).toHaveCount(30);
  await golden.step('กด "ลูกค้าทั้งหมด" ล้างตัวกรองเกรด');
});
