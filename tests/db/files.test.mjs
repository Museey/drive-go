// Attachments kept apart from the shop's data (task 3.11, decision R19-ค,
// owner's answers 11.1–11.6): limits, the space of a shop or branch, deletion
// when the data no longer refers to a file, 30 days to restore it, backup
// points keeping their files, and data opened with files inside.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { QUOTA, linkOf } from '../../server/lib/attachments.ts';
import { extractInline, findFile, inlineFile, purgeFiles, sha256, storeFile, usage } from '../../server/lib/files.ts';
import { restoreFile } from '../../server/lib/file-restore.ts';
import { makeBackup, readMain, removeKey, writeMain } from '../../server/lib/storage.ts';

let db, ownerPool, appPool;
const asApp = (shopId, scope, fn) => withShop(appPool, shopId, scope, fn);
const asOwner = (shopId, fn) => withShop(ownerPool, shopId, '*', fn);

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
const fixture = name => readFixture(new URL(`../fixtures/${name}.json`, import.meta.url));
const newShop = async (pkg = 'biz', data = fixture(`${pkg}-trial`)) => (await createShop(ownerPool, { code: `F-${++n}`, pkg, data })).shopId;
const png = (seed = 1) => Buffer.from([0x89, 0x50, 0x4e, 0x47, seed, seed + 1, seed + 2]);
const put = (shopId, bytes, use = 'picture', mime = 'image/png', branch = '') =>
  asApp(shopId, branch, c => storeFile(c, branch, { bytes, mime, use, name: 'x.png' }));
const firstStock = shopId => asApp(shopId, '', async c => (await c.query("select key from records where unit = 'DB.stock' order by pos limit 1")).rows[0].key);
const stockRow = async (shopId, id) => asApp(shopId, '', async c => {
  const { rows } = await c.query("select data::text as data, version from records where unit = 'DB.stock' and key = $1", [id ?? await firstStock(shopId)]);
  return { ...JSON.parse(rows[0].data), _version: rows[0].version };
});
// Saves one product with a new value of img (undefined: the field removed, as delStockImg does).
async function setImg(shopId, img, id) {
  id ??= await firstStock(shopId);
  const { _version, ...row } = await stockRow(shopId, id);
  if (img === undefined) delete row.img; else row.img = img;
  const r = await asApp(shopId, '', c => writeMain(c, '', 'garage.v22', { [`DB.stock|${id}`]: _version },
    { upsert: [{ unit: 'DB.stock', key: id, data: JSON.stringify(row) }], remove: [], order: {} }));
  assert.ok(r.ok);
}
const state = (shopId, id) => asOwner(shopId, async c =>
  (await c.query('select deleted_at is not null as deleted, restored_at is not null as restored from files where id = $1', [id])).rows[0] ?? 'gone');
const age = (shopId, id, days) => asOwner(shopId, c => c.query(
  "update files set deleted_at = now() - make_interval(days => $2), created_at = now() - make_interval(days => $2) where id = $1", [id, days]));

describe('อัปโหลด', () => {
  test('ไฟล์เดียวกันเก็บครั้งเดียว (id = SHA-256) และนับพื้นที่ครั้งเดียว', async () => {
    const shop = await newShop();
    const a = await put(shop, png()), b = await put(shop, png());
    assert.equal(a.ok && b.ok, true);
    assert.equal(a.id, sha256(png()));
    assert.equal(a.url, `/api/files/${a.id}`);
    assert.deepEqual(await asApp(shop, '', c => usage(c, '')), { used: 7, quota: QUOTA });
    assert.deepEqual(await asApp(shop, '', c => findFile(c, a.id)), { branch: '', mime: 'image/png', size: 7, name: 'x.png' });
  });

  test('ไฟล์เกิน 5 MB และคลิปเกิน 15 MB ไม่รับ (11.4)', async () => {
    const shop = await newShop();
    const MiB = 1024 * 1024;
    assert.deepEqual(await put(shop, Buffer.alloc(5 * MiB + 1), 'knowledge', 'application/pdf'), { ok: false, error: 'too-large', limit: 5 * MiB });
    assert.equal((await put(shop, Buffer.alloc(5 * MiB), 'knowledge', 'application/pdf')).ok, true);
    assert.equal((await put(shop, Buffer.alloc(15 * MiB, 1), 'knowledge', 'video/mp4')).ok, true);
    assert.deepEqual(await put(shop, Buffer.alloc(15 * MiB + 1), 'knowledge', 'video/mp4'), { ok: false, error: 'too-large', limit: 15 * MiB });
  });

  test('พื้นที่ 2 GB เต็ม: รูปสินค้า ไฟล์คลังความรู้ ไม่รับ สลิปและ 50 ทวิ รับเสมอ ไฟล์ที่ลบแล้วไม่นับ (11.2)', async () => {
    const shop = await newShop();
    await asOwner(shop, c => c.query(
      "insert into files (shop_id, branch_id, id, mime, size, use) values (app_shop(), '', $1, 'image/png', $2, 'picture')", ['f'.repeat(64), QUOTA - 5]));
    assert.deepEqual(await put(shop, png(1), 'picture'), { ok: false, error: 'quota', limit: QUOTA });
    assert.deepEqual(await put(shop, png(1), 'knowledge'), { ok: false, error: 'quota', limit: QUOTA });
    assert.equal((await put(shop, png(1), 'evidence')).ok, true);
    // Once that big one is deleted, the space is free again.
    await asOwner(shop, c => c.query("update files set deleted_at = now() where id = $1", ['f'.repeat(64)]));
    assert.equal((await put(shop, png(2), 'picture')).ok, true);
  });

  test('แฟรนไชส์: พื้นที่แยกต่อสาขา (11.3) และไฟล์อยู่กับสาขาของตัวเอง', async () => {
    const shop = await newShop('franchise');
    await asOwner(shop, c => c.query(
      "insert into files (shop_id, branch_id, id, mime, size, use) values (app_shop(), 'B001', $1, 'image/png', $2, 'picture')", ['e'.repeat(64), QUOTA]));
    assert.deepEqual(await put(shop, png(3), 'picture', 'image/png', 'B001'), { ok: false, error: 'quota', limit: QUOTA });
    const b2 = await put(shop, png(3), 'picture', 'image/png', 'B002');
    assert.equal(b2.ok, true);
    assert.equal(await asApp(shop, 'B001', c => findFile(c, b2.id)), null);
    assert.equal((await asApp(shop, '*', c => findFile(c, b2.id))).branch, 'B002');
  });
});

describe('ลบเมื่อข้อมูลไม่อ้างถึง และกู้คืนได้ 30 วัน', () => {
  test('ลบรูปสินค้า: ไฟล์ถูกลบ ไม่นับพื้นที่ อัปรูปเดิมใหม่หรือใส่ลิงก์กลับได้ไฟล์เดิม', async () => {
    const shop = await newShop();
    const f = await put(shop, png(4));
    await setImg(shop, f.url);
    assert.deepEqual(await state(shop, f.id), { deleted: false, restored: false });
    await setImg(shop, undefined);
    assert.deepEqual(await state(shop, f.id), { deleted: true, restored: false });
    assert.equal((await asApp(shop, '', c => usage(c, ''))).used, 0);
    assert.equal(await asApp(shop, '', c => findFile(c, f.id)), null);
    await setImg(shop, f.url);
    assert.deepEqual(await state(shop, f.id), { deleted: false, restored: false });
  });

  test('เปลี่ยนรูป = ลบรูปเดิม ไฟล์ที่ยังมีแถวอื่นอ้างถึงไม่ถูกลบ', async () => {
    const shop = await newShop();
    const a = await put(shop, png(5)), b = await put(shop, png(6));
    await setImg(shop, a.url);
    const other = (await asApp(shop, '', c => c.query("select key from records where unit = 'DB.stock' order by pos offset 1 limit 1"))).rows[0].key;
    await setImg(shop, a.url, other);
    await setImg(shop, b.url);
    assert.equal((await state(shop, a.id)).deleted, false);
    await setImg(shop, undefined, other);
    assert.equal((await state(shop, a.id)).deleted, true);
  });

  test('หลัง 30 วันไฟล์ถูกลบถาวร ไฟล์ที่อัปโหลดแล้วไม่มีการบันทึกใดอ้างถึงเกินหนึ่งวันนับเป็นลบแล้ว', async () => {
    const shop = await newShop();
    const a = await put(shop, png(7)), orphan = await put(shop, png(8));
    await setImg(shop, a.url);
    await setImg(shop, undefined);
    await age(shop, a.id, 29);
    assert.deepEqual(await asApp(shop, '', c => purgeFiles(c)), []);
    await age(shop, a.id, 31);
    await asOwner(shop, c => c.query("update files set created_at = now() - interval '25 hours' where id = $1", [orphan.id]));
    assert.deepEqual(await asApp(shop, '', c => purgeFiles(c)), [{ branch: '', id: a.id }]);
    assert.equal(await state(shop, a.id), 'gone');
    assert.equal((await asOwner(shop, c => c.query('select from file_bytes where id = $1', [a.id]))).rowCount, 0);
    assert.equal((await state(shop, orphan.id)).deleted, true);
  });

  test('ไฟล์ที่จุดสำรองยังอ้างถึงเก็บไว้จนจุดสำรองนั้นหมด (11.6) กู้คืนจุดสำรองแล้วไฟล์กลับมาใช้', async () => {
    const shop = await newShop();
    const a = await put(shop, png(9));
    await setImg(shop, a.url);
    await asApp(shop, '', c => makeBackup(c, '', 'garage.v22.bak.2026-10-13'));
    await setImg(shop, undefined);
    await age(shop, a.id, 31);
    assert.deepEqual(await asApp(shop, '', c => purgeFiles(c)), []);
    assert.equal((await asApp(shop, '', c => usage(c, ''))).used, 0, 'not counted in the space');
    await setImg(shop, a.url);   // restoring the backup point writes the row back
    assert.equal((await state(shop, a.id)).deleted, false);
    await setImg(shop, undefined);
    await age(shop, a.id, 31);
    await asApp(shop, '', c => removeKey(c, '', 'garage.v22.bak.2026-10-13'));
    assert.deepEqual(await asApp(shop, '', c => purgeFiles(c)), [{ branch: '', id: a.id }]);
  });

  test('ลบข้อมูลหลักทั้ง key: ไฟล์ทุกไฟล์ของ key นั้นถูกลบ', async () => {
    const shop = await newShop();
    const a = await put(shop, png(10));
    await setImg(shop, a.url);
    await asApp(shop, '', c => removeKey(c, '', 'garage.v22'));
    assert.equal((await state(shop, a.id)).deleted, true);
  });
});

describe('ทีมงานกู้คืนไฟล์ (11.1)', () => {
  test('รูปสินค้าที่ลบกลับมาที่ช่องเดิม บันทึกลงประวัติการเปลี่ยนแปลงโดยไม่มีผู้ใช้', async () => {
    const shop = await newShop();
    const a = await put(shop, png(11));
    await setImg(shop, a.url);
    await setImg(shop, undefined);
    const r = await asOwner(shop, c => restoreFile(c, '', a.id));
    assert.deepEqual(r, { unit: 'DB.stock', key: await firstStock(shop), storeKey: 'garage.v22', how: 'field' });
    assert.equal((await stockRow(shop)).img, a.url);
    assert.deepEqual(await state(shop, a.id), { deleted: false, restored: true });
    const log = (await asOwner(shop, c => c.query("select user_id, op, after::text as after from change_log where unit = 'DB.stock' order by id desc limit 1"))).rows[0];
    assert.equal(log.user_id, null);
    assert.ok(log.after.includes(a.url));
    await assert.rejects(asOwner(shop, c => restoreFile(c, '', a.id)), /not deleted/);
  });

  test('ช่องเดิมมีรูปใหม่แล้ว: ไม่ทับ เว้นแต่สั่ง --replace / แถวที่ถูกลบกลับมาทั้งแถว / ไฟล์ที่ลบถาวรแล้วกู้ไม่ได้', async () => {
    const shop = await newShop('prox');
    const a = await put(shop, png(12)), b = await put(shop, png(13));
    await setImg(shop, a.url);
    await setImg(shop, b.url);
    await assert.rejects(asOwner(shop, c => restoreFile(c, '', a.id)), /--replace/);
    await asOwner(shop, c => restoreFile(c, '', a.id, { replace: true }));
    assert.equal((await stockRow(shop)).img, a.url);

    const k = await put(shop, png(14), 'knowledge');
    const item = { id: 'L1', title: 'บทความ', kind: 'file', fname: 'x.png', mime: 'image/png', data: k.url };
    await asApp(shop, '', c => writeMain(c, '', 'garage.v22', {}, { upsert: [{ unit: 'DB.px.learn', key: 'L1', data: JSON.stringify(item) }], remove: [], order: {} }));
    const v = (await asApp(shop, '', c => c.query("select version from records where unit = 'DB.px.learn' and key = 'L1'"))).rows[0].version;
    await asApp(shop, '', c => writeMain(c, '', 'garage.v22', { 'DB.px.learn|L1': v }, { upsert: [], remove: [{ unit: 'DB.px.learn', key: 'L1' }], order: {} }));
    assert.equal((await state(shop, k.id)).deleted, true);
    assert.deepEqual(await asOwner(shop, c => restoreFile(c, '', k.id)), { unit: 'DB.px.learn', key: 'L1', storeKey: 'garage.v22', how: 'row' });
    const main = JSON.parse((await asApp(shop, '', c => readMain(c, '', 'garage.v22'))).json);
    assert.deepEqual(main.px.learn.find(x => x.id === 'L1'), item);

    await assert.rejects(asOwner(shop, c => restoreFile(c, '', 'a'.repeat(64))), /not kept/);
  });
});

describe('ข้อมูลที่มีไฟล์อยู่ข้างใน', () => {
  const dataUrl = bytes => 'data:image/jpeg;base64,' + bytes.toString('base64');

  test('เปิดอู่จากข้อมูลของระบบเดิมที่มีรูป: รูปแยกเป็นไฟล์ ข้อมูลเก็บลิงก์ โลโก้ยังอยู่ในข้อมูล', async () => {
    const data = fixture('biz-trial');
    const db = JSON.parse(data.store['garage.v22']);
    db.stock[0].img = dataUrl(png(20));
    db.shop.logo = 'data:image/png;base64,' + png(21).toString('base64');
    data.store['garage.v22'] = JSON.stringify(db);
    const shop = await newShop('biz', data);
    const main = JSON.parse((await asApp(shop, '', c => readMain(c, '', 'garage.v22'))).json);
    assert.equal(main.stock[0].img, linkOf(sha256(png(20))));
    assert.equal(main.shop.logo, db.shop.logo);
    assert.deepEqual(await state(shop, sha256(png(20))), { deleted: false, restored: false });
  });

  test('server ไม่รับการบันทึกที่ยังมีไฟล์อยู่ในข้อมูล ยกเว้นโลโก้ร้าน', () => {
    const row = (unit, v) => ({ upsert: [{ unit, key: 'k', data: JSON.stringify(v) }], remove: [], order: {} });
    assert.equal(inlineFile(row('DB.stock', { img: dataUrl(png()) })), 'DB.stock|k');
    assert.equal(inlineFile(row('DB.paySlips', [{ url: dataUrl(png()), name: 's' }])), 'DB.paySlips|k');
    assert.equal(inlineFile(row('DB.shop', { logo: dataUrl(png()) })), null);
    assert.equal(inlineFile(row('DB.cust', { note: 'data: ไม่ใช่ไฟล์' })), null);
  });

  test('แยกไฟล์ออกจากแถว: ชื่อไฟล์มาจาก fname / name ของรายการ', async () => {
    const shop = await newShop();
    const rows = await asApp(shop, '', c => extractInline(c, '', [
      { unit: 'DB.paySlips', key: 'P1', data: JSON.stringify([{ url: dataUrl(png(30)), name: 'สลิป.jpg', line: null }]) },
      { unit: 'DB.cust', key: 'C1', data: '{"name":"x"}' },
    ]));
    assert.equal(rows[0].data, JSON.stringify([{ url: linkOf(sha256(png(30))), name: 'สลิป.jpg', line: null }]));
    assert.equal(rows[1].data, '{"name":"x"}');
    const f = await asOwner(shop, c => c.query('select use, name from files where id = $1', [sha256(png(30))]));
    assert.deepEqual(f.rows[0], { use: 'evidence', name: 'สลิป.jpg' });
  });
});
