// Removing a shop at once at its own request (tools/shop-admin.mjs erase, server/lib/licence-admin.ts erase;
// the owner's decision of 2026-11-23): everything of the shop goes, its change history too; other shops are untouched;
// only the database owner can do it; one line without personal data stays in licence_log.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { erase, setContact } from '../../server/lib/licence-admin.ts';
import { makeBackup, readMain, writeMain } from '../../server/lib/storage.ts';
import { split } from '../../server/lib/units.ts';

process.env.DRIVEGO_TODAY = '2026-10-13';
process.env.DRIVEGO_TEST_SERVER = '1';

let db, ownerPool, n = 0;
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));
const licence = { kind: 'trial', start: '2026-10-01', end: '2026-11-30' };
const shop = async () => {
  const code = `e-${++n}`;
  const { shopId } = await createShop(ownerPool, { code, pkg: 'biz', data: fixture('biz-trial'), licence });
  return { shopId, code };
};
// Rows of every table with a shop_id that belong to the shop (as the owner, through the shop's own RLS context).
const rowsOf = async shopId => withShop(ownerPool, shopId, '*', async c => {
  const { rows: tables } = await c.query(
    "select distinct table_name as t from information_schema.columns where table_schema = 'public' and column_name = 'shop_id' and table_name <> 'licence_log'");
  let total = 0;
  for (const { t } of tables) total += Number((await c.query(`select count(*) as n from "${t}" where shop_id = $1`, [shopId])).rows[0].n);
  return total;
});

before(async () => {
  db = await startTempPostgres();
  await migrate(db.url);
  ownerPool = new pg.Pool({ connectionString: db.url });
  // The staff web page's role, as DigitalOcean makes it (tests/db/staff.test.mjs), with its rights from the migrations.
  await ownerPool.query('create role drivego_staff login');
  await ownerPool.query('select drivego_staff_grants()');
});
after(async () => {
  await ownerPool?.end();
  await db?.stop();
});

describe('ลบทั้งร้านทันทีตามคำขอของร้าน', () => {
  test('ข้อมูล จุดสำรอง ประวัติการแก้ไข ข้อผิดพลาด และประวัติการดูแลร้านหายทั้งหมด ร้านอื่นไม่ถูกแตะ เหลือบรรทัดเดียวว่าลบเมื่อไรโดยใคร', async () => {
    const a = await shop(), b = await shop();
    await setContact(ownerPool, a.code, { contact: 'คุณแดง 081-234-5678', actor: 'test' });
    await withShop(ownerPool, a.shopId, '', async c => {
      // One save (so the change history has a row) and a backup point.
      const main = await readMain(c, '', 'garage.v22');
      const db0 = JSON.parse(main.json);
      db0.cust[0].name = 'แก้ชื่อลูกค้า';
      const now = split('garage.v22', JSON.stringify(db0)), was = split('garage.v22', main.json);
      const upsert = now.rows.filter(r => !was.rows.some(w => w.unit === r.unit && w.key === r.key && w.data === r.data));
      assert.ok((await writeMain(c, '', 'garage.v22', main.versions, { upsert, remove: [], order: {} })).ok);
      assert.ok(await makeBackup(c, '', 'garage.v22.bak.2026-10-13'));
    });
    await ownerPool.query("insert into errors (source, shop_id, message) values ('browser', $1, 'x'), ('browser', $2, 'y')", [a.shopId, b.shopId]);
    const changes = async id => Number((await withShop(ownerPool, id, '*', c => c.query('select count(*) as n from change_log where shop_id = app_shop()'))).rows[0].n);
    assert.ok(await changes(a.shopId) > 0);
    const bBefore = await rowsOf(b.shopId);

    await assert.rejects(erase(ownerPool, a.code, { actor: 'test', confirm: 'e-wrong' }), /--confirm/);
    const r = await erase(ownerPool, a.code, { actor: 'admin', confirm: a.code, note: 'ร้านขอลบ' });
    assert.equal(r.code, a.code);
    assert.ok(r.tables.records > 0 && r.tables.change_log > 0 && r.tables.backups === 1);

    assert.equal((await ownerPool.query('select count(*)::int as n from shops where id = $1', [a.shopId])).rows[0].n, 0);
    assert.equal(await rowsOf(a.shopId), 0);
    assert.equal((await ownerPool.query('select count(*)::int as n from errors where shop_id = $1', [a.shopId])).rows[0].n, 0);
    const log = (await ownerPool.query('select shop_code, actor, action, detail::text as d from licence_log where shop_id = $1', [a.shopId])).rows;
    assert.deepEqual(log.map(l => [l.shop_code, l.actor, l.action]), [[a.code, 'admin', 'erase']]);
    assert.ok(!log[0].d.includes('081-234-5678'), 'no contact left in the log');

    assert.equal(await rowsOf(b.shopId), bBefore);
    assert.equal((await ownerPool.query('select count(*)::int as n from errors where shop_id = $1', [b.shopId])).rows[0].n, 1);
  });

  test('ร้านที่ไม่มีอยู่ หรือพิมพ์รหัสร้านยืนยันไม่ตรง ไม่มีอะไรถูกลบ', async () => {
    const a = await shop();
    await assert.rejects(erase(ownerPool, 'e-none', { actor: 'test', confirm: 'e-none' }));
    await assert.rejects(erase(ownerPool, a.code, { actor: 'test', confirm: '' }), /--confirm/);
    assert.equal((await ownerPool.query('select count(*)::int as n from shops where id = $1', [a.shopId])).rows[0].n, 1);
  });

  test('ระบบของร้านและบัญชีของหน้าเว็บทีมงานลบร้านไม่ได้', async () => {
    const a = await shop();
    for (const role of ['drivego_app', 'drivego_staff']) {
      const c = await ownerPool.connect();
      try {
        await c.query('begin');
        await c.query(`set local role ${role}`);
        await assert.rejects(c.query('delete from shops where id = $1', [a.shopId]), /permission denied/);
      } finally { await c.query('rollback'); c.release(); }
    }
    assert.equal((await ownerPool.query('select count(*)::int as n from shops where id = $1', [a.shopId])).rows[0].n, 1);
  });
});
