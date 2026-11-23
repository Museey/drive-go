import { test, expect } from '../support/test';
import { storageApi } from '../support/storage-api';

// Security review 2026-11-23 (docs/SECURITY-AUDIT-2026-11.md ก4; the owner: "ทำข้อที่คุณทำเองได้ก่อนเลยครับ"): what an
// employee with no rights could do with one request made round the screens is refused on the server. The cashier
// EMP008 (an account as in S176) tries: a layout that leaves the data unreadable for everyone, a whole value in place
// of the shop's data, wiping the shop, a backup point under a name of their own, a backup point of a far day, and
// session text that would have been written raw into the data and its backup points. Each is refused (or, for the
// day's backup point, skipped), the cashier's own work goes on, and the owner finds the data as it was.
test('S477 ระบบใหม่: พนักงานที่ไม่มีสิทธิ์ส่งคำขอตรงไปที่ server เพื่อทำให้ข้อมูลร้านเปิดไม่ได้ แทนข้อมูลทั้งร้าน ล้างข้อมูล หรือฝังข้อมูลลงจุดสำรอง ไม่ได้', async ({ app, page }) => {
  test.slow();
  await app.loginAsOwner();
  const before = (await app.serverDB()) as Record<string, unknown[]>;
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const cashierRow = page.getByRole('row').filter({ hasText: 'EMP008' });
  await cashierRow.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('88888888');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(cashierRow.getByRole('button', { name: 'ตั้งรหัสใหม่' })).toBeVisible();
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('092-333-4455', '88888888');
  await app.settle();

  const api = storageApi(page);
  const none = { upsert: [], remove: [], order: {} };
  const refused = (what: string | RegExp) => ({ status: 403, body: { error: 'not allowed', what: expect.stringMatching(what) } });
  // The data's shape.
  expect(await api.post('garage.v22', { base: {}, changes: { ...none, layout: '[["emp","D"]]' } })).toEqual(refused(/^DB\.\w+: removed$/));
  expect(await api.post('garage.v22', { base: {}, changes: { ...none, layout: '"D"', upsert: [{ unit: 'DB.', key: '', data: '{"shop":{"name":"ร้านปลอม"}}' }] } }))
    .toEqual(refused('DB.|: not a field of DB'));
  expect(await api.post('garage.v22', { base: {}, changes: { ...none, layout: '"D"' } })).toEqual(refused('DB: not a layout'));
  // Wiping, sample data.
  expect(await api.post('garage.v22', { base: {}, changes: none, whole: 'wipe' })).toEqual(refused('whole wipe'));
  expect(await api.post('garage.v22', { base: {}, changes: none, whole: 'restore' })).toEqual(refused('whole restore'));
  // Backup points: a name of their own is refused; a far day's point is not made (answered as made).
  expect(await api.put('garage.v22.bak.9999', '')).toEqual({ status: 400, body: { error: 'not a known key', what: 'garage.v22.bak.9999' } });
  expect(await api.put('garage.v22.bak.2030-01-01', '')).toEqual({ status: 200, body: { ok: true } });
  // Session text that is not one of the root's session values.
  const planted = { base: {}, changes: none, session: { 'DB.curBranch': '"main","emp":[]' } };
  expect(await api.post('garage.v22', planted)).toEqual({ status: 400, body: { error: 'bad request', what: 'session: DB.curBranch' } });
  expect(await api.post('garage.v22', { base: {}, changes: none, session: { 'DB.perms': '1' } })).toEqual({ status: 400, body: { error: 'bad request', what: 'session: DB.perms' } });

  // The cashier's own screens still save (the program's save went through: no "โหลดข้อมูลใหม่").
  await expect(page.getByRole('heading', { name: 'โหลดข้อมูลใหม่' })).toHaveCount(0);

  // The owner: the data reads, as it was.
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.loginAsOwner();
  const after = (await app.serverDB()) as Record<string, unknown[]>;
  for (const k of ['cust', 'stock', 'receipts', 'stockCuts', 'emp', 'quotes', 'audit'] as const)
    expect(after[k].length, k).toBeGreaterThanOrEqual(before[k].length);
  expect((after as unknown as { shop: { name: string } }).shop.name).not.toBe('ร้านปลอม');
});
