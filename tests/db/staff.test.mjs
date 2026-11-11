// The staff web page (0008_staff.sql, server/lib/staff.ts, staff-shops.ts): what its database role may and may not
// do, and signing in (password, a temporary password changed first, the authenticator app set up, its codes once).
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { signInBiz } from '../../server/lib/auth.ts';
import { carryOut, listShops, retentionDue } from '../../server/lib/licence-admin.ts';
import { addDays, today } from '../../server/lib/licence.ts';
import { addStaff, appSetUp, changePassword, checkCode, getStaffSession, resetStaff, setStaffActive, signIn, signOut } from '../../server/lib/staff.ts';
import { openShop, shopAction, shopDetail, shopsOverview } from '../../server/lib/staff-shops.ts';
import { codeAt, stepAt } from '../../server/lib/totp.ts';

let db, ownerPool, appPool, staffPool;

before(async () => {
  db = await startTempPostgres();
  const c = new pg.Client({ connectionString: db.url });
  await c.connect();
  await c.query('create role drivego_staff login');
  await c.end();
  await migrate(db.url);
  ownerPool = new pg.Pool({ connectionString: db.url });
  appPool = new pg.Pool({ connectionString: db.url.replace('//drivego@', '//drivego_app@') });
  staffPool = new pg.Pool({ connectionString: db.url.replace('//drivego@', '//drivego_staff@') });
});
after(async () => {
  await ownerPool?.end();
  await appPool?.end();
  await staffPool?.end();
  await db?.stop();
});

const refused = async (pool, sql) => assert.rejects(pool.query(sql), e => e.code === '42501', sql);
const shop = (code, more = {}) => ({ code, pkg: 'biz', kind: 'trial', name: `อู่ ${code}`, owner: 'แดง ใจดี', contact: 'คุณแดง 081-234-5678', ...more });

describe('สิทธิ์ของ drivego_staff', () => {
  test('เปิดร้าน ดูทุกร้าน และทำทุกอย่างของเครื่องมือทีมงานได้ แต่ลบร้าน อ่านข้อผิดพลาด หรือแก้โครงสร้างฐานข้อมูลไม่ได้', async () => {
    const a = await openShop(staffPool, shop('staff-a'), 'web:test');
    await openShop(staffPool, shop('staff-b', { pkg: 'franchise' }), 'web:test');
    assert.deepEqual([a.code, a.user], ['staff-a', 'staffa']);
    const { shops } = await shopsOverview(staffPool);
    assert.deepEqual(shops.map(s => s.code).sort(), ['staff-a', 'staff-b']);
    // The owner signs in with the password the page showed.
    const id = shops.find(s => s.code === 'staff-a').id;
    assert.equal((await withShop(appPool, id, '*', c => signInBiz(c, 'staffa', a.password))).ok, true);

    const act = b => shopAction(staffPool, 'staff-a', b, 'web:test');
    assert.equal((await act({ action: 'renew', years: 1, paidOn: today(), note: 'ใบเสร็จ 12' })).licence.kind, 'paid');
    assert.equal((await act({ action: 'contact', contact: 'คุณดำ 089' })).licence.contact, 'คุณดำ 089');
    const pw = await act({ action: 'password' });
    assert.equal(pw.user, 'staffa');
    assert.equal((await withShop(appPool, id, '*', c => signInBiz(c, 'staffa', a.password))).ok, false);
    assert.equal((await withShop(appPool, id, '*', c => signInBiz(c, 'staffa', pw.password))).ok, true);
    const closed = (await act({ action: 'close', lastDay: addDays(today(), -1), note: 'ร้านขอยกเลิก' })).licence;
    assert.equal(closed.end, today(), 'never before its first day (opened today)');
    const later = (await act({ action: 'postpone', days: 10 })).licence;
    assert.equal(later.deleteOn, addDays(closed.deleteOn, 10));
    await assert.rejects(act({ action: 'told' }), /the licence has not ended/);
    // Ended 80 days ago, removal in 10 days: staff call, then note it; the removal moves to 30 days after the call.
    await ownerPool.query('update licences set starts_on = $2, ends_on = $3, delete_on = $4 where shop_id = (select id from shops where code = $1)',
      ['staff-a', addDays(today(), -200), addDays(today(), -80), addDays(today(), 10)]);
    assert.equal((await shopsOverview(staffPool)).shops.find(x => x.code === 'staff-a').due, 'notice');
    assert.deepEqual(await act({ action: 'told', note: 'คุยกับคุณดำ' }), { removalOn: addDays(today(), 30) });
    await assert.rejects(act({ action: 'told' }), /told on \S+ already/);
    await assert.rejects(act({ action: 'what' }), /no action what/);
    const fr = await shopAction(staffPool, 'staff-b', { action: 'password' }, 'web:test');
    assert.equal(fr.user, 'hq');

    const detail = await shopDetail(staffPool, 'staff-a');
    assert.deepEqual(detail.log.map(r => r.action), ['notice', 'postpone', 'close', 'password', 'contact', 'renew', 'new']);
    assert.ok(detail.log.every(r => r.actor === 'web:test'));
    assert.deepEqual(detail.accounts, [{ user: 'staffa', role: 'owner', name: 'แดง ใจดี', active: true }]);
    assert.equal(JSON.stringify(detail).includes(pw.password), false, 'no password in what the page shows');
    assert.deepEqual((await shopDetail(staffPool, 'staff-b')).accounts.map(x => [x.user, x.role]), [['hq', 'HQ']]);

    // Not the nightly job's work, not the errors, not the schema.
    await refused(staffPool, `delete from shops where code = 'staff-b'`);
    await refused(staffPool, 'select * from errors');
    await refused(staffPool, 'create table x (a int)');
    await refused(staffPool, 'drop table licences');
    await refused(staffPool, 'select drivego_staff_grants()');
    const due = { shop: shops.find(s => s.code === 'staff-b'), licence: { removedOn: today() }, action: 'purge' };
    await ownerPool.query(`update licences set starts_on = '1999-01-01', ends_on = '2000-01-01', delete_on = '2000-04-01', removed_on = '2000-04-01' where shop_id = $1`, [due.shop.id]);
    await assert.rejects(carryOut(staffPool, due, { actor: 'web:test', tell: async () => {} }), e => e.code === '42501');
    assert.equal((await listShops(ownerPool)).length, 2);
    assert.ok((await retentionDue(staffPool)).some(d => d.shop.code === 'staff-b' && d.action === 'purge'));
  });

  test('แอปของร้านมองไม่เห็นบัญชีทีมงาน การเข้าระบบของทีมงาน และประวัติของทีมงาน', async () => {
    for (const t of ['staff', 'staff_sessions', 'staff_log']) await refused(appPool, `select * from ${t}`);
    const { rows } = await ownerPool.query("select rolsuper, rolbypassrls from pg_roles where rolname = 'drivego_staff'");
    assert.deepEqual(rows[0], { rolsuper: false, rolbypassrls: false });
  });
});

// A request of the tab holding the token a step gave (Authorization header, lib/staff.ts).
const req = token => new Request('http://shop.test/api/ops/me', { headers: token ? { authorization: `Bearer ${token}` } : {} });
const session = token => getStaffSession(req(token), staffPool);
let address = 0;
const where = () => `10.0.0.${++address}`;

describe('เข้าระบบหน้าเว็บทีมงาน', () => {
  test('ครั้งแรก: รหัสชั่วคราว → ตั้งรหัสใหม่ → ตั้งค่าแอป → ใส่รหัสจากแอป แล้วครั้งถัดไปใช้รหัสผ่านกับรหัสจากแอป', async () => {
    const a = await addStaff(ownerPool, { login: 'Somchai', name: 'สมชาย', actor: 'owner' });
    assert.equal(a.login, 'somchai');
    await assert.rejects(addStaff(ownerPool, { login: 'somchai', name: 'x', actor: 'owner' }), /exists already/);
    const ip = where();
    assert.deepEqual(await signIn(staffPool, 'somchai', 'nope', ip), { ok: false, error: 'wrong' });
    assert.deepEqual(await signIn(staffPool, 'nobody', a.password, ip), { ok: false, error: 'wrong' });
    const first = await signIn(staffPool, ' SOMCHAI ', a.password, ip);
    assert.equal(first.next, 'password');
    let s = await session(first.token);
    assert.equal(s.stage, 'password');
    // Nothing else before the new password.
    assert.equal(await appSetUp(staffPool, s), null);
    assert.deepEqual(await checkCode(staffPool, s, '123456', ip), { ok: false, error: 'stage' });
    assert.deepEqual(await changePassword(staffPool, s, { password: 'short' }, ip), { ok: false, error: 'short' });
    assert.deepEqual(await changePassword(staffPool, s, { password: a.password }, ip), { ok: false, error: 'same' });
    assert.deepEqual(await changePassword(staffPool, s, { password: 'ม้าลายกินหญ้า-2026' }, ip), { ok: true, next: 'app' });
    s = await session(first.token);
    const app = await appSetUp(staffPool, s);
    assert.match(app.secret, /^[A-Z2-7]{32}$/);
    assert.match(app.uri, /^otpauth:\/\/totp\/DriveGo%3Asomchai\?secret=/);
    assert.match(app.qr, /^data:image\/svg\+xml;base64,/);
    assert.equal((await appSetUp(staffPool, s)).secret, app.secret, 'the same secret until it is set up');
    assert.equal((await appSetUp(staffPool, await session(first.token))).secret, app.secret);
    const now = Date.now();
    assert.deepEqual(await checkCode(staffPool, s, codeAt(app.secret, stepAt(now) - 5), ip, now), { ok: false, error: 'wrong' });
    s = await session(first.token);
    const done = await checkCode(staffPool, s, codeAt(app.secret, stepAt(now)), ip, now);
    assert.equal(done.next, 'done');
    assert.equal(await session(first.token), null, 'the password step\'s cookie no longer works');
    const full = await session(done.token);
    assert.equal(full.stage, 'full');
    assert.equal(full.staff.totp_pending, null);
    // Only as the tab's header: the same token in a cookie (sent by any page of the address) is nobody.
    assert.match(done.token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(await getStaffSession(new Request('http://shop.test/api/ops/me', { headers: { cookie: `dg_staff=${done.token}; dg_ops=${done.token}` } }), staffPool), null);
    assert.equal(await getStaffSession(new Request('http://shop.test/api/ops/me', { headers: { authorization: done.token } }), staffPool), null);
    const { rows: [left] } = await ownerPool.query('select round(extract(epoch from expires_at - created_at) / 3600) as h from staff_sessions where stage = $1 order by created_at desc limit 1', ['full']);
    assert.equal(Number(left.h), 8);

    // The next sign-in: password, then a code — each code once.
    const again = await signIn(staffPool, 'somchai', 'ม้าลายกินหญ้า-2026', ip);
    assert.equal(again.next, 'code');
    s = await session(again.token);
    assert.deepEqual(await checkCode(staffPool, s, codeAt(app.secret, stepAt(now)), ip, now), { ok: false, error: 'wrong' });
    s = await session(again.token);
    assert.equal((await checkCode(staffPool, s, codeAt(app.secret, stepAt(now) + 1), ip, now + 30_000)).next, 'done');

    // Its own new password needs the current one; the account's other browsers are signed out.
    assert.deepEqual(await changePassword(staffPool, full, { current: 'nope', password: 'อีกรหัสหนึ่งที่ยาวพอ' }, ip), { ok: false, error: 'wrong' });
    assert.deepEqual(await changePassword(staffPool, await session(done.token), { current: 'ม้าลายกินหญ้า-2026', password: 'อีกรหัสหนึ่งที่ยาวพอ' }, ip), { ok: true, next: 'done' });
    assert.ok(await session(done.token));
    await signOut(staffPool, await session(done.token), ip);
    assert.equal(await session(done.token), null);
    const log = (await ownerPool.query("select action from staff_log where login = 'somchai' order by id")).rows.map(r => r.action);
    assert.deepEqual(log, ['add', 'wrong-password', 'password', 'wrong-code', 'app-set-up', 'signed-in', 'wrong-code', 'signed-in', 'wrong-password', 'password', 'signed-out']);
  });

  test('ผิด 5 ครั้งล็อก 15 นาที · ปิดบัญชีแล้วหลุดทันที · ตั้งรหัสชั่วคราวใหม่แล้วต้องตั้งแอปใหม่ · ไม่ได้ใช้ 60 นาทีหลุด', async () => {
    const a = await addStaff(ownerPool, { login: 'nid', name: 'นิด', actor: 'owner' });
    const ip = where();
    for (let i = 0; i < 5; i++) assert.equal((await signIn(staffPool, 'nid', 'nope', ip)).error, 'wrong');
    assert.deepEqual(await signIn(staffPool, 'nid', a.password, ip), { ok: false, error: 'locked' });
    assert.equal((await ownerPool.query("select count(*)::int as n from staff_log where login = 'nid' and action = 'locked'")).rows[0].n, 1);
    await ownerPool.query("update staff set failed_logins = '{}' where login = 'nid'");

    // Set up, signed in; then turned off: out at once, and no way back in until on again.
    const first = await signIn(staffPool, 'nid', a.password, ip);
    await changePassword(staffPool, await session(first.token), { password: 'รหัสของนิดเองที่ยาวพอ' }, ip);
    const app = await appSetUp(staffPool, await session(first.token));
    const done = await checkCode(staffPool, await session(first.token), codeAt(app.secret, stepAt(Date.now())), ip);
    assert.ok(await session(done.token));
    await setStaffActive(ownerPool, 'nid', false, { actor: 'owner' });
    assert.equal(await session(done.token), null);
    assert.equal((await signIn(staffPool, 'nid', 'รหัสของนิดเองที่ยาวพอ', ip)).error, 'wrong');
    await setStaffActive(ownerPool, 'nid', true, { actor: 'owner' });
    const back = await signIn(staffPool, 'nid', 'รหัสของนิดเองที่ยาวพอ', ip);
    assert.equal(back.next, 'code');

    // A lost phone: a new temporary password, and the app set up again.
    const r = await resetStaff(ownerPool, 'nid', { actor: 'owner' });
    assert.equal(await session(back.token), null);
    assert.equal((await signIn(staffPool, 'nid', 'รหัสของนิดเองที่ยาวพอ', ip)).error, 'wrong');
    const fresh = await signIn(staffPool, 'nid', r.password, ip);
    assert.equal(fresh.next, 'password');
    assert.deepEqual(await changePassword(staffPool, await session(fresh.token), { password: 'รหัสใหม่ของนิดที่ยาวพอ' }, ip), { ok: true, next: 'app' });
    const app2 = await appSetUp(staffPool, await session(fresh.token));
    assert.notEqual(app2.secret, app.secret);
    const in2 = await checkCode(staffPool, await session(fresh.token), codeAt(app2.secret, stepAt(Date.now())), ip);
    assert.ok(await session(in2.token));

    // Idle for an hour: signed out. The password step lasts 10 minutes.
    await ownerPool.query("update staff_sessions set last_seen_at = now() - interval '61 minutes'");
    assert.equal(await session(in2.token), null);
    const step = await signIn(staffPool, 'nid', 'รหัสใหม่ของนิดที่ยาวพอ', ip);
    await ownerPool.query("update staff_sessions set expires_at = now() - interval '1 second' where stage = 'password'");
    assert.equal(await session(step.token), null);
  });

  test('เครื่องเดียวกรอกผิดเกิน 30 ครั้งใน 15 นาที ทุกบัญชีเข้าไม่ได้จากเครื่องนั้น', async () => {
    const a = await addStaff(ownerPool, { login: 'dam', name: 'ดำ', actor: 'owner' });
    const ip = where();
    for (let i = 0; i < 30; i++) await signIn(staffPool, `nobody${i}`, 'nope', ip);
    assert.deepEqual(await signIn(staffPool, 'dam', a.password, ip), { ok: false, error: 'locked' });
    assert.equal((await signIn(staffPool, 'dam', a.password, where())).next, 'password');
  });
});

describe('ส่งพร้อมกัน', () => {
  test('รหัส 6 หลักเดียวกันส่งพร้อมกันสองครั้ง ผ่านครั้งเดียว · กรอกผิดพร้อมกันนับครบทุกครั้ง', async () => {
    const a = await addStaff(ownerPool, { login: 'pair', name: 'คู่', actor: 'owner' });
    const ip = where();
    const first = await signIn(staffPool, 'pair', a.password, ip);
    await changePassword(staffPool, await session(first.token), { password: 'รหัสของคู่ที่ยาวพอแล้ว' }, ip);
    const app = await appSetUp(staffPool, await session(first.token));
    await checkCode(staffPool, await session(first.token), codeAt(app.secret, stepAt(Date.now())), ip);
    const [x, y] = await Promise.all([signIn(staffPool, 'pair', 'รหัสของคู่ที่ยาวพอแล้ว', ip), signIn(staffPool, 'pair', 'รหัสของคู่ที่ยาวพอแล้ว', ip)]);
    const [sx, sy] = [await session(x.token), await session(y.token)];
    const code = codeAt(app.secret, stepAt(Date.now()) + 1);
    const both = await Promise.all([checkCode(staffPool, sx, code, ip), checkCode(staffPool, sy, code, ip)]);
    assert.deepEqual(both.map(r => r.ok).sort(), [false, true]);

    await ownerPool.query("update staff set failed_logins = '{}' where login = 'pair'");
    await Promise.all([1, 2, 3, 4, 5].map(() => signIn(staffPool, 'pair', 'nope', where())));
    assert.equal((await ownerPool.query("select cardinality(failed_logins) as n from staff where login = 'pair'")).rows[0].n, 5);
    assert.deepEqual(await signIn(staffPool, 'pair', 'รหัสของคู่ที่ยาวพอแล้ว', where()), { ok: false, error: 'locked' });
  });
});
