// Licences (task 3.15): the server's dates in the shop's data, read-only after the last day (15.3), the staff
// tool's renewals and the retention job (15.5, 15.6).
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { addDays, licenceOf, pinData, refuseExpiredKey, refuseExpiredSave } from '../../server/lib/licence.ts';
import { carryOut, close, listShops, openLicence, postpone, renew, retentionDue } from '../../server/lib/licence-admin.ts';
import { readMain } from '../../server/lib/storage.ts';

// The day the fixtures and the scenarios are fixed at (tests/support/config.mjs), as the tests' server has it.
process.env.DRIVEGO_TODAY = '2026-10-13';
process.env.DRIVEGO_TEST_SERVER = '1';

let db, ownerPool, appPool, n = 0;
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));
const asApp = (shopId, scope, fn) => withShop(appPool, shopId, scope, fn);
const actor = 'test';
const tell = async () => {};

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

// The fixtures' licence: 2025-12-01 → 2027-02-10.
async function shop(name = 'biz-trial', pkg = 'biz', licence) {
  const code = `L-${++n}`;
  const { shopId } = await createShop(ownerPool, { code, pkg, data: fixture(name), licence });
  const read = async (branch, key) => JSON.parse((await asApp(shopId, '*', c => readMain(c, branch, key))).json);
  return { shopId, code, read };
}
const expiredLicence = { kind: 'paid', start: '2025-10-01', end: '2026-10-01' };   // ended before the tests' day (2026-10-13)
const owner = { pkg: 'biz', role: 'owner', ref: '', branch: '' };
const upsert = (unit, key, data) => ({ upsert: [{ unit, key, data: JSON.stringify(data) }], remove: [], order: {} });
const none = { upsert: [], remove: [], order: {} };
// The fixture's employees have no sign-in yet: give the first one an account that is on.
async function withAccount(shopId, data) {
  const emp = { ...data.emp[0], dgbActive: true };
  await asApp(shopId, '', c => c.query("update records set data = $1::json where shop_id = app_shop() and unit = 'DB.emp' and key = $2", [JSON.stringify(emp), emp.id]));
  return emp;
}
// As the save route checks it: pinned first, then the read-only rule (today: the tests' day).
const check = (shopId, a, key, changes, secrets = [], branch = '') => asApp(shopId, '*', async c => {
  const l = await licenceOf(c);
  return refuseExpiredSave(c, a, branch, key, pinData(changes, l), secrets, l);
});

describe('วันหมดอายุอยู่ที่ server', () => {
  test('ร้านใหม่ได้วันที่ของ server ในข้อมูลร้าน และร้านแก้วันที่ของตัวเองไม่ได้', async () => {
    const fromFixture = await shop();
    assert.deepEqual((await fromFixture.read('', 'garage.v22')).shop.licEnd, '2027-02-10');
    const trial = await shop('biz-trial', 'biz', { kind: 'trial', start: '2026-10-13', end: '2026-12-12' });
    const data = await trial.read('', 'garage.v22');
    assert.equal(data.shop.licStart, '2026-10-13');
    assert.equal(data.shop.licEnd, '2026-12-12');
    // A save sending other dates (extendLic, saveSetting, a wipe, an import) is written with the licence's.
    const sent = upsert('DB.shop', '', { ...data.shop, licEnd: '2030-01-01', name: 'ร้านใหม่' });
    const pinned = await asApp(trial.shopId, '', async c => pinData(sent, await licenceOf(c)));
    const row = JSON.parse(pinned.upsert[0].data);
    assert.equal(row.licEnd, '2026-12-12');
    assert.equal(row.name, 'ร้านใหม่');
    assert.deepEqual(Object.keys(row), Object.keys(data.shop));
  });

  test('แอปอ่านวันหมดอายุของร้านตัวเองได้เท่านั้น แก้ไม่ได้ และไม่เห็นประวัติของทีมงาน', async () => {
    const a = await shop(), b = await shop();
    const rows = await asApp(a.shopId, '', c => c.query('select shop_id from licences'));
    assert.deepEqual(rows.rows.map(r => r.shop_id), [a.shopId]);
    await assert.rejects(asApp(a.shopId, '', c => c.query("update licences set ends_on = '2099-01-01'")), /permission denied/);
    await assert.rejects(asApp(a.shopId, '', c => c.query("insert into licences (shop_id, kind, starts_on, ends_on) values ($1, 'paid', '2026-01-01', '2099-01-01')", [b.shopId])), /permission denied/);
    await assert.rejects(asApp(a.shopId, '', c => c.query('select * from licence_log')), /permission denied/);
  });
});

describe('หมดอายุแล้วอ่านอย่างเดียว (15.3)', () => {
  test('ยังไม่หมดอายุ บันทึกได้ตามปกติ', async () => {
    const { shopId, read } = await shop();
    const cust = (await read('', 'garage.v22')).cust[0];
    assert.equal(await check(shopId, owner, 'garage.v22', upsert('DB.cust', cust.id, { ...cust, name: 'x' })), null);
  });

  test('หมดอายุแล้ว: ประวัติการเปิดและพิมพ์ ข้อมูลของคนที่เข้าระบบ รหัสผ่านตัวเอง และระงับบัญชีพนักงาน บันทึกได้', async () => {
    const { shopId, read } = await shop('biz-trial', 'biz', expiredLicence);
    const data = await read('', 'garage.v22');
    const audit = act => upsert('DB.audit', `new-${act}`, { id: `new-${act}`, ts: '2026-10-13 09:00', user: '', userName: 'เจ้าของ', kind: 'receipt', docId: 'x', no: 'MA-RE1', act, note: '' });
    for (const act of ['open', 'print', 'export']) assert.equal(await check(shopId, owner, 'garage.v22', audit(act)), null, act);
    assert.equal(await check(shopId, owner, 'garage.v22', none), null);                           // session fields only
    assert.equal(await check(shopId, owner, 'dgb.v22', none, [{ unit: 'DGB.shop', key: '', field: 'pass' }]), null);
    // The shop's settings sent unchanged (the licence's own dates are put back first).
    assert.equal(await check(shopId, owner, 'garage.v22', upsert('DB.shop', '', { ...data.shop, licEnd: '2030-01-01' })), null);
    const emp = await withAccount(shopId, data);
    assert.equal(await check(shopId, owner, 'garage.v22', upsert('DB.emp', emp.id, { ...emp, dgbActive: false })), null);
    const cut = data.stockCuts.find(c => !c.printed);   // printing a sale marks it printed
    assert.equal(await check(shopId, owner, 'garage.v22', upsert('DB.stockCuts', cut.id, { ...cut, printed: true })), null);
    assert.deepEqual(await check(shopId, owner, 'garage.v22', upsert('DB.stockCuts', cut.id, { ...cut, printed: true, note: 'x' })),
      { error: 'expired', what: `DB.stockCuts|${cut.id}` });
    // An employee changes their own password, not someone else's.
    const self = { pkg: 'biz', role: 'emp', ref: emp.id, branch: '' };
    assert.equal(await check(shopId, self, 'garage.v22', none, [{ unit: 'DB.emp', key: emp.id, field: 'dgbPass' }]), null);
    const other = data.emp[1].id;
    assert.deepEqual(await check(shopId, self, 'garage.v22', none, [{ unit: 'DB.emp', key: other, field: 'dgbPass' }]),
      { error: 'expired', what: `DB.emp|${other}.dgbPass` });
  });

  test('หมดอายุแล้ว: สร้าง แก้ ลบ ล้าง และเรียก API ตรงไม่ได้', async () => {
    const { shopId, read } = await shop('biz-trial', 'biz', expiredLicence);
    const data = await read('', 'garage.v22');
    const cust = data.cust[0], emp = await withAccount(shopId, data);
    const refused = async (changes, what, key = 'garage.v22') => assert.deepEqual(await check(shopId, owner, key, changes), { error: 'expired', what });
    await refused(upsert('DB.cust', cust.id, { ...cust, name: 'x' }), `DB.cust|${cust.id}`);
    await refused(upsert('DB.cust', 'new', { id: 'new', name: 'ลูกค้าใหม่' }), 'DB.cust|new');
    await refused({ upsert: [], remove: [{ unit: 'DB.cust', key: cust.id }], order: {} }, `DB.cust|${cust.id}`);
    await refused(upsert('DB.shop', '', { ...data.shop, name: 'ชื่อใหม่' }), 'DB.shop|');
    await refused(upsert('DB.audit', 'n1', { id: 'n1', act: 'save', kind: 'receipt' }), 'DB.audit|n1');
    await refused({ ...none, layout: '[]' }, 'garage.v22: layout ' + JSON.parse((await asApp(shopId, '', c => c.query("select data::text as d from records where unit = 'DB'"))).rows[0].d).map(e => '-' + JSON.stringify(e)).join(' '));
    // The same fields in another order, and fields the app adds with their starting value: allowed.
    const layout = JSON.parse((await asApp(shopId, '', c => c.query("select data::text as d from records where unit = 'DB'"))).rows[0].d);
    assert.equal(await check(shopId, owner, 'garage.v22', { ...none, layout: JSON.stringify([...layout].reverse()) }), null);
    const grown = JSON.stringify([...layout, ['newSetting', 'D'], ['newList', 'L']]);
    assert.equal(await check(shopId, owner, 'garage.v22', { ...none, layout: grown, upsert: [{ unit: 'DB.newSetting', key: '', data: '{}' }] }), null);
    assert.deepEqual(await check(shopId, owner, 'garage.v22', { ...none, layout: grown, upsert: [{ unit: 'DB.newSetting', key: '', data: '{}' }, { unit: 'DB.newList', key: 'x', data: '{}' }] }),
      { error: 'expired', what: 'garage.v22: layout +["newList","L"]' });
    assert.deepEqual(await check(shopId, owner, 'garage.v22', { ...none, layout: grown, upsert: [{ unit: 'DB.newSetting', key: '', data: JSON.stringify('x'.repeat(3000)) }] }),
      { error: 'expired', what: 'garage.v22: layout +["newSetting","D"]' });
    await refused({ ...none, order: { 'DB.cust': [] } }, 'DB.cust');
    await refused(upsert('DB.emp', emp.id, { ...emp, dgbActive: false, salary: 1 }), `DB.emp|${emp.id}`);   // more than the switch
    await refused({ upsert: [], remove: [{ unit: 'DB.audit', key: data.audit[0].id }], order: {} }, `DB.audit|${data.audit[0].id}`);
    const key = (k, m) => asApp(shopId, '', async c => refuseExpiredKey(c, k, m, /\.bak\./.test(k), /\.bak\.safety-/.test(k), await licenceOf(c)));
    assert.equal(await key('garage.v22.bak.2026-10-13', 'PUT'), null);                 // the daily backup, from the server's own data
    assert.equal(await key('garage.v22.bak.2026-10-01', 'DELETE'), null);              // and its trimming
    assert.deepEqual(await key('garage.v22.bak.safety-2026-10-13T09-00-00-wipe', 'DELETE'), { error: 'expired', what: 'garage.v22.bak.safety-2026-10-13T09-00-00-wipe' });
    assert.deepEqual(await key('garage.v22', 'DELETE'), { error: 'expired', what: 'garage.v22' });
    assert.deepEqual(await key('dgb.guide.v22', 'PUT'), { error: 'expired', what: 'dgb.guide.v22' });
  });

  test('หมดอายุแล้ว: ข้อมูลชุดที่ยังไม่มี (HQ หรือหัวหน้าสาขาเข้าระบบครั้งแรก) สร้างได้ ชุดที่มีแล้วเปลี่ยนโครงไม่ได้', async () => {
    const { shopId } = await shop('franchise-trial', 'franchise', expiredLicence);
    const hq = { pkg: 'franchise', role: 'HQ', ref: 'hq', branch: '' };
    const first = { layout: '[["shop","D"]]', upsert: [{ unit: 'DB.shop', key: '', data: '{"name":"","licStart":"","licEnd":""}' }], remove: [], order: {} };
    assert.equal(await check(shopId, hq, 'garage.v22::HQ', first, [], 'HQ'), null);
    assert.equal((await check(shopId, hq, 'garage.v22', first, [], 'B001')).what.startsWith('garage.v22: layout -'), true);
  });

  test('ร้านที่ทีมงานระงับ บันทึกไม่ได้แม้ยังไม่หมดอายุ', async () => {
    const { shopId } = await shop();
    await ownerPool.query("update shops set status = 'suspended' where id = $1", [shopId]);
    assert.deepEqual(await check(shopId, owner, 'garage.v22', none), { error: 'suspended', what: 'garage.v22' });
  });

  test('แฟรนไชส์: วันหมดอายุเดียวทั้งเครือ และ HQ สาขา หมดอายุพร้อมกัน', async () => {
    const { shopId, code, read } = await shop('franchise-trial', 'franchise', expiredLicence);
    const branches = (await read('', 'franchise.v22')).branches;
    for (const b of branches) {
      const key = b.storeKey || `garage.v22::${b.id}`;
      const d = await asApp(shopId, '*', c => readMain(c, b.id, key));
      if (d) assert.equal(JSON.parse(d.json).shop.licEnd, '2026-10-01', b.id);
    }
    const hq = { pkg: 'franchise', role: 'HQ', ref: 'hq', branch: '' };
    assert.deepEqual(await check(shopId, hq, 'franchise.v22', upsert('FR.org', '', { name: 'x' })), { error: 'expired', what: 'FR.org|' });
    // Renewed by staff: every data set of the chain gets the new last day, and it saves again.
    const l = await renew(ownerPool, code, { years: 1, paidOn: '2026-10-13', actor });
    assert.equal(l.end, '2027-10-13');
    assert.equal(JSON.parse((await asApp(shopId, '*', c => readMain(c, 'B001', 'garage.v22'))).json).shop.licEnd, '2027-10-13');
    assert.equal(await check(shopId, hq, 'franchise.v22', upsert('FR.org', '', { name: 'x' })), null);
  });
});

describe('เครื่องมือทีมงาน', () => {
  test('ต่ออายุ: ยังไม่หมดนับจากวันสุดท้าย หมดแล้วนับจากวันที่จ่าย ร้านบันทึกได้อีก มีประวัติและเวอร์ชันใหม่', async () => {
    const running = await shop();
    assert.equal((await renew(ownerPool, running.code, { years: 1, paidOn: '2026-10-13', actor })).end, '2028-02-10');
    const lapsed = await shop('biz-trial', 'biz', expiredLicence);
    const before = (await asApp(lapsed.shopId, '', c => c.query("select version from records where unit = 'DB.shop'"))).rows[0].version;
    const l = await renew(ownerPool, lapsed.code, { years: 2, paidOn: '2026-10-13', actor, note: 'โอน 24,000' });
    assert.deepEqual([l.kind, l.start, l.end, l.deleteOn], ['paid', '2025-10-01', '2028-10-13', addDays('2028-10-13', 90)]);
    const after = await asApp(lapsed.shopId, '', c => c.query("select version, data->>'licEnd' as end from records where unit = 'DB.shop'"));
    assert.deepEqual([after.rows[0].version, after.rows[0].end], [before + 1, '2028-10-13']);
    const hist = await asApp(lapsed.shopId, '', c => c.query("select after->>'licEnd' as end from change_log where unit = 'DB.shop'"));
    assert.deepEqual(hist.rows.map(r => r.end), ['2028-10-13']);
    const log = await ownerPool.query('select actor, action, detail from licence_log where shop_id = $1', [lapsed.shopId]);
    assert.deepEqual(log.rows.map(r => [r.actor, r.action, r.detail.note]), [['test', 'renew', 'โอน 24,000']]);
    assert.equal(await check(lapsed.shopId, owner, 'garage.v22', upsert('DB.cust', 'new', { id: 'new' })), null);
  });

  test('เปิดร้าน: ทดลองใช้ 60 วัน อู่นำร่อง 1 ปี, ปิดร้านแล้วอ่านอย่างเดียวทันที, รายการที่ใกล้หมดอายุ', async () => {
    const s = await shop();
    assert.deepEqual(await openLicence(ownerPool, s.code, { kind: 'trial', from: '2026-09-01', actor }).then(l => [l.kind, l.end]), ['trial', '2026-10-31']);
    assert.deepEqual(await openLicence(ownerPool, s.code, { kind: 'pilot', from: '2026-09-01', actor }).then(l => [l.kind, l.end]), ['pilot', '2027-09-01']);
    assert.ok((await listShops(ownerPool, { expiring: 30, on: '2027-08-10' })).some(x => x.code === s.code));
    assert.ok(!(await listShops(ownerPool, { expiring: 30, on: '2026-10-13' })).some(x => x.code === s.code));
    const l = await close(ownerPool, s.code, { lastDay: '2026-10-12', actor });
    assert.deepEqual([l.end, l.deleteOn], ['2026-10-12', '2027-01-10']);
    assert.deepEqual(await check(s.shopId, owner, 'garage.v22', upsert('DB.cust', 'new', { id: 'new' })), { error: 'expired', what: 'DB.cust|new' });
    await assert.rejects(postpone(ownerPool, s.code, { to: '2027-01-01', actor }), /after 2027-01-10/);
    assert.equal((await postpone(ownerPool, s.code, { days: 30, actor })).deleteOn, '2027-02-09');
  });
});

describe('เก็บข้อมูล 90 วันแล้วลบ (15.5, 15.6)', () => {
  const tables = ['records', 'blobs', 'backups', 'users', 'logins', 'sessions', 'write_log', 'change_log', 'doc_counters', 'licences'];
  const rowsOf = async shopId => Object.fromEntries(await Promise.all(tables.map(async t =>
    [t, (await ownerPool.query(`select count(*)::int as n from ${t} where shop_id = $1`, [shopId])).rows[0].n])));
  const dueFor = async (code, on) => (await retentionDue(ownerPool, on)).filter(d => d.shop.code === code);

  test('แจ้งก่อนลบ 30 วัน ลองดูก่อน (ไม่เปลี่ยนอะไร) ลบข้อมูลในวันที่ 90 เก็บประวัติการเปลี่ยนแปลงอีก 5 ปีแล้วจึงลบ', async () => {
    const s = await shop('biz-trial', 'biz', expiredLicence);   // last day 2026-10-01: removal 2026-12-30, notice from 2026-11-30
    // Some change history and a backup of its own, to see them go.
    await asApp(s.shopId, '', c => c.query("insert into change_log (shop_id, store_key, unit, key, op) values (app_shop(), 'garage.v22', 'DB.cust', 'x', 'insert')"));
    await asApp(s.shopId, '', c => c.query("insert into backups (shop_id, key, data) values (app_shop(), 'garage.v22.bak.2026-10-01', '\\x00')"));
    assert.deepEqual(await dueFor(s.code, '2026-11-29'), []);
    assert.deepEqual((await dueFor(s.code, '2026-11-30')).map(d => d.action), ['notice']);
    // A dry run (no carryOut) changes nothing: still due the next day.
    assert.deepEqual((await dueFor(s.code, '2026-12-01')).map(d => d.action), ['notice']);
    const told = [];
    const [notice] = await dueFor(s.code, '2026-12-01');
    assert.equal(await carryOut(ownerPool, notice, { actor, on: '2026-12-01', tell: async (d, on) => { told.push([d.shop.code, on]); } }), true);
    assert.deepEqual(told, [[s.code, '2026-12-31']]);   // told a day late: the removal moves so the shop has its 30 days
    assert.deepEqual(await dueFor(s.code, '2026-12-30'), []);
    const [del] = await dueFor(s.code, '2026-12-31');
    assert.equal(del.action, 'delete');
    const before = await rowsOf(s.shopId);
    assert.ok(before.records > 0 && before.change_log > 0 && before.backups > 0 && before.users > 0, JSON.stringify(before));
    assert.equal(await carryOut(ownerPool, del, { actor, on: '2026-12-31', tell }), true);
    // Everything but the change history (owner's answer of 2026-10-26: kept 5 years, as R15) and the licence.
    assert.deepEqual(await rowsOf(s.shopId), { ...Object.fromEntries(tables.map(t => [t, 0])), change_log: before.change_log, licences: 1 });
    assert.equal((await ownerPool.query('select status from shops where id = $1', [s.shopId])).rows[0].status, 'removed');
    await assert.rejects(renew(ownerPool, s.code, { years: 1, actor }), /removed on 2026-12-31/);
    assert.deepEqual(await dueFor(s.code, '2031-12-30'), []);
    const [purge] = await dueFor(s.code, '2031-12-31');
    assert.equal(purge.action, 'purge');
    assert.equal(await carryOut(ownerPool, purge, { actor, on: '2031-12-31', tell }), true);
    assert.deepEqual(await rowsOf(s.shopId), Object.fromEntries(tables.map(t => [t, 0])));
    assert.equal((await ownerPool.query('select count(*)::int as n from shops where id = $1', [s.shopId])).rows[0].n, 0);
    const log = await ownerPool.query('select action from licence_log where shop_id = $1 order by id', [s.shopId]);
    assert.deepEqual(log.rows.map(r => r.action), ['notice', 'delete', 'purge']);
  });

  test('ร้านที่ต่ออายุแล้วไม่ถูกลบ แม้ได้รับแจ้งไปแล้ว และงานที่ค้างไว้ก่อนต่ออายุก็ไม่ลบ', async () => {
    const s = await shop('biz-trial', 'biz', expiredLicence);
    const [notice] = await dueFor(s.code, '2026-12-01');
    await carryOut(ownerPool, notice, { actor, on: '2026-12-01', tell });
    const [del] = await dueFor(s.code, '2026-12-31');
    await renew(ownerPool, s.code, { years: 1, paidOn: '2026-12-20', actor });
    assert.equal(await carryOut(ownerPool, del, { actor, on: '2026-12-31', tell }), false);
    assert.deepEqual(await dueFor(s.code, '2027-06-01'), []);
    assert.ok((await rowsOf(s.shopId)).records > 0);
  });

  test('ไม่ลบก่อนแจ้งครบ 30 วัน และทีมงานเลื่อนวันลบได้', async () => {
    const s = await shop('biz-trial', 'biz', expiredLicence);
    // Nobody ran the job until after the removal day: told first, removed 30 days later.
    assert.deepEqual((await dueFor(s.code, '2027-01-15')).map(d => d.action), ['notice']);
    await carryOut(ownerPool, (await dueFor(s.code, '2027-01-15'))[0], { actor, on: '2027-01-15', tell });
    assert.deepEqual(await dueFor(s.code, '2027-02-13'), []);
    await postpone(ownerPool, s.code, { to: '2027-06-01', actor });
    assert.deepEqual(await dueFor(s.code, '2027-02-14'), []);
    assert.deepEqual((await dueFor(s.code, '2027-05-02')).map(d => d.action), ['notice']);   // told again before the new day
  });
});
