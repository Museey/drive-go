// Saves that replace much of a shop's data (server/lib/whole-data.ts; team's check of 2026-11-18, the owner's decision
// of 2026-11-19): an ordinary save may not remove many documents or master records at once (the legacy test-copy
// functions called directly did, without a copy), and a save that replaces the whole data always has a copy first.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { readMain } from '../../server/lib/storage.ts';
import { MASS_REMOVAL, MAX_REMOVED, keepBeforeWhole, refuseMassRemoval } from '../../server/lib/whole-data.ts';

let db, ownerPool, appPool, n = 0;
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

const removing = (unit, count) => ({ upsert: [], order: {}, remove: Array.from({ length: count }, (_, i) => ({ unit, key: `k${i}`, data: '' })) });

describe('การบันทึกที่ลบข้อมูลจำนวนมาก', () => {
  test('การบันทึกธรรมดาลบเอกสารหรือข้อมูลหลักได้ไม่เกิน 20 รายการต่อครั้ง การแทนข้อมูลทั้งชุดและรายการที่ไม่ใช่เอกสารไม่นับ', () => {
    assert.equal(MAX_REMOVED, 20);
    assert.equal(refuseMassRemoval(removing('DB.receipts', 1), undefined), null);
    assert.equal(refuseMassRemoval(removing('DB.cust', 20), undefined), null);
    assert.equal(refuseMassRemoval(removing('DB.cust', 21), undefined), MASS_REMOVAL);
    // Spread over kinds: counted together (the trial-set function removed every kind of document at once).
    const mixed = { upsert: [], order: {}, remove: [...removing('DB.quotes', 8).remove, ...removing('DB.receipts', 8).remove, ...removing('DB.stockCuts', 8).remove] };
    assert.equal(refuseMassRemoval(mixed, undefined), MASS_REMOVAL);
    // A wipe, restore, import or sample data says so and keeps its copy.
    assert.equal(refuseMassRemoval(removing('DB.receipts', 500), 'restore'), null);
    // Movements, the audit log and FIFO lots are rebuilt or trimmed by the screens: not counted.
    for (const unit of ['DB.moves', 'DB.audit', 'DB.fifo.lots', 'DB.fifo.allocs', 'DB.crm'])
      assert.equal(refuseMassRemoval(removing(unit, 100), undefined), null, unit);
  });
});

describe('สำเนาก่อนแทนข้อมูลทั้งชุด', () => {
  test('ไม่มีสำเนาจากเบราว์เซอร์ใน 10 นาที server ทำสำเนาของข้อมูลตอนนั้นเอง มีแล้วไม่ทำซ้ำ', async () => {
    const { shopId } = await createShop(ownerPool, { code: `w-${++n}`, pkg: 'biz', data: readFixture(new URL('../fixtures/biz-trial.json', import.meta.url)) });
    const safety = () => asApp(shopId, async c => (await c.query(`select key from backups where key like 'garage.v22.bak.safety-%' order by key`)).rows.map(r => r.key));
    assert.deepEqual(await safety(), []);
    await asApp(shopId, c => keepBeforeWhole(c, '', 'garage.v22', 'sample'));
    const made = await safety();
    assert.equal(made.length, 1);
    assert.match(made[0], /^garage\.v22\.bak\.safety-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-sample$/);
    // The copy is the data as it was.
    const copy = await asApp(shopId, async c => (await c.query('select data from backups where key = $1', [made[0]])).rows.length);
    assert.equal(copy, 1);
    const main = JSON.parse((await asApp(shopId, c => readMain(c, '', 'garage.v22'))).json);
    assert.ok(main.receipts.length > 0);
    // A second whole save within ten minutes (or the browser's own copy just made): no second copy.
    await asApp(shopId, c => keepBeforeWhole(c, '', 'garage.v22', 'restore'));
    assert.equal((await safety()).length, 1);
  });
});
