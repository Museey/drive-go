// The restore drill's fingerprint (server/lib/fingerprint.ts, tools/restore-check.mjs, docs/RESTORE-DRILL.md):
// equal data gives equal digests, a change shows in its shop only, the drill's marker is found, nothing personal
// is printed.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { fingerprint } from '../../server/lib/fingerprint.ts';

let db, ownerPool;
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));

before(async () => {
  db = await startTempPostgres();
  await migrate(db.url);
  ownerPool = new pg.Pool({ connectionString: db.url });
});
after(async () => {
  await ownerPool?.end();
  await db?.stop();
});

describe('ลายนิ้วมือของฐานข้อมูลสำหรับซ้อมกู้คืน', () => {
  test('ข้อมูลเท่าเดิมได้ลายนิ้วมือเดิม แก้ร้านหนึ่งแล้วเปลี่ยนเฉพาะร้านนั้น และหาข้อความที่ใช้ซ้อมเจอ', async () => {
    const a = await createShop(ownerPool, { code: 'drill-a', pkg: 'biz', data: fixture('biz-trial') });
    await createShop(ownerPool, { code: 'drill-b', pkg: 'prox', data: fixture('prox-trial') });
    const first = await fingerprint(ownerPool);
    assert.equal(first.appRole, true);
    assert.ok(first.rlsTables >= 10, `tables with forced RLS: ${first.rlsTables}`);
    assert.ok(first.migrations.includes('0001_core.sql'));
    assert.deepEqual(first.shops.map(s => s.code), ['drill-a', 'drill-b']);
    assert.ok(first.shops.every(s => s.records > 100 && s.versions >= s.records));
    const again = await fingerprint(ownerPool);
    assert.deepEqual({ ...again, at: first.at }, first, 'nothing changed: same print');

    // The drill's customer, as a save writes it.
    await withShop(ownerPool, a.shopId, '*', c => c.query(
      `update records set data = json_build_object('id', key, 'name', 'ซ้อมกู้คืน 2026-11-01')::json, version = version + 1, updated_at = now()
        where shop_id = $1 and unit = 'DB.cust' and key = (select key from records where shop_id = $1 and unit = 'DB.cust' order by key limit 1)`, [a.shopId]));
    const second = await fingerprint(ownerPool, { marker: 'ซ้อมกู้คืน' });
    assert.notEqual(second.shops[0].digest, first.shops[0].digest);
    assert.equal(second.shops[1].digest, first.shops[1].digest);
    assert.notEqual(second.digest, first.digest);
    assert.deepEqual(second.shops[0].marker, { 'DB.cust': 1 });
    assert.deepEqual(second.shops[1].marker, {});
  });

  test('เครื่องมือ restore-check พิมพ์จำนวนต่อร้านโดยไม่มีข้อมูลร้านหรือรหัสผ่าน', () => {
    const r = spawnSync(process.execPath, ['tools/restore-check.mjs', '--marker', 'ซ้อมกู้คืน'],
      { encoding: 'utf8', env: { ...process.env, MIGRATE_DATABASE_URL: db.url, DATABASE_CA_CERT: '' } });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^ร้าน 2$/m);
    assert.match(r.stdout, /^ {2}drill-a +biz +active +แถว \d+/m);
    assert.match(r.stdout, /"ซ้อมกู้คืน": DB\.cust 1 แถว/);
    assert.match(r.stdout, /^ลายนิ้วมือรวม [0-9a-f]{16}$/m);
    assert.doesNotMatch(r.stdout, /postgres(ql)?:\/\//);
    assert.doesNotMatch(r.stdout, /dg1688|123456|ทดลอง/);
  });
});
