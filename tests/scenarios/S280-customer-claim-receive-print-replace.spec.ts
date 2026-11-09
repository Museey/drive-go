import { test, expect } from '../support/test';

// 07 · เคลมสินค้าลูกค้า (customer brings back a part bought from the shop): no scenario used this window
// (docs/BEHAVIORS.md, its click handler at line 25180). Lines pulled from the sold bill, a line removed with ×,
// saved with the side toolbar, printed, then "เปลี่ยนสินค้าให้ลูกค้า (ตัดสต๊อก)".
test('S280 รับเคลมสินค้าจากลูกค้าอ้างอิงบิลขาย บันทึก พิมพ์ใบรับเคลม แล้วเปลี่ยนสินค้าให้ลูกค้า (ตัดสต๊อก)', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'เคลมสินค้าลูกค้า' }).click();
  await golden.step('ทะเบียนเคลมสินค้าลูกค้า');
  await page.getByRole('button', { name: '+ รับเคลมสินค้าจากลูกค้า' }).click();
  await golden.step('ใบรับเคลมสินค้าใหม่');

  await page.getByLabel('อ้างอิงใบเสร็จ / ใบแจ้งหนี้ที่ขาย').filter({ visible: true })
    .selectOption({ label: 'MA-SA261000003 · 10/10/2569 · ปรีชา ทองสุข' });
  await expect(page.getByRole('button', { name: /^\+ AC-215/ })).toBeVisible();
  await golden.step('อ้างอิงบิลขาย MA-SA261000003 แสดงรายการที่ขายให้ดึง');
  await page.getByRole('button', { name: /^\+ AC-204/ }).click();
  await page.getByRole('button', { name: /^\+ AC-215/ }).click();
  await golden.step('ดึงคอมเพรสเซอร์แอร์ AC-204 และกรองแอร์ AC-215 เข้าใบเคลม');
  const line = (code: string) => page.getByRole('row').filter({ hasText: code }).filter({ has: page.getByRole('button', { name: '×' }) }).filter({ visible: true });
  await line('AC-204').getByRole('button', { name: '×' }).click();
  await expect(line('AC-204')).toHaveCount(0);
  await golden.step('กด × เอาคอมเพรสเซอร์ออก');
  await line('AC-215').getByPlaceholder('เช่น มีเสียง / รั่ว / ไม่ทำงาน').fill('กรองขาด ฝุ่นเข้าช่องแอร์');
  await golden.screen('claim-filled');

  let before = await app.state();
  await page.getByRole('toolbar', { name: 'เครื่องมือ' }).filter({ visible: true }).getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('button', { name: 'พิมพ์ใบรับเคลม' })).toBeVisible();
  await golden.step('บันทึกใบรับเคลม MA-CC261000001');
  await golden.stateChange('save-claim', before);

  before = await app.state();
  await page.getByRole('button', { name: 'พิมพ์ใบรับเคลม' }).click();
  await golden.step('กดพิมพ์ใบรับเคลม');
  await golden.stateChange('print-claim', before);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await golden.screen('claim-printed');
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('button', { name: 'เปลี่ยนสินค้าให้ลูกค้า (ตัดสต๊อก)' }).click();
  await golden.step('กดเปลี่ยนสินค้าให้ลูกค้า ระบบถามยืนยัน');
  before = await app.state();
  const card = page.getByRole('heading', { name: /เปลี่ยนสินค้า/ }).filter({ visible: true }).last().locator('xpath=ancestor::div[.//button][1]');
  await card.getByRole('button').last().click();
  await app.settle();
  await golden.step('เปลี่ยนสินค้าให้ลูกค้าแล้ว ตัดสต๊อกกรองแอร์ 1 ชิ้น');
  await golden.stateChange('replace-for-customer', before);
});
