// Shop and branch isolation in the database itself (Phase 2, task T3):
// whatever the server code does, the app's database role must never reach
// another shop's rows, nor another branch's within a franchise chain.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';

let db, owner, appUrl;
const shops = {};

// Runs fn as the web app would: the app's role, inside one transaction with
// the shop and branch scope set. Rolls back so tests do not see each other's rows.
async function asApp(shop, scope, fn, { commit = false } = {}) {
  const c = new pg.Client({ connectionString: appUrl });
  await c.connect();
  try {
    await c.query('begin');
    if (shop) await c.query("select set_config('app.shop_id', $1, true), set_config('app.branch_scope', $2, true)", [shops[shop], scope]);
    const r = await fn(c);
    await c.query(commit ? 'commit' : 'rollback');
    return r;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    await c.end();
  }
}
const put = (c, shop, branch, unit, key, data) => c.query(
  'insert into records (shop_id, branch_id, unit, key, pos, data) values ($1, $2, $3, $4, 1, $5)', [shops[shop], branch, unit, key, JSON.stringify(data)]);
const keys = async (c, sql = 'select shop_id, branch_id, key from records order by key') =>
  (await c.query(sql)).rows.map(r => `${Object.keys(shops).find(k => shops[k] === r.shop_id)}/${r.branch_id || '-'}/${r.key}`);

before(async () => {
  db = await startTempPostgres();
  await migrate(db.url);
  appUrl = db.url.replace('//drivego@', '//drivego_app@');
  owner = new pg.Client({ connectionString: db.url });
  await owner.connect();
  for (const [name, code, pkg] of [['A', 'SHOP-A', 'biz'], ['B', 'SHOP-B', 'biz'], ['F', 'CHAIN-F', 'franchise']])
    shops[name] = (await owner.query('insert into shops (code, package) values ($1, $2) returning id', [code, pkg])).rows[0].id;
  // Each shop's rows are written through the app role, as the server will.
  await asApp('A', '', c => put(c, 'A', '', 'DB.cust', 'a1', { name: 'ลูกค้าของ A' }), { commit: true });
  await asApp('B', '', c => put(c, 'B', '', 'DB.cust', 'b1', { name: 'ลูกค้าของ B' }), { commit: true });
  await asApp('F', '*', async c => {
    await put(c, 'F', '', 'FR.reqs', 'f-chain', {});
    for (const br of ['HQ', 'B001', 'B002']) await put(c, 'F', br, 'DB.cust', `f-${br}`, {});
  }, { commit: true });
});

after(async () => {
  await owner?.end();
  await db?.stop();
});

describe('แยกข้อมูลระหว่างอู่', () => {
  test('ทุกตารางที่มีข้อมูลของอู่ (มีคอลัมน์ shop_id) ผ่าน Row-Level Security และแยกสาขาด้วยถ้ามี branch_id', async () => {
    const { rows } = await owner.query(`
      select c.relname as t, c.relrowsecurity as rls, c.relforcerowsecurity as forced,
             exists (select from information_schema.columns b where b.table_name = c.relname and b.column_name = 'branch_id') as branched,
             exists (select from pg_policies p where p.tablename = c.relname and p.policyname = 'branch_only') as branch_policy
        from pg_class c join information_schema.columns s on s.table_name = c.relname and s.column_name = 'shop_id'
       where c.relkind = 'r' and c.relnamespace = 'public'::regnamespace order by 1`);
    assert.ok(rows.length >= 9);
    // sessions only: not forced for the tables' owner, which session_lookup() runs as (0001_core.sql).
    for (const r of rows) {
      assert.ok(r.rls && (r.forced || r.t === 'sessions'), `${r.t}: row level security`);
      if (r.branched) assert.ok(r.branch_policy, `${r.t}: branch policy`);
    }
  });

  test('อู่ A เห็นเฉพาะข้อมูลของตัวเอง แม้จะค้นทั้งตารางหรือค้นด้วย id ของอู่ B', async () => {
    assert.deepEqual(await asApp('A', '', c => keys(c)), ['A/-/a1']);
    assert.equal((await asApp('A', '', c => c.query('select * from records where shop_id = $1', [shops.B]))).rowCount, 0);
  });

  test('อู่ A เขียนแถวในนามอู่ B ไม่ได้', async () => {
    await assert.rejects(asApp('A', '', c => put(c, 'B', '', 'DB.cust', 'x', {})), /row-level security/);
  });

  test('อู่ A แก้หรือลบแถวของอู่ B ไม่ได้', async () => {
    const r = await asApp('A', '', async c => ({
      upd: (await c.query("update records set data = '{}' where shop_id = $1", [shops.B])).rowCount,
      del: (await c.query('delete from records where shop_id = $1', [shops.B])).rowCount,
      move: (await c.query('update records set shop_id = $1 where shop_id = $2', [shops.B, shops.A]).catch(e => e)).message,
    }), { commit: true });
    assert.equal(r.upd, 0);
    assert.equal(r.del, 0);
    assert.match(r.move, /row-level security/);
    assert.equal((await owner.query("select data::text from records where key = 'b1'")).rows[0].data, '{"name":"ลูกค้าของ B"}');
  });

  test('ลืมตั้งค่าร้าน = error ไม่ใช่เห็นทุกร้าน (รวมการเชื่อมต่อที่ใช้ซ้ำหลังจบ transaction)', async () => {
    // Either setting may be the first one the policies read; both fail.
    await assert.rejects(asApp(null, null, c => c.query('select * from records')), /unrecognized configuration parameter "app\.(shop_id|branch_scope)"/);
    const c = new pg.Client({ connectionString: appUrl });
    await c.connect();
    try {
      await c.query('begin');
      await c.query("select set_config('app.shop_id', $1, true), set_config('app.branch_scope', '', true)", [shops.A]);
      await c.query('commit');
      await assert.rejects(c.query('select * from records'), /invalid input syntax for type uuid/);
    } finally { await c.end(); }
  });

  test('role ของแอปปิด row security หรือข้าม RLS ไม่ได้', async () => {
    await assert.rejects(asApp('A', '', async c => { await c.query('set local row_security = off'); return c.query('select * from records'); }),
      /row-level security/);
    const r = (await owner.query("select rolsuper, rolbypassrls from pg_roles where rolname = 'drivego_app'")).rows[0];
    assert.deepEqual(r, { rolsuper: false, rolbypassrls: false });
  });

  test('แอปอ่านรายชื่อร้านได้ แต่สร้างหรือแก้ร้านไม่ได้', async () => {
    assert.equal((await asApp('A', '', c => c.query('select code from shops'))).rowCount, 3);
    await assert.rejects(asApp('A', '', c => c.query("insert into shops (code, package) values ('X-1', 'biz')")), /permission denied/);
    await assert.rejects(asApp('A', '', c => c.query("update shops set status = 'suspended'")), /permission denied/);
  });

  test('ตารางอื่นของอู่ก็แยกด้วย (บัญชี ชื่อเข้าระบบ session จุดสำรอง blob ประวัติการบันทึก ประวัติการเปลี่ยนแปลง ตัวนับเลขที่)', async () => {
    const uid = await asApp('B', '', async c => {
      const u = (await c.query("insert into users (shop_id, kind) values ($1, 'owner') returning id", [shops.B])).rows[0].id;
      await c.query("insert into logins (shop_id, login, user_id) values ($1, 'dg1688', $2)", [shops.B, u]);
      await c.query("insert into sessions (id_hash, shop_id, user_id, branch_scope, expires_at) values ('\\x01', $1, $2, '', now() + interval '1 day')", [shops.B, u]);
      await c.query("insert into blobs (shop_id, key, value) values ($1, 'dgb.guide.v22', '1')", [shops.B]);
      await c.query("insert into backups (shop_id, key, data) values ($1, 'garage.v22.bak.2026-10-13', '\\x00')", [shops.B]);
      await c.query("insert into write_log (shop_id, units) values ($1, '[]')", [shops.B]);
      await c.query("insert into change_log (shop_id, store_key, unit, key, op, after) values ($1, 'garage.v22', 'DB.cust', 'b1', 'insert', '{}')", [shops.B]);
      await c.query("insert into doc_counters (shop_id, base, last) values ($1, 'MA-SA2610', 9)", [shops.B]);
      return u;
    }, { commit: true });
    const seen = await asApp('A', '', async c => {
      const out = {};
      for (const t of ['users', 'logins', 'sessions', 'blobs', 'backups', 'write_log', 'change_log', 'doc_counters']) out[t] = (await c.query(`select * from ${t}`)).rowCount;
      return out;
    });
    assert.deepEqual(seen, { users: 0, logins: 0, sessions: 0, blobs: 0, backups: 0, write_log: 0, change_log: 0, doc_counters: 0 });
    assert.ok(uid);
  });

  test('ประวัติการเปลี่ยนแปลง (3.1): แอปเพิ่มและอ่านได้ แต่แก้หรือลบไม่ได้ แม้เป็นของอู่ตัวเอง', async () => {
    await asApp('A', '', c => c.query("insert into change_log (shop_id, store_key, unit, key, op, after) values ($1, 'garage.v22', 'DB.cust', 'a1', 'insert', '{}')", [shops.A]), { commit: true });
    assert.equal((await asApp('A', '', c => c.query('select * from change_log'))).rowCount, 1);
    await assert.rejects(asApp('A', '', c => c.query("update change_log set after = '{\"name\":\"แก้ประวัติ\"}'")), /permission denied/);
    await assert.rejects(asApp('A', '', c => c.query('delete from change_log')), /permission denied/);
  });

  test('ตัวนับเลขที่ (3.2): แอปเพิ่มและเลื่อนขึ้นได้ แต่ลดหรือลบไม่ได้ แม้เป็นของอู่ตัวเอง', async () => {
    await asApp('A', '', c => c.query("insert into doc_counters (shop_id, base, last) values ($1, 'MA-RE2610', 5)", [shops.A]), { commit: true });
    await asApp('A', '', c => c.query("update doc_counters set last = 6 where base = 'MA-RE2610'"), { commit: true });
    assert.equal((await asApp('A', '', c => c.query("select last from doc_counters where base = 'MA-RE2610'"))).rows[0].last, 6);
    await assert.rejects(asApp('A', '', c => c.query("update doc_counters set last = 1 where base = 'MA-RE2610'")), /cannot go back from 6 to 1/);
    await assert.rejects(asApp('A', '', c => c.query('delete from doc_counters')), /permission denied/);
  });
});

describe('แยกข้อมูลระหว่างสาขาในเครือเดียวกัน', () => {
  test('สาขา B001 เห็นข้อมูลของตัวเองและข้อมูลระดับเครือ ไม่เห็น HQ หรือ B002', async () => {
    assert.deepEqual(await asApp('F', 'B001', c => keys(c)), ['F/B001/f-B001', 'F/-/f-chain']);
  });

  test('HQ เห็นทุกสาขา', async () => {
    assert.deepEqual(await asApp('F', '*', c => keys(c)), ['F/B001/f-B001', 'F/B002/f-B002', 'F/HQ/f-HQ', 'F/-/f-chain']);
  });

  test('สาขา B001 เขียนลงสาขาอื่นไม่ได้ และย้ายแถวของตัวเองไปสาขาอื่นไม่ได้', async () => {
    await assert.rejects(asApp('F', 'B001', c => put(c, 'F', 'B002', 'DB.cust', 'x', {})), /row-level security/);
    await assert.rejects(asApp('F', 'B001', c => c.query("update records set branch_id = 'B002' where branch_id = 'B001'")), /row-level security/);
  });

  test('ลืมตั้งค่าสาขา = error', async () => {
    await assert.rejects(asApp(null, null, async c => {
      await c.query("select set_config('app.shop_id', $1, true)", [shops.F]);
      return c.query('select * from records');
    }), /app\.branch_scope/);
  });
});

describe('session', () => {
  test('หา session ได้จาก hash ของ token ที่ตรงและยังไม่หมดอายุเท่านั้น', async () => {
    const c = new pg.Client({ connectionString: appUrl });
    await c.connect();
    try {
      const hit = await c.query("select shop_id from session_lookup('\\x01')");
      assert.deepEqual(hit.rows, [{ shop_id: shops.B }]);
      assert.equal((await c.query("select * from session_lookup('\\x02')")).rowCount, 0);
      await owner.query("update sessions set expires_at = now() - interval '1 second' where id_hash = '\\x01'");
      assert.equal((await c.query("select * from session_lookup('\\x01')")).rowCount, 0);
      // Without the function, sessions stay behind the shop policy.
      await assert.rejects(c.query('select * from sessions'), /unrecognized configuration parameter "app\.shop_id"/);
    } finally { await c.end(); }
  });
});

describe('ห้ามซ้ำ', () => {
  test('เลขที่เอกสารชนิดเดียวกันซ้ำในร้านเดียวกันไม่ได้ (P2)', async () => {
    await assert.rejects(asApp('A', '', async c => {
      await put(c, 'A', '', 'DB.receipts', 'r1', { no: 'MA-RE261000001' });
      await put(c, 'A', '', 'DB.receipts', 'r2', { no: 'MA-RE261000001' });
    }), /records_doc_no/);
    await assert.rejects(asApp('A', '', async c => {
      await put(c, 'A', '', 'DB.receipts', 'r1', { no: 'MA-RE261000001', taxNo: 'MA-TX261000001' });
      await put(c, 'A', '', 'DB.receipts', 'r2', { no: 'MA-RE261000002', taxNo: 'MA-TX261000001' });
    }), /records_tax_no/);
  });

  test('เลขเดียวกันได้ถ้าคนละร้าน คนละสาขา คนละชนิดเอกสาร หรือเป็นประวัติ (audit) หรือยังไม่มีเลข', async () => {
    await asApp('A', '', async c => {
      await put(c, 'A', '', 'DB.receipts', 'r1', { no: 'MA-RE261000001' });
      await put(c, 'A', '', 'DB.audit', 'a1', { no: 'MA-RE261000001' });
      await put(c, 'A', '', 'DB.audit', 'a2', { no: 'MA-RE261000001' });
      await put(c, 'A', '', 'DB.quotes', 'q1', { no: 'MA-RE261000001' });
      await put(c, 'A', '', 'DB.receipts', 'r2', { no: '' });
      await put(c, 'A', '', 'DB.receipts', 'r3', { no: '' });
    });
    await asApp('B', '', c => put(c, 'B', '', 'DB.receipts', 'r1', { no: 'MA-RE261000001' }));
    await asApp('F', '*', async c => {
      await put(c, 'F', 'B001', 'DB.receipts', 'r1', { no: 'MA-RE261000001' });
      await put(c, 'F', 'B002', 'DB.receipts', 'r1', { no: 'MA-RE261000001' });
    });
  });

  test('ชื่อเข้าระบบซ้ำในร้านเดียวกันไม่ได้ แต่ต่างร้านได้ (A5)', async () => {
    const add = (shop, login) => asApp(shop, '', async c => {
      const u = (await c.query("insert into users (shop_id, kind, ref) values ($1, 'emp', $2) returning id", [shops[shop], login + Math.random()])).rows[0].id;
      await c.query('insert into logins (shop_id, login, user_id) values ($1, $2, $3)', [shops[shop], login, u]);
    }, { commit: true });
    await add('A', '0812345678');
    await add('B', '0812345678');
    await assert.rejects(add('A', '0812345678'), /logins_pkey/);
  });
});
