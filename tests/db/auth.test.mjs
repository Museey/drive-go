// Sign-in on the server (task T7): the same decisions and messages as the
// legacy app (checked end to end by scenarios S101/S102 against its goldens),
// passwords kept only as hashes, lockout (Q2) and sessions ended when an
// account changes (Q2).
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { checkPassword, endStaleSessions, signInBiz, signInFranchise, storeSecrets, userIdOf } from '../../server/lib/auth.ts';
import { startSession } from '../../server/lib/session.ts';
import { readMain, writeMain } from '../../server/lib/storage.ts';
import { SECRET_PLACEHOLDER, diff, split } from '../../server/lib/units.ts';

let db, ownerPool, appPool, n = 0;
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));
const asApp = (shopId, scope, fn) => withShop(appPool, shopId, scope, fn);
const newShop = (name, pkg) => createShop(ownerPool, { code: `A-${++n}`, pkg, data: fixture(name) });

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

// Changes one main key the way the browser would: edit the parsed data, send the row changes.
async function change(shopId, scope, branch, key, edit) {
  return asApp(shopId, scope, async c => {
    const got = await readMain(c, branch, key);
    const v = JSON.parse(got.json);
    edit(v);
    const before = split(key, got.json), next = split(key, JSON.stringify(v));
    const r = await writeMain(c, branch, key, got.versions, diff(before, next));
    assert.ok(r.ok);
    return storeSecrets(c, branch, next.secrets);
  });
}

describe('Biz / ProX', () => {
  test('เจ้าของร้านเข้าได้ด้วยชื่อผู้ใช้หรืออีเมล ตัวพิมพ์ใดก็ได้ และรหัสต้องตรง', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const r = await asApp(shopId, '*', async c => ({
      user: await signInBiz(c, 'DG1688', '123456'),
      email: await signInBiz(c, ' demo@example.com ', '123456'),
      wrong: await signInBiz(c, 'dg1688', '12345'),
      nobody: await signInBiz(c, 'someone', '123456'),
    }));
    assert.deepEqual(r.user, { ok: true, account: { kind: 'owner', ref: '', branch: '' }, scope: '' });
    assert.equal(r.email.ok, true);
    assert.deepEqual(r.wrong, { ok: false, error: 'รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง' });
    assert.deepEqual(r.nobody, { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  });

  test('พนักงาน: ยังไม่มีบัญชี, มีบัญชี, รหัสผิด, ถูกระงับ, เบอร์ซ้ำ ได้ข้อความเดียวกับระบบเดิม', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const signIn = (u, p) => asApp(shopId, '*', c => signInBiz(c, u, p));
    assert.deepEqual(await signIn('092-333-4455', '8888'), { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    await change(shopId, '', '', 'garage.v22', v => { const e = v.emp.find(x => x.code === 'EMP008'); e.dgbPass = '8888'; e.dgbActive = true; });
    const ok = await signIn('0923334455', '8888');
    assert.equal(ok.ok, true);
    assert.equal(ok.account.kind, 'emp');
    assert.deepEqual(await signIn('092-333-4455', '9999'), { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' });
    await change(shopId, '', '', 'garage.v22', v => { v.emp.find(x => x.code === 'EMP008').dgbActive = false; });
    assert.deepEqual(await signIn('092-333-4455', '8888'), { ok: false, error: 'บัญชีนี้ถูกระงับการใช้งาน — ติดต่อเจ้าของร้าน' });
    await change(shopId, '', '', 'garage.v22', v => {
      v.emp.find(x => x.code === 'EMP008').dgbActive = true;
      const other = v.emp.find(x => x.code === 'EMP009'); other.tel = '092-333-4455'; other.dgbPass = '1111';
    });
    assert.deepEqual(await signIn('092-333-4455', '8888'), { ok: false, error: 'ข้อมูลเข้าสู่ระบบซ้ำกัน กรุณาให้ผู้ดูแลแก้ไขบัญชีก่อน' });
  });

  test('รหัสผ่านอยู่บน server เป็น hash เท่านั้น ข้อมูลร้านมีแค่ค่าแทน', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const rows = await asApp(shopId, '', c => c.query("select data::text as d from records where data::text like '%123456%'"));
    assert.equal(rows.rowCount, 0);
    const shop = JSON.parse((await asApp(shopId, '', c => readMain(c, '', 'dgb.v22'))).json).shop;
    assert.equal(shop.pass, SECRET_PLACEHOLDER);
    const u = await ownerPool.query("select password_hash from users where shop_id = $1 and kind = 'owner'", [shopId]);
    assert.match(u.rows[0].password_hash, /^\$argon2id\$/);
  });

  test('เปลี่ยนรหัสเจ้าของ: รหัสเก่าใช้ไม่ได้ รหัสใหม่ใช้ได้ และเครื่องอื่นของบัญชีนั้นออกจากระบบ (Q2)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const owner = { kind: 'owner', ref: '', branch: '' };
    const [mine, other] = await asApp(shopId, '', async c => {
      const id = await userIdOf(c, owner);
      return [await startSession(c, id, ''), await startSession(c, id, '')];
    });
    const changed = await change(shopId, '', '', 'dgb.v22', v => { v.shop.pass = 'drive2026'; });
    assert.equal(changed.length, 1);
    await asApp(shopId, '', c => endStaleSessions(c, 'biz', null, changed).then(() => {}));
    const left = await ownerPool.query('select count(*)::int as n from sessions where shop_id = $1', [shopId]);
    assert.equal(left.rows[0].n, 0, `${mine.token} ${other.token}`);
    const r = await asApp(shopId, '*', async c => [await signInBiz(c, 'dg1688', '123456'), await signInBiz(c, 'dg1688', 'drive2026')]);
    assert.equal(r[0].ok, false);
    assert.equal(r[1].ok, true);
  });

  test('กรอกรหัสผิด 5 ครั้งใน 15 นาที ต้องรอ แม้ครั้งที่ 6 จะกรอกถูก (Q2)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    for (let i = 0; i < 5; i++) assert.equal((await asApp(shopId, '*', c => signInBiz(c, 'dg1688', 'nope'))).ok, false);
    assert.deepEqual(await asApp(shopId, '*', c => signInBiz(c, 'dg1688', '123456')),
      { ok: false, error: 'กรอกรหัสผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่' });
    await ownerPool.query("update users set failed_logins = array[now() - interval '16 minutes'] where shop_id = $1", [shopId]);
    assert.equal((await asApp(shopId, '*', c => signInBiz(c, 'dg1688', '123456'))).ok, true);
  });
});

describe('Franchise', () => {
  test('HQ, หัวหน้าสาขา, พนักงานสาขา เข้าได้ตามขอบเขตสาขาของตัวเอง', async () => {
    const { shopId } = await newShop('franchise-trial', 'franchise');
    const r = await asApp(shopId, '*', async c => ({
      hq: await signInFranchise(c, 'HQ', '1234'),
      b001: await signInFranchise(c, 'b001', '1234'),
      b002: await signInFranchise(c, 'b002', '1234'),
      staff: await signInFranchise(c, 'staff001', '5678'),
      wrong: await signInFranchise(c, 'hq', '9999'),
    }));
    assert.equal(r.hq.scope, '*');
    assert.equal(r.b001.scope, 'B001');
    assert.equal(r.b002.scope, 'B002');
    assert.equal(r.staff.scope, 'B001');
    assert.deepEqual(r.wrong, { ok: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  });

  test('ระงับบัญชีและสาขา: ข้อความตามระบบเดิม และ session ที่ค้างอยู่ถูกปิด (Q2)', async () => {
    const { shopId } = await newShop('franchise-trial', 'franchise');
    const staff = await asApp(shopId, '*', async c => {
      const s = await signInFranchise(c, 'staff001', '5678');
      return startSession(c, await userIdOf(c, s.account), s.scope);
    });
    await change(shopId, '*', '', 'franchise.v22', v => { v.accounts.find(a => a.user === 'staff001').active = false; });
    await asApp(shopId, '*', c => endStaleSessions(c, 'franchise', null, []));
    const left = await ownerPool.query('select count(*)::int as n from sessions where shop_id = $1', [shopId]);
    assert.equal(left.rows[0].n, 0, staff.token);
    assert.deepEqual(await asApp(shopId, '*', c => signInFranchise(c, 'staff001', '5678')),
      { ok: false, error: 'บัญชีนี้ถูกระงับการใช้งาน — ติดต่อหัวหน้าสาขา' });
    await change(shopId, '*', '', 'franchise.v22', v => { v.branches.find(b => b.id === 'B002').active = false; });
    assert.deepEqual(await asApp(shopId, '*', c => signInFranchise(c, 'b002', '1234')),
      { ok: false, error: 'สาขานี้ถูกระงับการใช้งานโดย HQ' });
    await change(shopId, '*', '', 'franchise.v22', v => { v.accounts.find(a => a.user === 'b001').active = false; });
    assert.deepEqual(await asApp(shopId, '*', c => signInFranchise(c, 'b001', '1234')),
      { ok: false, error: 'รหัสนี้ถูกระงับการใช้งานโดย HQ — ติดต่อสำนักงานใหญ่' });
  });

  test('ทางเข้าแบบเก่า <หัวหน้าสาขา>.<รหัสพนักงาน> + PIN', async () => {
    const { shopId } = await newShop('franchise-trial', 'franchise');
    const signIn = (u, p) => asApp(shopId, '*', c => signInFranchise(c, u, p));
    assert.deepEqual(await signIn('b009.EMP001', '1'), { ok: false, error: 'ไม่พบรหัสสาขา "b009" — ส่วนหน้าจุดต้องเป็นรหัสสาขา เช่น b001.EMP001' });
    assert.deepEqual(await signIn('b001.EMP999', '1'), { ok: false, error: 'ไม่พบรหัสพนักงาน "EMP999" ในสาขา B001 — ตรวจสอบรหัสในเมนู 10 ส่วนที่ 2' });
    assert.deepEqual(await signIn('b001.EMP001', '1'), { ok: false, error: 'พนักงานคนนี้ยังไม่ได้ตั้งรหัส PIN — ให้หัวหน้าสาขา (HB) ตั้งให้ในเมนู 10 ก่อน' });
    await change(shopId, '*', 'B001', 'garage.v22', v => { v.emp.find(x => x.code === 'EMP001').pin = '4321'; });
    assert.deepEqual(await signIn('b001.EMP001', '1111'), { ok: false, error: 'รหัสผ่าน (PIN) ไม่ถูกต้อง' });
    const ok = await signIn('B001.emp001', '4321');
    assert.equal(ok.ok, true);
    assert.equal(ok.scope, 'B001');
    assert.equal(await asApp(shopId, 'B001', c => checkPassword(c, ok.account, 'pin', '4321')), 'ok');
  });
});
