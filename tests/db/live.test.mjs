// Every device sees the others' changes at once (task 3.10): each save is announced when it commits, a device hears
// only the saves its branch scope reaches, and reads the changed rows with what it may not see left out.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { entriesSince, liveCursor } from '../../server/lib/live.ts';
import { readMain, readRows, saveMain, writeMain } from '../../server/lib/storage.ts';
import { masksFor } from '../../server/lib/visibility.ts';

let db, ownerPool, appPool;
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

let n = 0;
const newShop = (name, pkg) => createShop(ownerPool, { code: `L-${++n}`, pkg, data: fixture(name) });
const versionsOf = (shopId, scope, branch, key) => asApp(shopId, scope, async c => (await readMain(c, branch, key)).versions);
const stock = async (shopId) => JSON.parse((await asApp(shopId, '', c => readMain(c, '', 'garage.v22'))).json).stock;

describe('ประกาศการบันทึก (0006_live.sql)', () => {
  test('การบันทึกที่สำเร็จประกาศทางช่อง drivego_live เมื่อ commit พร้อมร้าน สาขา และเลขรายการ ส่วนที่ยกเลิกไม่ประกาศ', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const listen = new pg.Client({ connectionString: db.url.replace('//drivego@', '//drivego_app@') });
    await listen.connect();
    const heard = [];
    listen.on('notification', m => heard.push(JSON.parse(m.payload)));
    await listen.query('listen drivego_live');
    try {
      const v = await versionsOf(shopId, '', '', 'garage.v22');
      const s0 = (await stock(shopId))[0];
      const r = await asApp(shopId, '', c => saveMain(c, '', 'garage.v22', { [`DB.stock|${s0.id}`]: v[`DB.stock|${s0.id}`] },
        { upsert: [{ unit: 'DB.stock', key: s0.id, data: JSON.stringify({ ...s0, name: 'x' }) }], remove: [], order: {} }));
      assert.equal(r.ok, true);
      assert.equal(typeof r.logId, 'number');
      // a save rolled back is not heard
      await asApp(shopId, '', async c => {
        await writeMain(c, '', 'garage.v22', {}, { upsert: [{ unit: 'DB.vendors', key: 'tmp', data: '{"id":"tmp"}' }], remove: [], order: {} });
        await c.query('select 1/0');
      }).catch(() => {});
      for (let i = 0; i < 50 && !heard.length; i++) await new Promise(res => setTimeout(res, 20));
      await new Promise(res => setTimeout(res, 100));
      assert.deepEqual(heard, [{ shop: shopId, branch: '', id: r.logId }]);
    } finally {
      await listen.end();
    }
  });
});

describe('สิ่งที่แต่ละเครื่องได้ยิน (server/lib/live.ts)', () => {
  test('รายการบอกแถวที่เขียนพร้อมรุ่นใหม่ แถวที่ลบ หน่วยที่เรียงใหม่ ใครบันทึก และการแทนที่ทั้งชุด', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const start = await asApp(shopId, '', c => liveCursor(c));
    const v = await versionsOf(shopId, '', '', 'garage.v22');
    const [a, b] = await stock(shopId);
    const owner = (await ownerPool.query("select id from users where shop_id = $1 and kind = 'owner'", [shopId])).rows[0].id;
    const r = await asApp(shopId, '', c => saveMain(c, '', 'garage.v22', { [`DB.stock|${a.id}`]: v[`DB.stock|${a.id}`], [`DB.stock|${b.id}`]: v[`DB.stock|${b.id}`] },
      { upsert: [{ unit: 'DB.stock', key: a.id, data: JSON.stringify({ ...a, qty: 1 }) }], remove: [{ unit: 'DB.stock', key: b.id }],
        order: { 'DB.vendors': [] } }, {}, owner, 'wipe'));
    const [e] = await asApp(shopId, '', c => entriesSince(c, start, 10));
    assert.equal(e.id, r.logId);
    assert.equal(e.key, 'garage.v22');
    assert.deepEqual(e.rows, [['DB.stock', a.id, v[`DB.stock|${a.id}`] + 1]]);
    assert.deepEqual(e.removed, [['DB.stock', b.id]]);
    assert.deepEqual(e.ordered, ['DB.vendors']);
    assert.deepEqual(e.by, { kind: 'owner', ref: '' });
    assert.equal(e.whole, 'wipe');
    assert.equal(await asApp(shopId, '', c => liveCursor(c)), r.logId);
  });

  test('แฟรนไชส์: สาขา B001 ได้ยินการบันทึกของตัวเองและระดับเครือ ไม่ได้ยินของ HQ หรือสาขาอื่น HQ ได้ยินทุกสาขา', async () => {
    const { shopId } = await newShop('franchise-trial', 'franchise');
    const start = await asApp(shopId, '*', c => liveCursor(c));
    const put = (branch, key, unit, id) => asApp(shopId, '*', c => writeMain(c, branch, key, {},
      { upsert: [{ unit, key: id, data: JSON.stringify({ id }) }], remove: [], order: {} }));
    await put('B001', 'garage.v22', 'DB.vendors', 'v-b1');
    await put('HQ', 'garage.v22::HQ', 'DB.vendors', 'v-hq');
    await put('', 'franchise.v22', 'FR.reqs', 'r-chain');
    const heard = async scope => (await asApp(shopId, scope, c => entriesSince(c, start, 10))).map(e => `${e.branch || '-'}:${e.rows[0][1]}`);
    assert.deepEqual(await heard('B001'), ['B001:v-b1', '-:r-chain']);
    assert.deepEqual(await heard('*'), ['B001:v-b1', 'HQ:v-hq', '-:r-chain']);
  });
});

describe('อ่านแถวที่เปลี่ยน (readRows)', () => {
  test('ได้ข้อมูลและรุ่นของแถวที่ขอ แถวที่ไม่มีแล้ว ลำดับทั้งหน่วยที่ขอ ทุนถูกเว้นไว้สำหรับคนที่ไม่เห็นทุน ไม่ได้แถวนอกข้อมูลชุดนั้น', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const [a] = await stock(shopId);
    const noCost = masksFor({ owner: false, pay: false, cost: false, self: '' });
    const got = await asApp(shopId, '', c => readRows(c, '', 'garage.v22', [['DB.stock', a.id], ['DB.stock', 'nope'], ['FR.reqs', 'x']], ['DB.coa'], noCost));
    assert.deepEqual(got.rows.map(r => [r.unit, r.key, r.version]), [['DB.stock', a.id, 1]]);
    assert.equal(JSON.parse(got.rows[0].data).cost, null);
    assert.ok(a.cost > 0, 'the stored record has a cost');
    assert.deepEqual(got.gone, [['DB.stock', 'nope']]);
    assert.ok(got.order['DB.coa'].length > 10);
    assert.deepEqual(Object.keys(got.order), ['DB.coa']);
    const all = await asApp(shopId, '', c => readRows(c, '', 'garage.v22', [['DB.stock', a.id]], [], []));
    assert.equal(JSON.parse(all.rows[0].data).cost, a.cost);
  });
});
