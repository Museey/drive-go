import { test, expect } from '../support/test';
import { storageApi } from '../support/storage-api';

// New behaviour (task 3.15, decision 15.3): the shop's licence ended on 01/10/2569. Called straight, without the
// screens, with the owner's own session, the API still gives the data, takes the audit log's entry of opening a
// document and a backup point, and refuses with { error: 'expired' } any other change: a new or changed customer,
// a sale, removing a record, the shop's settings, a new password for an employee, another STORE key, wiping the
// whole data set. Nothing changes.
test.use({ licence: { kind: 'paid', start: '2025-10-01', end: '2026-10-01' } });

test('S237 ระบบใหม่: ร้านหมดอายุ เรียก API ตรงด้วย session ของเจ้าของ อ่านได้ แต่สร้าง แก้ ลบ ล้างข้อมูลถูกปฏิเสธทั้งหมด', async ({ app, page }) => {
  await app.loginAsOwner();
  await app.settle();
  const api = storageApi(page);
  const before = await api.read('garage.v22');
  expect(before.status).toBe(200);
  const data = before.data, cust = data.cust[0], cut = data.stockCuts[0], emp = data.emp[0];
  const refused = (what: string) => ({ status: 403, body: { error: 'expired', what } });

  expect(await api.save('garage.v22', 'DB.cust', 'new-cust', { id: 'new-cust', name: 'ลูกค้าใหม่' })).toEqual(refused('DB.cust|new-cust'));
  expect(await api.save('garage.v22', 'DB.cust', cust.id, { ...cust, name: 'ชื่อใหม่' })).toEqual(refused(`DB.cust|${cust.id}`));
  expect(await api.save('garage.v22', 'DB.stockCuts', 'new-cut', { ...cut, id: 'new-cut', no: 'MA-SA261000099' })).toEqual(refused('DB.stockCuts|new-cut'));
  expect(await api.save('garage.v22', 'DB.shop', '', { ...data.shop, name: 'ชื่อร้านใหม่' })).toEqual(refused('DB.shop|'));
  expect(await api.save('garage.v22', 'DB.audit', 'a-save', { id: 'a-save', kind: 'receipt', act: 'save' })).toEqual(refused('DB.audit|a-save'));
  expect(await api.save('garage.v22', 'DB.emp', emp.id, { ...emp, dgbPass: '********', dgbActive: true }, [{ unit: 'DB.emp', key: emp.id, field: 'dgbPass', value: '9999' }]))
    .toEqual(refused(`DB.emp|${emp.id}`));
  expect(await page.evaluate(async () => {
    const r = await fetch('/api/storage/dgb.guide.v22', { method: 'PUT', body: '1' });
    return { status: r.status, body: await r.json() };
  })).toEqual(refused('dgb.guide.v22'));
  expect(await api.remove('garage.v22')).toEqual(refused('garage.v22'));

  // Viewing still writes what viewing writes.
  expect(await api.save('garage.v22', 'DB.audit', 'a-open', { id: 'a-open', ts: '2026-10-13 09:00', user: '', userName: 'เจ้าของกิจการ / ผู้ดูแลระบบ',
    kind: 'quote', docId: data.quotes[0].id, no: data.quotes[0].no, act: 'open', note: '' })).toMatchObject({ status: 200 });
  expect(await page.evaluate(async () => (await fetch('/api/storage/garage.v22.bak.2026-10-13', { method: 'PUT', body: '' })).status)).toBe(200);

  const after = (await api.read('garage.v22')).data;
  expect({ ...after, audit: undefined }).toEqual({ ...data, audit: undefined });
  expect(after.audit.slice(data.audit.length).map((a: any) => a.id)).toEqual(['a-open']);
  // The page's own copy no longer matches the server's (the entry above): the next reload reads it again.
  await page.reload();
  await expect(page.getByText(/^⚠ ?Expired Date/).filter({ visible: true })).toHaveText('⚠ Expired Date 01/10/2569 · หมดอายุการใช้งานแล้ว 12 วัน');
  await app.settle();
});
