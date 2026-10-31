// Errors of the server and of the browsers (table errors, server/lib/errors.ts) and the hourly job that alerts on
// them (server/lib/watch.ts; LAUNCH-CHECKLIST stage 1 "แจ้งเตือนเมื่อระบบมีปัญหา").
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { allowReport, pathOnly, recordError } from '../../server/lib/errors.ts';
import { BROWSER_ALERT, watch } from '../../server/lib/watch.ts';
import { nightly } from '../../server/lib/nightly.ts';
import { carryOut, retentionDue } from '../../server/lib/licence-admin.ts';

process.env.DRIVEGO_TODAY = '2026-10-13';
process.env.DRIVEGO_TEST_SERVER = '1';

let db, ownerPool, appPool, n = 0;
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));

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

const shop = async licence => {
  const code = `E-${++n}`;
  const { shopId } = await createShop(ownerPool, { code, pkg: 'biz', data: fixture('biz-trial'), licence });
  return { shopId, code };
};
const count = async (where = 'true', args = []) => (await ownerPool.query(`select count(*)::int as n from errors where ${where}`, args)).rows[0].n;

describe('บันทึกข้อผิดพลาด', () => {
  test('แอปเพิ่มข้อผิดพลาดได้อย่างเดียว อ่าน แก้ ลบไม่ได้ ทีมงานอ่านได้', async () => {
    const s = await shop();
    await recordError(appPool, { source: 'browser', shopId: s.shopId, userId: 'U1', path: '/x/?q=ชื่อลูกค้า#a', message: 'm'.repeat(5000), detail: 'stack' });
    const [row] = (await ownerPool.query('select path, length(message) as len, detail from errors where shop_id = $1', [s.shopId])).rows;
    assert.deepEqual(row, { path: '/x/', len: 1000, detail: 'stack' });   // no query string; cut
    assert.equal(pathOnly('/a/b?c=1'), '/a/b');
    for (const sql of ['select * from errors', 'update errors set message = $1', 'delete from errors'])
      await assert.rejects(appPool.query(sql, sql.includes('$1') ? ['x'] : []), /permission denied/, sql);
    await assert.rejects(appPool.query('select * from watch_marks'), /permission denied/);
  });

  test('จำกัดจำนวนรายงานต่อนาที ต่อคนและรวมทั้งหมด', () => {
    const t = Date.UTC(2026, 9, 31, 1, 2, 0);
    let ok = 0;
    for (let i = 0; i < 25; i++) if (allowReport('s:A', t)) ok++;
    assert.equal(ok, 20);
    assert.equal(allowReport('s:B', t), true);
    assert.equal(allowReport('s:A', t + 60_000), true);   // the next minute
    let all = 0;
    for (let i = 0; i < 400; i++) if (allowReport(`a:${i}`, t + 120_000)) all++;
    assert.equal(all, 300);
  });
});

describe('งานรายชั่วโมง (watch)', () => {
  test('ดูข้อผิดพลาดตั้งแต่ครั้งก่อน จัดกลุ่มตามข้อความ แจ้งเตือนเมื่อ server ล้ม หรือหน้าจอผิดพลาดหลายครั้ง', async () => {
    await ownerPool.query('delete from errors');
    await ownerPool.query('delete from watch_marks');
    const s = await shop();
    // First run: the last hour; an error of two hours ago is not new.
    await ownerPool.query("insert into errors (at, source, message) values (now() - interval '2 hours', 'server', 'old')");
    for (let i = 0; i < 3; i++) await recordError(appPool, { source: 'browser', shopId: s.shopId, path: '/E/', message: 'TypeError: a' });
    let w = await watch(ownerPool);
    assert.equal(w.alert, false);
    assert.deepEqual([w.server, w.browser], [0, 3]);
    assert.deepEqual(w.seen.map(x => [x.source, x.shop, x.path, x.message, x.count]), [['browser', s.code, '/E/', 'TypeError: a', 3]]);
    // Next run: only what came since; nothing new, nothing to alert.
    w = await watch(ownerPool);
    assert.deepEqual([w.seen, w.alert], [[], false]);
    // A request the server failed on alerts at once.
    await recordError(appPool, { source: 'server', path: '/api/storage/garage.v22', message: 'POST /api/storage/[key]: boom' });
    w = await watch(ownerPool);
    assert.deepEqual([w.server, w.alert, w.seen[0].shop], [1, true, '']);
    // Many browser errors alert too.
    for (let i = 0; i < BROWSER_ALERT; i++) await recordError(appPool, { source: 'browser', shopId: s.shopId, message: `e${i % 2}` });
    w = await watch(ownerPool);
    assert.deepEqual([w.browser, w.alert, w.seen.length], [BROWSER_ALERT, true, 2]);
  });
});

describe('ลบข้อผิดพลาด', () => {
  test('งานกลางคืนลบข้อผิดพลาดที่เก่ากว่า 30 วัน', async () => {
    await ownerPool.query("insert into errors (at, source, message) values (now() - interval '31 days', 'browser', 'gone'), (now() - interval '29 days', 'browser', 'kept')");
    const night = await nightly(ownerPool, { on: '2026-10-13' });
    assert.ok(night.errors >= 1);
    assert.equal(await count("message = 'gone'"), 0);
    assert.equal(await count("message = 'kept'"), 1);
  });

  test('ข้อผิดพลาดของร้านหายไปพร้อมข้อมูลของร้านเมื่อถึงวันลบ', async () => {
    const s = await shop({ kind: 'paid', start: '2025-10-01', end: '2026-10-01' });
    await recordError(appPool, { source: 'browser', shopId: s.shopId, message: 'of the shop' });
    const due = async on => (await retentionDue(ownerPool, on)).find(d => d.shop.code === s.code);
    await carryOut(ownerPool, await due('2026-11-30'), { actor: 'test', on: '2026-11-30', tell: async () => {} });
    await carryOut(ownerPool, await due('2026-12-30'), { actor: 'test', on: '2026-12-30', tell: async () => {} });
    assert.equal(await count('shop_id = $1', [s.shopId]), 0);
  });
});
