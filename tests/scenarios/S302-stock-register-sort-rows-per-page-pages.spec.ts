import { test, expect } from '../support/test';

// 07 ทะเบียนอะไหล่ (10 rows a page): the page buttons (number, ›, ‹), the "แสดง" rows-per-page box, and sorting by
// a column header (A→Z, Z→A, back to the suggested order). The registers share these helpers (limitRows / limGo,
// bindSort); no other scenario pressed them (docs/BEHAVIORS.md).
test('S302 ทะเบียนอะไหล่: เปลี่ยนหน้า เปลี่ยนจำนวนแถวต่อหน้า และกดหัวคอลัมน์เรียงลำดับ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  const info = page.getByText(/^พบ \d+ รายการ · /).filter({ visible: true }).first();
  await expect(info).toHaveText(/หน้า 1\/\d+$/);
  await golden.step('ทะเบียนอะไหล่ หน้า 1');

  const table = page.getByRole('table').filter({ has: page.getByRole('cell', { name: /ชื่อสินค้า/ }) }).filter({ visible: true }).first();
  const firstCodes = async () => (await table.getByRole('row').allInnerTexts()).slice(1, 4).map(t => (t.match(/\b[A-Z]{2,3}-\d{3}\b/) || [t])[0]);
  const pager = page.locator('.pgbar').filter({ visible: true }).first();
  const firstPage = await firstCodes();

  await pager.getByRole('button', { name: '2', exact: true }).click();
  await expect(info).toHaveText(/· แสดง 11–20 · หน้า 2\//);
  expect(await firstCodes()).not.toEqual(firstPage);
  await golden.step('กดหน้า 2');
  await pager.getByRole('button', { name: '›' }).click();
  await expect(info).toHaveText(/· แสดง 21–30 · หน้า 3\//);
  await golden.step('กด › ไปหน้า 3');
  await golden.screen('stock-page-3');
  await pager.getByRole('button', { name: '‹' }).click();
  await expect(info).toHaveText(/· แสดง 11–20 · หน้า 2\//);
  await golden.step('กด ‹ กลับหน้า 2');

  // Changing rows per page goes back to page 1.
  await page.getByRole('combobox').filter({ has: page.getByRole('option', { name: '10 รายการ' }) }).filter({ visible: true }).first()
    .selectOption({ label: '20 รายการ' });
  await expect(info).toHaveText(/· แสดง 1–20 · หน้า 1\//);
  expect(await firstCodes()).toEqual(firstPage);
  await golden.step('เปลี่ยนเป็นแสดง 20 รายการ กลับไปหน้า 1');

  const header = table.getByRole('row').first().getByRole('cell', { name: /ชื่อสินค้า/ });
  await header.click();
  await golden.step('กดหัวคอลัมน์ชื่อสินค้า เรียงน้อยไปมาก');
  expect((await firstCodes()).join('\n')).toMatchSnapshot('sorted-name-ascending.txt');
  await header.click();
  await golden.step('กดอีกครั้ง เรียงมากไปน้อย');
  expect((await firstCodes()).join('\n')).toMatchSnapshot('sorted-name-descending.txt');
  await golden.screen('stock-sorted-descending');
  await header.click();
  expect(await firstCodes()).toEqual(firstPage);
  await golden.step('กดครั้งที่สาม กลับไปเรียงแบบแนะนำ');
});
