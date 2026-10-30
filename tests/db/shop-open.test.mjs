// Opening a real shop and a forgotten password (server/lib/shop-open.ts, tools/shop-admin.mjs new / password):
// an empty shop with its owner's (HQ's) account and licence, the password kept only as a hash and logged nowhere,
// and a reset that ends the old password and the account's sessions.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { signInBiz, signInFranchise, userIdOf } from '../../server/lib/auth.ts';
import { startSession } from '../../server/lib/session.ts';
import { readMain } from '../../server/lib/storage.ts';
import { PILOT_YEARS, TRIAL_DAYS, addDays, addYears, today } from '../../server/lib/licence.ts';
import { openRealShop, resetPassword, temporaryPassword } from '../../server/lib/shop-open.ts';

let db, ownerPool, appPool;
const asApp = (shopId, fn) => withShop(appPool, shopId, '*', fn);

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

const garage = { pkg: 'biz', kind: 'trial', actor: 'staff-test', name: 'อู่ช่างแดง', owner: 'แดง ใจดี', taxId: '0105545001234',
  addr: '12 ถ.พหลโยธิน อ.เมือง ลำปาง', zip: '52000', tel: '081-234-5678', email: 'Daeng@Example.com', contact: 'คุณแดง 081-234-5678' };
const everything = async shopId => JSON.stringify((await ownerPool.query(
  "select data::text as d from records where shop_id = $1 union all select detail::text from licence_log where shop_id = $1", [shopId])).rows);

describe('เปิดร้านจริง (เครื่องมือทีมงาน)', () => {
  test('ร้านว่างไม่มีข้อมูลตัวอย่าง มีบัญชีเจ้าของร้านจากรหัสชั่วคราว วันทดลองใช้ 60 วัน และประวัติไม่มีรหัสผ่าน', async () => {
    const r = await openRealShop(ownerPool, { ...garage, code: 'daeng-garage' });
    assert.equal(r.user, 'daenggarage');
    assert.match(r.password, /^[A-HJ-NP-Za-km-np-z2-9]{10}$/);
    assert.deepEqual([r.start, r.end], [today(), addDays(today(), TRIAL_DAYS)]);
    const shop = (await ownerPool.query('select id, package, name from shops where code = $1', ['daeng-garage'])).rows[0];
    assert.deepEqual([shop.package, shop.name], ['biz', 'อู่ช่างแดง']);
    // No shop data but the owner account: the app makes the rest on the first opening.
    assert.equal(await asApp(shop.id, c => readMain(c, '', 'garage.v22')), null);
    const dgb = JSON.parse((await asApp(shop.id, c => readMain(c, '', 'dgb.v22'))).json);
    assert.deepEqual(dgb.shop, { code: 'DAENG-GARAGE', name: 'อู่ช่างแดง', owner: 'แดง ใจดี', taxId: '0105545001234', addr: '12 ถ.พหลโยธิน อ.เมือง ลำปาง',
      zip: '52000', tel: '081-234-5678', email: 'daeng@example.com', ownerUser: 'daenggarage', pass: dgb.shop.pass, created: today(), trialStart: today(),
      licensed: false, licEnd: '', payments: [], fillSettings: true });
    assert.notEqual(dgb.shop.pass, r.password);
    assert.equal((await everything(shop.id)).includes(r.password), false, 'the password is in no record and no log');
    // The owner signs in with it (by user name or e-mail); another password is refused.
    assert.equal((await asApp(shop.id, c => signInBiz(c, 'daenggarage', r.password))).ok, true);
    assert.equal((await asApp(shop.id, c => signInBiz(c, 'daeng@example.com', r.password))).ok, true);
    assert.equal((await asApp(shop.id, c => signInBiz(c, 'daenggarage', 'x' + r.password))).ok, false);
    const lic = (await ownerPool.query('select kind, starts_on::text as s, ends_on::text as e, contact from licences where shop_id = $1', [shop.id])).rows[0];
    assert.deepEqual(lic, { kind: 'trial', s: today(), e: addDays(today(), TRIAL_DAYS), contact: 'คุณแดง 081-234-5678' });
    const log = (await ownerPool.query('select actor, action, detail from licence_log where shop_id = $1', [shop.id])).rows;
    assert.deepEqual(log.map(x => [x.actor, x.action, x.detail.user, x.detail.kind]), [['staff-test', 'new', 'daenggarage', 'trial']]);
  });

  test('แฟรนไชส์: เครือว่างมีบัญชี HQ แพ็กเกจนำร่อง 1 ปีนับจากวันที่ระบุ', async () => {
    const r = await openRealShop(ownerPool, { ...garage, code: 'ev-chain', pkg: 'franchise', kind: 'pilot', from: '2026-11-01', name: 'เครือ EV ทดลอง' });
    assert.equal(r.user, 'hq');
    assert.deepEqual([r.start, r.end], ['2026-11-01', addYears('2026-11-01', PILOT_YEARS)]);
    const shop = (await ownerPool.query('select id from shops where code = $1', ['ev-chain'])).rows[0];
    const fr = JSON.parse((await asApp(shop.id, c => readMain(c, '', 'franchise.v22'))).json);
    assert.equal(fr.enabled, true);
    assert.equal(fr.org.name, 'เครือ EV ทดลอง');
    assert.deepEqual(fr.branches, []);
    assert.deepEqual(fr.accounts.map(a => [a.user, a.role, a.active]), [['hq', 'HQ', true]]);
    assert.equal((await asApp(shop.id, c => signInFranchise(c, 'HQ', r.password))).ok, true);
    assert.equal((await everything(shop.id)).includes(r.password), false);
  });

  test('รหัสร้านต้องเป็นตัวพิมพ์เล็ก ตัวเลข ขีด ไม่ซ้ำ และไม่ใช่ทางเข้าของระบบ ต้องมีชื่อร้านและชื่อเจ้าของ', async () => {
    await openRealShop(ownerPool, { ...garage, code: 'taken-1' });
    for (const [code, why] of [['taken-1', /exists already/], ['Big-Shop', /small letters/], ['ab', /small letters/], ['api', /not api/], ['demo-biz', /not api/]])
      await assert.rejects(openRealShop(ownerPool, { ...garage, code }), why);
    await assert.rejects(openRealShop(ownerPool, { ...garage, code: 'no-name', name: ' ' }), /name is required/);
    await assert.rejects(openRealShop(ownerPool, { ...garage, code: 'no-owner', owner: '' }), /owner is required/);
    assert.equal((await ownerPool.query("select count(*)::int as n from shops where code in ('no-name', 'no-owner')")).rows[0].n, 0);
  });
});

describe('ลืมรหัสผ่าน (เครื่องมือทีมงาน)', () => {
  test('รหัสใหม่ใช้ได้ รหัสเดิมใช้ไม่ได้ ที่กรอกผิดจนล็อกถูกล้าง session เดิมของบัญชีถูกปิด และบันทึกประวัติโดยไม่มีรหัส', async () => {
    const r = await openRealShop(ownerPool, { ...garage, code: 'forgot-1' });
    const shopId = (await ownerPool.query('select id from shops where code = $1', ['forgot-1'])).rows[0].id;
    for (let i = 0; i < 5; i++) await asApp(shopId, c => signInBiz(c, 'forgot1', 'wrong'));
    assert.match((await asApp(shopId, c => signInBiz(c, 'forgot1', r.password))).error, /รอ 15 นาที/);
    await asApp(shopId, async c => startSession(c, await userIdOf(c, { kind: 'owner', ref: '', branch: '' }), ''));
    const reset = await resetPassword(ownerPool, 'forgot-1', { actor: 'staff-test' });
    assert.equal(reset.user, 'forgot1');
    assert.notEqual(reset.password, r.password);
    assert.equal((await asApp(shopId, c => signInBiz(c, 'forgot1', reset.password))).ok, true, 'not locked out any more');
    assert.equal((await asApp(shopId, c => signInBiz(c, 'forgot1', r.password))).ok, false);
    assert.equal((await ownerPool.query('select count(*)::int as n from sessions where shop_id = $1', [shopId])).rows[0].n, 0);
    const log = (await ownerPool.query("select actor, detail from licence_log where shop_id = $1 and action = 'password'", [shopId])).rows;
    assert.deepEqual(log.map(x => [x.actor, x.detail]), [['staff-test', { user: 'forgot1' }]]);
    assert.equal((await everything(shopId)).includes(reset.password), false);
  });

  test('แฟรนไชส์: ตั้งรหัสใหม่ให้ HQ หรือบัญชีที่ระบุชื่อ ร้าน Biz ระบุชื่อผู้ใช้ไม่ได้ (พนักงานให้เจ้าของร้านตั้งในเมนู 10)', async () => {
    await openRealShop(ownerPool, { ...garage, code: 'forgot-chain', pkg: 'franchise' });
    const shopId = (await ownerPool.query('select id from shops where code = $1', ['forgot-chain'])).rows[0].id;
    const hq = await resetPassword(ownerPool, 'forgot-chain', { actor: 'staff-test' });
    assert.equal(hq.user, 'hq');
    assert.equal((await asApp(shopId, c => signInFranchise(c, 'hq', hq.password))).ok, true);
    assert.equal((await resetPassword(ownerPool, 'forgot-chain', { user: 'HQ', actor: 'staff-test' })).user, 'hq');
    await assert.rejects(resetPassword(ownerPool, 'forgot-chain', { user: 'b009', actor: 'staff-test' }), /no account b009/);
    await assert.rejects(resetPassword(ownerPool, 'forgot-1', { user: 'emp1', actor: 'staff-test' }), /menu 10/);
    await assert.rejects(resetPassword(ownerPool, 'no-such-shop', { actor: 'staff-test' }), /no shop with code/);
  });

  test('รหัสชั่วคราวสุ่มใหม่ทุกครั้ง ไม่มีตัวอักษรที่ดูคล้ายกัน', () => {
    const many = new Set(Array.from({ length: 200 }, () => temporaryPassword()));
    assert.equal(many.size, 200);
    for (const p of many) assert.doesNotMatch(p, /[0O1lI]/);
  });
});
