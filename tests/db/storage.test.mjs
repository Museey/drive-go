// The legacy STORE kept on the server (tasks T4, T5): shops opened from the
// fixtures read back exactly, saves change only what changed, and a save over
// someone else's newer change is refused whole (decisions P1, P2).
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { listKeys, makeBackup, readBackup, readBlob, readMain, removeKey, writeBlob, writeMain } from '../../server/lib/storage.ts';
import { assemble, diff, rootOf, split } from '../../server/lib/units.ts';

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
const newShop = (name, pkg, opts = {}) => createShop(ownerPool, { code: `T-${++n}`, pkg, data: fixture(name), ...opts });

describe('เปิดอู่จาก fixture (T4)', () => {
  for (const [name, pkg] of [['biz-trial', 'biz'], ['prox-trial', 'prox'], ['franchise-trial', 'franchise']]) {
    test(`${name}: อ่านกลับได้ข้อมูลเดิม เว้นแต่รหัสผ่านเป็นค่าแทนและยังไม่มีใครเข้าระบบ`, async () => {
      const data = fixture(name);
      const { shopId, secrets } = await newShop(name, pkg);
      assert.ok(secrets.length > 0);
      for (const [key, json] of Object.entries(data.store)) {
        if (!rootOf(key)) continue;
        const branch = pkg === 'franchise' && key === 'garage.v22' ? 'B001' : '';
        const got = await asApp(shopId, branch || '', c => readMain(c, branch, key));
        const s = split(key, json);
        assert.equal(got.json, assemble(key, s.layout, s.rows), `${name} ${key}`);
        assert.ok(!secrets.some(x => x.storeKey === key && got.json.includes(JSON.stringify(x.value)) && x.value.length > 3), 'no password in what the browser gets');
      }
    });
  }

  test('ระหว่างที่หน้าจอยังตรวจรหัสเอง (ก่อน T7) เก็บรหัสไว้ได้ แล้วอ่านกลับได้ตรงทุกไบต์', async () => {
    const data = fixture('biz-trial');
    const { shopId } = await newShop('biz-trial', 'biz', { keepSecrets: true });
    for (const [key, json] of Object.entries(data.store)) {
      if (!rootOf(key)) continue;
      const s = split(key, json);
      const got = await asApp(shopId, '', c => readMain(c, '', key, s.session));
      assert.equal(got.json, json, key);
    }
  });

  test('Franchise: ข้อมูลของ B001 อยู่ในสาขา B001 สาขาอื่นอ่านไม่ได้ และข้อมูลเครืออ่านได้ทุกสาขา', async () => {
    const { shopId } = await newShop('franchise-trial', 'franchise');
    assert.ok(await asApp(shopId, 'B001', c => readMain(c, 'B001', 'garage.v22')));
    assert.equal(await asApp(shopId, 'B002', c => readMain(c, 'B001', 'garage.v22')), null);
    assert.ok(await asApp(shopId, 'B002', c => readMain(c, '', 'franchise.v22')));
  });

  test('ข้อมูล 36 เดือนเปิดอู่และอ่านกลับได้ตรง', { skip: !existsSync(new URL('../fixtures/biz-full.json', import.meta.url)) && 'biz-full.json not built' }, async () => {
    const data = fixture('biz-full');
    let t = Date.now();
    const { shopId } = await newShop('biz-full', 'biz', { keepSecrets: true });
    const seeded = Date.now() - t;
    t = Date.now();
    const s = split('garage.v22', data.store['garage.v22']);
    const got = await asApp(shopId, '', c => readMain(c, '', 'garage.v22', s.session));
    console.log(`# 36-month data: open shop ${seeded} ms, read back ${Date.now() - t} ms`);
    assert.equal(got.json, data.store['garage.v22']);
  });
});

describe('บันทึก (T5)', () => {
  // A browser's view of one key: what it last read and the versions it saw.
  async function open(shopId, key = 'garage.v22') {
    const got = await asApp(shopId, '', c => readMain(c, '', key));
    return { key, shopId, db: JSON.parse(got.json), base: got.versions, last: split(key, got.json) };
  }
  async function save(view) {
    const next = split(view.key, JSON.stringify(view.db));
    const changes = diff(view.last, next);
    const r = await asApp(view.shopId, '', c => writeMain(c, '', view.key, view.base, changes));
    if (r.ok) {
      Object.assign(view.base, r.versions);
      for (const x of changes.remove) delete view.base[`${x.unit}|${x.key}`];
      view.last = next;
    }
    return { ...r, changes };
  }

  test('แก้ เพิ่ม ลบ แล้วอ่านกลับได้ข้อมูลใหม่ และส่งเฉพาะแถวที่เปลี่ยน', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const v = await open(shopId);
    v.db.receipts[0].note = 'แก้แล้ว';
    v.db.receipts.push({ id: 'new-receipt', no: 'MA-RE261099999' });
    const gone = v.db.cust.pop();
    v.db.seq['MA-RE2610'] = 99;
    v.db.qPresets = { probs: ['ใหม่'], finds: [] };
    const r = await save(v);
    assert.ok(r.ok);
    assert.equal(r.changes.upsert.length, 4);
    assert.deepEqual(r.changes.remove, [{ unit: 'DB.cust', key: gone.id }]);
    const again = await open(shopId);
    assert.equal(JSON.stringify(again.db), JSON.stringify(v.db));
  });

  test('ไม่มีอะไรเปลี่ยนก็ไม่มีอะไรต้องเขียน', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const v = await open(shopId);
    const r = await save(v);
    assert.deepEqual(r.changes, { upsert: [], remove: [], order: {} });
  });

  test('บันทึกทับรายการที่คนอื่นเพิ่งแก้ ถูกปฏิเสธทั้งคำขอ ไม่บันทึกครึ่ง ๆ (P1)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const a = await open(shopId), b = await open(shopId);
    a.db.receipts[0].note = 'A แก้ก่อน';
    assert.ok((await save(a)).ok);
    b.db.receipts[0].note = 'B แก้ทีหลัง';
    b.db.cust[0].name = 'B แก้ลูกค้าด้วย';
    const r = await save(b);
    assert.equal(r.ok, false);
    assert.deepEqual(r.conflicts, [`DB.receipts|${b.db.receipts[0].id}`]);
    const now = await open(shopId);
    assert.equal(now.db.receipts[0].note, 'A แก้ก่อน');
    assert.notEqual(now.db.cust[0].name, 'B แก้ลูกค้าด้วย');
  });

  test('ตัวนับเลขเอกสารเดียวกัน: คนที่สองถูกปฏิเสธ คนละตัวนับไม่ชนกัน', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const a = await open(shopId), b = await open(shopId), c = await open(shopId);
    a.db.seq['MA-RE2610'] = (a.db.seq['MA-RE2610'] || 0) + 1;
    b.db.seq['MA-RE2610'] = (b.db.seq['MA-RE2610'] || 0) + 1;
    c.db.seq['MA-QT2610'] = (c.db.seq['MA-QT2610'] || 0) + 1;
    assert.ok((await save(a)).ok);
    assert.equal((await save(b)).ok, false);
    assert.ok((await save(c)).ok);
  });

  test('ลบรายการที่คนอื่นเพิ่งแก้ หรือเพิ่ม id ที่คนอื่นเพิ่งเพิ่ม ถูกปฏิเสธ', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const a = await open(shopId), b = await open(shopId);
    a.db.cust[0].tel = '000';
    a.db.receipts.push({ id: 'same-id' });
    assert.ok((await save(a)).ok);
    b.db.cust.shift();
    assert.equal((await save(b)).ok, false);
    const c = await open(shopId), d = await open(shopId);
    c.db.receipts.push({ id: 'twice' });
    d.db.receipts.push({ id: 'twice' });
    assert.ok((await save(c)).ok);
    assert.equal((await save(d)).ok, false);
  });

  test('เลขที่เอกสารซ้ำจากสองเครื่อง: ฐานข้อมูลปฏิเสธ (P2)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const a = await open(shopId), b = await open(shopId);
    a.db.receipts.push({ id: 'ra', no: 'MA-RE261000777' });
    b.db.receipts.push({ id: 'rb', no: 'MA-RE261000777' });
    assert.ok((await save(a)).ok);
    await assert.rejects(save(b), e => e.code === '23505' && /records_doc_no/.test(e.constraint));
  });

  test('ลำดับรายการเปลี่ยน แล้วอ่านกลับได้ลำดับใหม่', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const v = await open(shopId);
    v.db.cust.reverse();
    v.db.cust.splice(3, 0, { id: 'middle' });
    const r = await save(v);
    assert.ok(r.ok);
    assert.ok(r.changes.order['DB.cust']);
    assert.deepEqual((await open(shopId)).db.cust.map(x => x.id), v.db.cust.map(x => x.id));
  });

  test('บันทึกของ key หนึ่งแตะหน่วยของ key อื่นไม่ได้ (เช่น ส่งบัญชีเครือมากับข้อมูลร้าน)', async () => {
    const { shopId } = await newShop('franchise-trial', 'franchise');
    const got = await asApp(shopId, 'B001', c => readMain(c, 'B001', 'garage.v22'));
    for (const changes of [
      { upsert: [{ unit: 'FR.accounts', key: 'x', data: '{}' }], remove: [], order: {} },
      { upsert: [{ unit: 'DB', key: 'garage.v22', data: '[]' }], remove: [], order: {} },
      { upsert: [], remove: [{ unit: 'DGB.shop', key: '' }], order: {} },
      { upsert: [], remove: [], order: { 'FR.reqs': [] } },
    ]) await assert.rejects(asApp(shopId, 'B001', c => writeMain(c, 'B001', 'garage.v22', got.versions, changes)), e => e.status === 400);
  });

  test('ช่องของคนที่เข้าระบบ (curEmp) ไม่ถูกบันทึกเป็นข้อมูลร้าน', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const v = await open(shopId);
    v.db.curEmp = 'someone';
    const r = await save(v);
    assert.deepEqual(r.changes.upsert, []);
    assert.equal((await open(shopId)).db.curEmp, '');
  });
});

describe('จุดสำรองและ key อื่น', () => {
  test('จุดสำรองทำจากข้อมูลบน server แล้วอ่านกลับได้ ลบได้ และอยู่ในรายชื่อ key', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    await asApp(shopId, '', async c => {
      assert.equal(await makeBackup(c, '', 'garage.v22.bak.2026-10-13'), true);
      assert.equal(await readBackup(c, '', 'garage.v22.bak.2026-10-13'), (await readMain(c, '', 'garage.v22')).json);
      assert.deepEqual(await listKeys(c), ['dgb.v22', 'franchise.v22', 'garage.v22', 'garage.v22.bak.2026-10-13']);
      await removeKey(c, '', 'garage.v22.bak.2026-10-13');
      assert.equal(await readBackup(c, '', 'garage.v22.bak.2026-10-13'), null);
    });
  });

  test('key อื่นเก็บทั้งก้อน และลบข้อมูลหลักทั้ง key ได้', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    await asApp(shopId, '', async c => {
      await writeBlob(c, '', 'dgb.guide.v22', '{"seen":1}');
      assert.equal(await readBlob(c, '', 'dgb.guide.v22'), '{"seen":1}');
      await removeKey(c, '', 'garage.v22');
      assert.equal(await readMain(c, '', 'garage.v22'), null);
      assert.ok(await readMain(c, '', 'dgb.v22'));
      assert.deepEqual(await listKeys(c), ['dgb.guide.v22', 'dgb.v22', 'franchise.v22']);
    });
  });

  test('สองอู่ที่เปิดจากข้อมูลชุดเดียวกันไม่ปนกัน', async () => {
    const a = await newShop('biz-trial', 'biz'), b = await newShop('biz-trial', 'biz');
    const va = JSON.parse((await asApp(a.shopId, '', c => readMain(c, '', 'garage.v22'))).json);
    va.cust[0].name = 'เฉพาะอู่ A';
    const before = await asApp(a.shopId, '', c => readMain(c, '', 'garage.v22'));
    const r = await asApp(a.shopId, '', c => writeMain(c, '', 'garage.v22', before.versions,
      diff(split('garage.v22', before.json), split('garage.v22', JSON.stringify(va)))));
    assert.ok(r.ok);
    const vb = JSON.parse((await asApp(b.shopId, '', c => readMain(c, '', 'garage.v22'))).json);
    assert.notEqual(vb.cust[0].name, 'เฉพาะอู่ A');
  });
});
