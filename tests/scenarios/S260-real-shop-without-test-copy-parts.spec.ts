import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { legacyApp } from '../support/legacy-app.mjs';
import { openRealTestShop } from '../support/new-shop.mjs';
import { storageApi } from '../support/storage-api';

// New behaviour (the owner's decision of 2026-10-30, NOTES.md "เอาส่วนของสำเนาทดสอบออกจากหน้าจอ"): the real system
// has none of the test copy's parts — the bar "สำเนาทดสอบแพ็กเกจ · ฐานข้อมูลแยกจากไฟล์ต้นฉบับ" with "เปลี่ยนแพ็กเกจ" and
// "ทดสอบบัญชีอื่น", the sign-in page's "สำเนาทดสอบ" line, steps, "กลับไปเลือกโปรแกรม" and footer
// "สำเนาโปรแกรมจริง · ทดสอบแพ็กเกจ", the tab's "สำเนาทดสอบแพ็กเกจ" before the app
// names it (every screenshot checks this too: the goldens were recorded with them hidden in the legacy file). And only a trial
// shop may load sample data over its data: a pilot shop's buttons are hidden and the server refuses it.
test('S260 ระบบใหม่: ร้านจริงไม่มีแถบสำเนาทดสอบ หน้าเข้าระบบไม่มีส่วนของสำเนาทดสอบ ปุ่มโหลดข้อมูลตัวอย่างมีเฉพาะร้านทดลอง', async ({ app, page }) => {
  test.slow();
  const notShown = async (texts: (string | RegExp)[]) => {
    for (const t of texts) await expect(page.getByText(t).filter({ visible: true })).toHaveCount(0);
  };
  const sampleButtons = () => [page.getByRole('button', { name: 'โหลดข้อมูลตัวอย่าง', exact: true }),
    page.getByRole('button', { name: 'โหลดข้อมูลทดสอบ 36 เดือน', exact: true })];

  // A trial shop (the test's own, from the fixture): the buttons are there; the server takes sample data.
  await app.open();
  expect(await page.title()).not.toContain('สำเนาทดสอบ');
  await notShown(['สำเนาทดสอบ · ใช้ฟังก์ชันจริงของโปรแกรม', 'กลับไปเลือกโปรแกรม', 'เลือกโปรแกรม', 'สำเนาโปรแกรมจริง · ทดสอบแพ็กเกจ']);
  await app.login('dg1688', '123456');
  await notShown(['สำเนาทดสอบแพ็กเกจ · ฐานข้อมูลแยกจากไฟล์ต้นฉบับ']);
  for (const name of ['เปลี่ยนแพ็กเกจ', 'ทดสอบบัญชีอื่น']) await expect(page.getByRole('button', { name, exact: true }).filter({ visible: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^10 ตั้งค่าองค์กร/ }).click();
  for (const b of sampleButtons()) await expect(b).toBeVisible();
  expect((await storageApi(page).saveWhole('garage.v22', 'sample')).status).toBe(200);
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();

  // A pilot garage: the buttons are hidden in place, and a save of sample data is refused.
  const shop = await openRealTestShop({ pkg: 'biz', kind: 'pilot', name: 'อู่นำร่อง', owner: 'นำร่อง ทดสอบ' });
  const real = legacyApp(page, { dataset: 'biz-trial', url: `${LEGACY_ORIGIN}/${shop.code}/`, restore: async () => {} });
  await real.open();
  await real.login(shop.user, shop.password);
  await notShown(['สำเนาทดสอบแพ็กเกจ · ฐานข้อมูลแยกจากไฟล์ต้นฉบับ']);
  await page.getByRole('button', { name: /^10 ตั้งค่าองค์กร/ }).click();
  for (const b of sampleButtons()) await expect(b).toBeHidden();
  const refused = await storageApi(page).saveWhole('garage.v22', 'sample');
  expect([refused.status, refused.body]).toEqual([403, { error: 'not allowed', what: 'sample data' }]);
  expect((await storageApi(page).saveWhole('garage.v22', 'demo36')).status).toBe(403);
});
