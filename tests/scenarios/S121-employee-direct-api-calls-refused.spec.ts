import { test, expect } from '../support/test';
import { storageApi } from '../support/storage-api';

// New behaviour (task T10, design §5.1): the server checks who may change
// what, so an employee cannot get round the screens by calling the API
// directly. The screens never make these saves (every scenario runs with the
// checks on); here they are made by hand with the employee's own session and
// must be refused, and nothing may change. The shop's page also keeps the
// shop's own package whatever the link says, and a refused save made by the
// screens shows the approved message and reloads (owner, 2026-10-19).
test('S121 ระบบใหม่: พนักงานเรียก API ตรงเพื่อแก้บัญชีร้าน สิทธิ์ของตัวเอง รหัสผ่าน หรือลบข้อมูลร้าน ถูกปฏิเสธทั้งหมด', async ({ app, page }) => {
  // The owner issues the cashier (EMP008) an account, as in S41.
  await app.loginAsOwner();
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const cashier = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashier.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('8888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashier.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await app.settle();
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('0923334455', '8888');

  const api = storageApi(page);
  const shopBefore = (await api.read('dgb.v22')).data.shop;
  const data = (await api.read('garage.v22')).data;
  const self = data.emp.find((e: any) => e.code === 'EMP008');
  const other = data.emp.find((e: any) => e.code === 'EMP001');

  // The shop's account (owner's e-mail, password).
  expect(await api.save('dgb.v22', 'DGB.shop', '', { ...shopBefore, email: 'cashier@example.com' }))
    .toEqual({ status: 403, body: { error: 'not allowed', what: 'DGB.shop' } });
  expect(await api.save('dgb.v22', 'DGB.shop', '', shopBefore, [{ unit: 'DGB.shop', key: '', field: 'pass', value: '0000' }]))
    .toEqual({ status: 403, body: { error: 'not allowed', what: 'DGB.shop' } });
  // Every menu for oneself.
  const allTabs = { ...self.perms, tabs: Object.fromEntries(Object.keys(self.perms.tabs).map(k => [k, true])) };
  expect(await api.save('garage.v22', 'DB.emp', self.id, { ...self, perms: allTabs }))
    .toEqual({ status: 403, body: { error: 'not allowed', what: `DB.emp|${self.id}` } });
  // Another employee's password.
  expect(await api.save('garage.v22', 'DB.emp', other.id, other, [{ unit: 'DB.emp', key: other.id, field: 'dgbPass', value: '0000' }]))
    .toEqual({ status: 403, body: { error: 'not allowed', what: `DB.emp|${other.id}.dgbPass` } });
  // Wiping the shop's data.
  expect(await api.remove('garage.v22')).toEqual({ status: 403, body: { error: 'not allowed', what: 'garage.v22' } });

  // Nothing changed.
  expect((await api.read('dgb.v22')).data.shop).toEqual(shopBefore);
  expect((await api.read('garage.v22')).data.emp.find((e: any) => e.id === self.id).perms).toEqual(self.perms);

  // The link cannot open the shop as another package.
  const shopUrl = new URL(page.url());
  shopUrl.searchParams.set('package', 'prox');
  const r = await page.request.get(shopUrl.href, { maxRedirects: 0 });
  expect(r.status()).toBe(302);
  expect(new URL(r.headers().location, shopUrl).searchParams.get('package')).toBe('biz');

  // A refused save made through the screens' own storage (as when a rule is
  // stricter than a screen): the user is told, and the page loads the latest data.
  await page.evaluate(async () => {
    const storage = (window as any).storage;
    const dgb = JSON.parse((await storage.get('dgb.v22')).value);
    dgb.shop.email = 'cashier@example.com';
    storage.set('dgb.v22', JSON.stringify(dgb));   // never settles: the page reloads
  });
  await expect(page.getByText('บันทึกไม่สำเร็จ — บัญชีนี้ไม่มีสิทธิ์แก้ข้อมูลส่วนนี้ กดตกลงเพื่อโหลดข้อมูลล่าสุด')).toBeVisible();
  await page.getByRole('button', { name: 'ตกลง', exact: true }).filter({ visible: true }).click();
  await page.waitForEvent('load');
  await app.settle();
  expect(((await app.state()) as any).DGB.shop.email).toBe(shopBefore.email);
});
