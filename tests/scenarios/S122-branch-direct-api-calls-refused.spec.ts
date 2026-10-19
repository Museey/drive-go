import { test, expect } from '../support/test';
import { storageApi } from '../support/storage-api';

test.use({ dataset: 'franchise-trial' });

// New behaviour (task T10, design §5.1, decision Q3): a branch account calling
// the API directly cannot reach other branches' data or HQ's, change accounts
// that are not its own branch's staff, make requests for another branch or
// change the chain's settings; a staff account cannot issue accounts. Every
// call is made with the account's own session and must be refused.
test('S122 ระบบใหม่: บัญชีสาขาเรียก API ตรงเพื่อแก้ข้อมูลสาขาอื่น บัญชีอื่น ใบขอเบิกของสาขาอื่น หรือการตั้งค่าเครือ ถูกปฏิเสธทั้งหมด', async ({ app, page }) => {
  await app.open();
  await app.login('b001', '1234');
  const api = storageApi(page);
  const fr = (await api.read('franchise.v22')).data;
  const acc = (user: string) => fr.accounts.find((a: any) => a.user === user);
  const refused = (what: string) => ({ status: 403, body: { error: 'not allowed', what } });

  // Other branches' data and HQ's own data.
  expect((await api.read('garage.v22::B002')).status).toBe(403);
  expect((await api.read('garage.v22::HQ')).status).toBe(403);
  expect((await api.save('garage.v22::B002', 'DB.cust', 'x', { id: 'x', name: 'x' })).status).toBe(403);
  // Accounts that are not this branch's staff.
  expect(await api.save('franchise.v22', 'FR.accounts', acc('b002').id, { ...acc('b002'), active: false }))
    .toEqual(refused(`FR.accounts|${acc('b002').id}`));
  expect(await api.save('franchise.v22', 'FR.accounts', acc('b001').id, { ...acc('b001'), role: 'HQ' }))
    .toEqual(refused(`FR.accounts|${acc('b001').id}`));
  // HQ's password (refused at HQ's account record, before the password itself).
  expect(await api.save('franchise.v22', 'FR.accounts', acc('hq').id, acc('hq'), [{ unit: 'FR.accounts', key: acc('hq').id, field: 'pass', value: '0000' }]))
    .toEqual(refused(`FR.accounts|${acc('hq').id}`));
  // Another branch's request, the chain's settings and stock.
  const req = { id: 'r1', no: 'REQ-X', branchId: 'B002', date: '2026-10-13', items: [], status: 'pending', note: '' };
  expect(await api.save('franchise.v22', 'FR.reqs', 'r1', req)).toEqual(refused('FR.reqs|r1'));
  expect(await api.save('franchise.v22', 'FR.branches', 'B001', { ...fr.branches[0], perms: null })).toEqual(refused('FR.branches'));
  expect(await api.save('franchise.v22', 'FR.hqStock', 'x', { id: 'x', code: 'X', qty: 999 })).toEqual(refused('FR.hqStock'));
  expect(await api.remove('franchise.v22')).toEqual(refused('franchise.v22'));

  // A staff account cannot issue accounts, not even for its own branch.
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('staff001', '5678');
  const staff = { id: 'n1', user: 'mine', pass: '********', role: 'SHB', branchId: 'B001', empId: 'e', name: 'x', active: true };
  expect(await api.save('franchise.v22', 'FR.accounts', 'n1', staff, [{ unit: 'FR.accounts', key: 'n1', field: 'pass', value: '1111' }]))
    .toEqual(refused('FR.accounts|n1'));

  // Nothing changed (apart from who is signed in, which is the session's own field).
  const chain = ({ session, ...rest }: any) => rest;
  expect(chain((await api.read('franchise.v22')).data)).toEqual(chain(fr));
});
