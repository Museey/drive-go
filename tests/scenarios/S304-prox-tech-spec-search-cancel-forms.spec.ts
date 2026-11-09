import { test, expect } from '../support/test';

test.use({ dataset: 'prox-trial' });

// ProX parts no other scenario used (docs/BEHAVIORS.md): typing in the search box of "สเปคเทคนิค" (P2 ห้องข้อมูลเทคนิค,
// tab ProX Data), and "ยกเลิก" on the add-article form and on the new-item request form of คลังกลาง ProX.
test('S304 ProX: ค้นหาสเปคเทคนิครุ่นรถ และกดยกเลิกฟอร์มเพิ่มบทความกับฟอร์มแจ้งขอสินค้าใหม่โดยไม่บันทึก', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await page.getByRole('button', { name: /ห้องข้อมูลเทคนิค/ }).click();
  const count = page.getByText(/^\d+ รุ่น$/).filter({ visible: true });
  await expect(count).toBeVisible();
  await golden.step('P2 ห้องข้อมูลเทคนิค แท็บสเปคเทคนิค');
  const all = await count.textContent();

  const search = page.getByPlaceholder('ค้นหารุ่นรถ เช่น corolla, atto, d-max...');
  await search.pressSequentially('atto');
  await expect(count).not.toHaveText(all!);
  await golden.step('พิมพ์ค้นหา atto');
  const table = page.getByRole('table').filter({ has: page.getByRole('cell', { name: 'น้ำยาแอร์' }) }).filter({ visible: true });
  expect((await table.innerText()).replace(/[ \t]+/g, ' ')).toMatchSnapshot('search-atto.txt');
  await golden.screen('tech-spec-atto');
  await search.fill('r-1234yf');
  await golden.step('ค้นหาด้วยชนิดน้ำยาแอร์ r-1234yf');
  expect(`${await count.textContent()}\n${(await table.innerText()).replace(/[ \t]+/g, ' ')}`).toMatchSnapshot('search-r1234yf.txt');
  await search.fill('');
  await search.press('Backspace');
  await expect(count).toHaveText(all!);
  await golden.step('ล้างช่องค้นหา แสดงทุกรุ่น');

  // Add-article form, then cancel: nothing saved.
  const before = await app.state();
  await page.getByRole('button', { name: '🌐 Publish Data · แบ่งปันเครือข่าย' }).click();
  await page.getByRole('button', { name: '+ เพิ่มบทความ / อัปโหลดคลิป' }).click();
  await page.getByLabel('ชื่อเรื่อง *').fill('บทความที่ยังไม่บันทึก');
  await golden.step('เปิดฟอร์มเพิ่มบทความ พิมพ์ชื่อเรื่อง');
  await page.getByRole('button', { name: 'ยกเลิก', exact: true }).filter({ visible: true }).click();
  await expect(page.getByLabel('ชื่อเรื่อง *')).toBeHidden();
  await golden.step('กดยกเลิก ฟอร์มปิดโดยไม่บันทึก');

  // New-item request form of คลังกลาง ProX, then cancel: nothing sent.
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: '★ คลังกลาง ProX' }).click();
  await page.getByRole('button', { name: '+ แจ้งเพิ่มรายการสินค้าใหม่' }).click();
  await page.getByLabel('ชื่อสินค้า *', { exact: true }).filter({ visible: true }).fill('สินค้าที่ยังไม่ส่งคำขอ');
  await golden.step('เปิดฟอร์มแจ้งเพิ่มรายการสินค้าใหม่ พิมพ์ชื่อสินค้า');
  await page.getByRole('button', { name: 'ยกเลิก', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('button', { name: '📨 ส่งคำขอถึง HeadAdmin DriveGo' })).toBeHidden();
  await golden.step('กดยกเลิก ฟอร์มปิดโดยไม่ส่งคำขอ');
  await golden.stateChange('nothing-saved', before);
});
