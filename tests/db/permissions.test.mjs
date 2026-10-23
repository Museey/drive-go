// Coarse permission checks on the server (task T10, docs/PHASE2-DESIGN.md
// §5.1): what each role may save. Every save of the legacy screens passes
// (all scenarios run with these checks on, TARGET=new); these are the saves
// that must be refused. The end-to-end version through the API is S121.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { refuseRemoveKey, refuseSave } from '../../server/lib/permissions.ts';
import { readMain } from '../../server/lib/storage.ts';

let db, ownerPool, appPool, n = 0;
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));
const asApp = (shopId, scope, fn) => withShop(appPool, shopId, scope, fn);

before(async () => {
  db = await startTempPostgres();
  await migrate(db.url);
  ownerPool = new pg.Pool({ connectionString: db.url });
  appPool = new pg.Pool({ connectionString: db.url.replace('//drivego@', '//drivego_app@') });
});
after(async () => {
  await ownerPool?.end();
  await appPool?.end();
  await db?.stop();
});

// One save of one record: its new value (or removal) as the browser sends it.
const upsert = (unit, key, data) => ({ upsert: [{ unit, key, data: JSON.stringify(data) }], remove: [], order: {} });
const remove = (unit, key) => ({ upsert: [], remove: [{ unit, key, data: '' }], order: {} });
const secret = (unit, key, field = 'pass') => [{ unit, key, field, value: 'new-secret' }];

async function shop(name, pkg) {
  const { shopId } = await createShop(ownerPool, { code: `P-${++n}`, pkg, data: fixture(name) });
  const read = async (branch, key) => JSON.parse((await asApp(shopId, '*', c => readMain(c, branch, key))).json);
  return { shopId, read };
}
const check = (shopId, scope, actor, branch, key, changes, secrets = []) =>
  asApp(shopId, scope, c => refuseSave(c, actor, branch, key, changes, secrets));

describe('Biz', () => {
  test('เจ้าของร้านบันทึกได้ทุกส่วน รวมบัญชีร้านและบัญชีพนักงาน', async () => {
    const { shopId, read } = await shop('biz-trial', 'biz');
    const owner = { pkg: 'biz', role: 'owner', ref: '', branch: '' };
    const dgb = await read('', 'dgb.v22');
    const emp = (await read('', 'garage.v22')).emp[0];
    assert.equal(await check(shopId, '', owner, '', 'dgb.v22', upsert('DGB.shop', '', { ...dgb.shop, email: 'x@example.com' }), secret('DGB.shop', '')), null);
    assert.equal(await check(shopId, '', owner, '', 'garage.v22', upsert('DB.emp', emp.id, { ...emp, perms: null, dgbPass: '********' }), secret('DB.emp', emp.id, 'dgbPass')), null);
    assert.equal(refuseRemoveKey(owner, '', 'garage.v22'), null);
    // The copy made before the whole data set is replaced stays its 90 days, even for the owner (task 3.2, F1).
    assert.equal(refuseRemoveKey(owner, '', 'garage.v22.bak.2026-10-13'), null);
    assert.equal(refuseRemoveKey(owner, '', 'garage.v22.bak.safety-2026-10-13T09-00-00-wipe'), 'garage.v22.bak.safety-2026-10-13T09-00-00-wipe');
  });

  test('พนักงานบันทึกงานของร้านได้ แต่แก้บัญชีร้าน สิทธิ์ รหัสผ่าน และลบพนักงานที่มีบัญชีไม่ได้', async () => {
    const { shopId, read } = await shop('biz-trial', 'biz');
    const data = await read('', 'garage.v22');
    const [self, other] = data.emp;
    const emp = { pkg: 'biz', role: 'emp', ref: self.id, branch: '' };
    const dgb = await read('', 'dgb.v22');
    const cust = data.cust[0];
    // Allowed: the shop's ordinary records, and an employee's HR fields.
    assert.equal(await check(shopId, '', emp, '', 'garage.v22', upsert('DB.cust', cust.id, { ...cust, stars: 5 })), null);
    assert.equal(await check(shopId, '', emp, '', 'garage.v22', upsert('DB.emp', other.id, { ...other, salary: 99999 })), null);
    // Refused.
    assert.equal(await check(shopId, '', emp, '', 'dgb.v22', upsert('DGB.shop', '', { ...dgb.shop, email: 'x@example.com' })), 'DGB.shop');
    assert.equal(await check(shopId, '', emp, '', 'dgb.v22', { upsert: [], remove: [], order: {} }, secret('DGB.shop', '')), 'DGB.shop.pass');
    const allTabs = { ...self.perms, tabs: Object.fromEntries(Object.keys(self.perms.tabs).map(k => [k, true])) };
    assert.equal(await check(shopId, '', emp, '', 'garage.v22', upsert('DB.emp', self.id, { ...self, perms: allTabs })), `DB.emp|${self.id}`);
    assert.equal(await check(shopId, '', emp, '', 'garage.v22', upsert('DB.emp', other.id, { ...other, dgbPass: '********', dgbActive: true })), `DB.emp|${other.id}`);
    assert.equal(await check(shopId, '', emp, '', 'garage.v22', { upsert: [], remove: [], order: {} }, secret('DB.emp', other.id, 'dgbPass')), `DB.emp|${other.id}.dgbPass`);
    assert.equal(await check(shopId, '', emp, '', 'franchise.v22', upsert('FR.enabled', '', true)), 'FR.enabled');
    assert.equal(refuseRemoveKey(emp, '', 'garage.v22'), 'garage.v22');
  });

  test('พนักงานลบพนักงานที่มีบัญชีเข้าระบบไม่ได้ ลบคนที่ไม่มีบัญชีได้', async () => {
    const { shopId, read } = await shop('biz-trial', 'biz');
    const [self, other] = (await read('', 'garage.v22')).emp;
    const emp = { pkg: 'biz', role: 'emp', ref: self.id, branch: '' };
    assert.equal(await check(shopId, '', emp, '', 'garage.v22', remove('DB.emp', other.id)), null);
    // Give `other` an account first (as the owner would), then try again.
    await asApp(shopId, '', c => c.query("update records set data = jsonb_set(data::jsonb, '{dgbActive}', 'true')::json where shop_id = app_shop() and unit = 'DB.emp' and key = $1", [other.id]));
    assert.equal(await check(shopId, '', emp, '', 'garage.v22', remove('DB.emp', other.id)), `DB.emp|${other.id}`);
  });
});

describe('Franchise', () => {
  async function chain() {
    const s = await shop('franchise-trial', 'franchise');
    const fr = await s.read('', 'franchise.v22');
    const acc = user => fr.accounts.find(a => a.user === user);
    const actor = (user, role, branch) => ({ pkg: 'franchise', role, ref: acc(user).id, branch });
    return { ...s, fr, acc, hq: actor('hq', 'HQ', ''), b001: actor('b001', 'HB', 'B001'), staff: actor('staff001', 'SHB', 'B001') };
  }
  const req = (id, branchId) => ({ id, no: id, branchId, date: '2026-10-13', items: [], status: 'pending', note: '' });

  test('HQ บันทึกได้ทุกส่วนของเครือ', async () => {
    const { shopId, fr, acc, hq } = await chain();
    assert.equal(await check(shopId, '*', hq, '', 'franchise.v22', upsert('FR.branches', fr.branches[1].id, { ...fr.branches[1], active: false })), null);
    assert.equal(await check(shopId, '*', hq, '', 'franchise.v22', upsert('FR.accounts', acc('b002').id, { ...acc('b002'), active: false }), secret('FR.accounts', acc('b002').id)), null);
    assert.equal(await check(shopId, '*', hq, '', 'franchise.v22', upsert('FR.hqStock', 'x', { id: 'x', code: 'X', qty: 1 })), null);
  });

  test('หัวหน้าสาขาจัดการบัญชีพนักงานและใบขอเบิกของสาขาตัวเองได้ ของสาขาอื่นและของเครือไม่ได้', async () => {
    const { shopId, fr, acc, b001 } = await chain();
    const newStaff = { id: 'n1', user: 'sompong', pass: '********', role: 'SHB', branchId: 'B001', empId: 'e', name: 'สมปอง', active: true };
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.accounts', 'n1', newStaff), secret('FR.accounts', 'n1')), null);
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.accounts', acc('staff001').id, { ...acc('staff001'), active: false })), null);
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.reqs', 'r1', req('r1', 'B001'))), null);
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.accounts', acc('b001').id, acc('b001')), secret('FR.accounts', acc('b001').id)), null, 'own password');
    // Refused.
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.accounts', acc('b002').id, { ...acc('b002'), active: false })), `FR.accounts|${acc('b002').id}`);
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', { upsert: [], remove: [], order: {} }, secret('FR.accounts', acc('hq').id)), `FR.accounts|${acc('hq').id}.pass`);
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.accounts', acc('b001').id, { ...acc('b001'), role: 'HQ' })), `FR.accounts|${acc('b001').id}`);
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.accounts', 'n2', { ...newStaff, id: 'n2', role: 'HB' })), 'FR.accounts|n2');
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.reqs', 'r2', req('r2', 'B002'))), 'FR.reqs|r2');
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.branches', fr.branches[0].id, { ...fr.branches[0], perms: null })), 'FR.branches');
    assert.equal(await check(shopId, 'B001', b001, '', 'franchise.v22', upsert('FR.hqStock', 'x', { id: 'x', code: 'X', qty: 1 })), 'FR.hqStock');
    assert.equal(refuseRemoveKey(b001, 'B001', 'garage.v22'), null);
    assert.equal(refuseRemoveKey(b001, '', 'franchise.v22'), 'franchise.v22');
  });

  test('พนักงานสาขา (SHB) ส่งใบขอเบิกของสาขาตัวเองได้ ออกบัญชีหรือแก้บัญชีคนอื่นไม่ได้', async () => {
    const { shopId, acc, staff } = await chain();
    assert.equal(await check(shopId, 'B001', staff, '', 'franchise.v22', upsert('FR.reqs', 'r1', req('r1', 'B001'))), null);
    assert.equal(await check(shopId, 'B001', staff, '', 'franchise.v22', upsert('FR.seq', '', { req: 1, br: 2 })), null);
    assert.equal(await check(shopId, 'B001', staff, '', 'franchise.v22', upsert('FR.accounts', 'n1',
      { id: 'n1', user: 'x1', pass: '********', role: 'SHB', branchId: 'B001', empId: 'e', name: 'x', active: true })), 'FR.accounts|n1');
    assert.equal(await check(shopId, 'B001', staff, '', 'franchise.v22', upsert('FR.accounts', acc('b001').id, { ...acc('b001'), active: false })), `FR.accounts|${acc('b001').id}`);
    assert.equal(await check(shopId, 'B001', staff, '', 'franchise.v22', upsert('FR.reqs', 'r2', req('r2', 'B002'))), 'FR.reqs|r2');
  });
});
