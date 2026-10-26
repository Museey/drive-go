import { test, expect } from '../support/test';
import { LINK, fetchFile } from '../support/files';

test.use({ dataset: 'franchise-trial' });

// New behaviour (task 3.11, owner's answer 11.3, rule 8): a franchise branch's files are its own, like its
// data: a picture B001 attaches opens for B001 and for HQ, not for another branch's account (the server
// answers as if there were no such file). Each branch has its own 2 GB (tests/db/files.test.mjs).
test('S198 ระบบใหม่: รูปสินค้าที่สาขา B001 แนบ เปิดได้จากบัญชี B001 และ HQ แต่บัญชีสาขา B002 เปิดไม่ได้', async ({ app, page }) => {
  await app.open();
  await app.login('b001', '1234');
  await page.getByText('สต๊อกอะไหล่', { exact: true }).filter({ visible: true }).first().click();
  const thumb = page.getByRole('button', { name: 'ไม่มีรูป' }).filter({ visible: true }).first();
  await thumb.click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByText('อัปโหลดรูปใหม่ / เปลี่ยนรูป').click();
  await (await chooser).setFiles('tests/assets/S52-fuel-system-cleaner.png');
  await expect(page.getByRole('button', { name: 'ลบรูป' })).toBeVisible();
  await app.settle();
  const link = (await app.state() as any).DB.stock.map((s: any) => s.img).find(Boolean);
  expect(link).toMatch(LINK);
  expect((await fetchFile(page, link)).status).toBe(200);
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).last().click();

  await app.logout();
  await app.login('b002', '1234');
  expect((await fetchFile(page, link)).status).toBe(404);

  await app.logout();
  await app.login('hq', '1234');
  expect((await fetchFile(page, link)).status).toBe(200);
});
