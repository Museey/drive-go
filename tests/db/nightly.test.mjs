// The scheduled job (server/lib/nightly.ts, tools/nightly.mjs; LAUNCH-CHECKLIST stage 1 "ตารางเวลางานเบื้องหลัง"):
// removals that are due are carried out, shops that must be told are only listed (staff phone them and record it,
// 15.4), demo shops are left to staff, and attachments deleted more than 30 days ago go for good.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { storeFile } from '../../server/lib/files.ts';
import { listShops, recordNotice } from '../../server/lib/licence-admin.ts';
import { nightly } from '../../server/lib/nightly.ts';

process.env.DRIVEGO_TODAY = '2026-10-13';
process.env.DRIVEGO_TEST_SERVER = '1';

let db, ownerPool, n = 0;
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));
const actor = 'test';

before(async () => {
  db = await startTempPostgres();
  await migrate(db.url);
  ownerPool = new pg.Pool({ connectionString: db.url });
});
after(async () => {
  await ownerPool?.end();
  await db?.stop();
});

// Ended 2026-10-01: removal day 2026-12-30, to be told from 2026-11-30.
const ended = { kind: 'paid', start: '2025-10-01', end: '2026-10-01', contact: 'คุณแดง 081-234-5678' };
const shop = async (licence = ended, code = `N-${++n}`) => {
  const { shopId } = await createShop(ownerPool, { code, pkg: 'biz', data: fixture('biz-trial'), licence });
  return { shopId, code };
};
const licence = async code => (await listShops(ownerPool, { on: '2026-10-13' })).find(s => s.code === code)?.licence;
const status = async shopId => (await ownerPool.query('select status from shops where id = $1', [shopId])).rows[0]?.status ?? 'gone';
const mine = (night, code) => ({
  done: night.done.filter(d => d.code === code).map(d => d.action),
  call: night.call.filter(d => d.shop.code === code).map(d => d.action),
  demo: night.demo.filter(d => d.shop.code === code).map(d => d.action),
});

describe('งานกลางคืน (ตารางเวลางานเบื้องหลัง)', () => {
  test('ร้านที่ต้องแจ้งก่อนลบ: งานแค่บอกให้โทร ไม่จดว่าแจ้งแล้ว ทีมงานโทรแล้วจดเอง จากนั้นครบ 30 วันงานจึงลบข้อมูล', async () => {
    const s = await shop();
    assert.deepEqual(mine(await nightly(ownerPool, { on: '2026-11-29' }), s.code), { done: [], call: [], demo: [] });
    // Due for telling: listed every night, and nothing is recorded (the removal day does not start counting).
    for (const on of ['2026-11-30', '2026-12-20', '2027-01-05']) {
      const night = await nightly(ownerPool, { on, actor });
      assert.deepEqual(mine(night, s.code), { done: [], call: ['notice'], demo: [] }, on);
      assert.equal(night.call.find(d => d.shop.code === s.code).licence.contact, 'คุณแดง 081-234-5678');
      assert.equal((await licence(s.code)).noticeSentOn, null, on);
      assert.equal(await status(s.shopId), 'active', on);
    }
    // Staff phoned on 2027-01-05 (after the removal day): the shop gets its full 30 days.
    assert.deepEqual(await recordNotice(ownerPool, s.code, { actor, on: '2027-01-05', note: 'คุยกับคุณแดงแล้ว' }), { removalOn: '2027-02-04' });
    await assert.rejects(recordNotice(ownerPool, s.code, { actor, on: '2027-01-06' }), /told on 2027-01-05 already/);
    const log = await ownerPool.query("select detail from licence_log where shop_id = $1 and action = 'notice'", [s.shopId]);
    assert.deepEqual(log.rows.map(r => r.detail), [{ removalOn: '2027-02-04', contact: 'คุณแดง 081-234-5678', note: 'คุยกับคุณแดงแล้ว' }]);
    assert.deepEqual(mine(await nightly(ownerPool, { on: '2027-02-03' }), s.code), { done: [], call: [], demo: [] });
    assert.deepEqual(mine(await nightly(ownerPool, { on: '2027-02-04', actor }), s.code), { done: ['delete'], call: [], demo: [] });
    assert.equal(await status(s.shopId), 'removed');
    // Five years later its kept history goes too.
    assert.deepEqual(mine(await nightly(ownerPool, { on: '2032-02-03' }), s.code), { done: [], call: [], demo: [] });
    assert.deepEqual(mine(await nightly(ownerPool, { on: '2032-02-04', actor }), s.code), { done: ['purge'], call: [], demo: [] });
    assert.equal(await status(s.shopId), 'gone');
    const actions = await ownerPool.query('select action, actor from licence_log where shop_code = $1 order by id', [s.code]);
    assert.deepEqual(actions.rows.map(r => [r.action, r.actor]), [['notice', actor], ['delete', actor], ['purge', actor]]);
  });

  test('จดว่าแจ้งแล้วได้เฉพาะร้านที่ถึงเวลาแจ้ง', async () => {
    const running = await shop({ kind: 'trial', start: '2026-10-01', end: '2026-11-30' });
    await assert.rejects(recordNotice(ownerPool, running.code, { actor, on: '2026-10-13' }), /has not ended/);
    const s = await shop();
    await assert.rejects(recordNotice(ownerPool, s.code, { actor, on: '2026-11-29' }), /not due yet: from 2026-11-30/);
    assert.deepEqual(await recordNotice(ownerPool, s.code, { actor, on: '2026-11-30' }), { removalOn: '2026-12-30' });
  });

  test('ร้านตัวอย่างของ DriveGo ที่หมดวันทดลอง: ไม่ต้องโทร ไม่ลบ ทีมงานเปิดทดลองใหม่เอง', async () => {
    const demo = await shop(ended, 'demo-prox');
    const night = await nightly(ownerPool, { on: '2026-12-31', actor });
    assert.deepEqual(mine(night, demo.code), { done: [], call: [], demo: ['notice'] });
    assert.equal((await licence(demo.code)).noticeSentOn, null);
    assert.equal(await status(demo.shopId), 'active');
  });

  test('ไฟล์แนบที่ถูกลบเกิน 30 วันหายจริง ไฟล์ที่ใช้อยู่ไม่หาย', async () => {
    const s = await shop({ kind: 'trial', start: '2026-10-01', end: '2026-11-30' });
    const up = async seed => withShop(ownerPool, s.shopId, '', c => storeFile(c, '', { bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, seed]), mime: 'image/png', use: 'picture', name: 'x.png' }));
    const old = await up(1), recent = await up(2), kept = await up(3);
    await withShop(ownerPool, s.shopId, '*', async c => {
      await c.query("update files set deleted_at = now() - interval '31 days', created_at = now() - interval '40 days' where id = $1", [old.id]);
      await c.query("update files set deleted_at = now() - interval '5 days' where id = $1", [recent.id]);
      await c.query("insert into file_refs (shop_id, branch_id, unit, key, file_id) values (app_shop(), '', 'DB.stock', 'S1', $1)", [kept.id]);
    });
    const night = await nightly(ownerPool, { on: '2026-10-13' });
    assert.deepEqual(night.files.filter(f => f.code === s.code), [{ code: s.code, removed: 1 }]);
    const left = await withShop(ownerPool, s.shopId, '*', async c => (await c.query('select id from files where shop_id = app_shop() order by id')).rows.map(r => r.id));
    assert.deepEqual(left, [recent.id, kept.id].sort());
  });
});
