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
import { claimsIn, correctSplit, rowsToRenumber } from '../../server/lib/numbers.ts';
import { branchOf, inScope, listKeys, makeBackup, readBackup, readBlob, readMain, removeKey, saveMain, writeBlob, writeMain } from '../../server/lib/storage.ts';
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

  test('Franchise: HQ มีข้อมูลของตัวเอง (Q3) สาขาอ่านหรือเขียนข้อมูลของ HQ และของสาขาอื่นไม่ได้ HQ อ่านได้ทุกสาขา', async () => {
    const fr = JSON.parse(fixture('franchise-trial').store['franchise.v22']);
    assert.equal(branchOf('franchise', 'garage.v22', fr.branches), 'B001');
    assert.equal(branchOf('franchise', 'garage.v22::B002', fr.branches), 'B002');
    assert.equal(branchOf('franchise', 'garage.v22::HQ', fr.branches), 'HQ');
    assert.equal(branchOf('biz', 'garage.v22'), '');
    // The routes refuse what the scope does not reach before RLS would hide it.
    assert.deepEqual(['B001', 'B002', 'HQ', ''].map(b => inScope('B001', b)), [true, false, false, true]);
    assert.deepEqual(['B001', 'HQ', ''].map(b => inScope('*', b)), [true, true, true]);
    assert.deepEqual(['', 'B001'].map(b => inScope('', b)), [true, false]);

    const { shopId } = await newShop('franchise-trial', 'franchise');
    const hq = split('garage.v22::HQ', JSON.stringify({ stock: [], shop: { name: 'ALL EV SERVICE' } }));
    const first = await asApp(shopId, '*', c => writeMain(c, 'HQ', 'garage.v22::HQ', {}, { layout: hq.layout, upsert: hq.rows, remove: [], order: {} }));
    assert.ok(first.ok);
    assert.ok(await asApp(shopId, '*', c => readMain(c, 'HQ', 'garage.v22::HQ')));
    assert.ok(await asApp(shopId, '*', c => readMain(c, 'B001', 'garage.v22')));
    assert.equal(await asApp(shopId, 'B001', c => readMain(c, 'HQ', 'garage.v22::HQ')), null);
    const b002 = split('garage.v22::B002', JSON.stringify({ stock: [] }));
    await assert.rejects(asApp(shopId, 'B001', c => writeMain(c, 'B002', 'garage.v22::B002', {}, { layout: b002.layout, upsert: b002.rows, remove: [], order: {} })),
      e => e.code === '42501');
    // Removing HQ's rows: RLS hides them, so the save is refused as a conflict (or by RLS), never done.
    const removed = await asApp(shopId, 'B001', c => writeMain(c, 'HQ', 'garage.v22::HQ', first.versions, { upsert: [], remove: hq.rows, order: {} })).catch(e => e);
    assert.ok(removed.code === '42501' || removed.ok === false, String(removed));
    assert.equal((await asApp(shopId, '*', c => readMain(c, 'HQ', 'garage.v22::HQ'))).json,
      assemble('garage.v22::HQ', hq.layout, hq.rows), 'HQ data is unchanged');
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
  // The same, as window.storage does it since task 3.2: with the numbers the
  // app issued (view.issued), then taking the server's corrections into its own data.
  async function saveNumbered(view) {
    const text = JSON.stringify(view.db), next = split(view.key, text);
    const changes = diff(view.last, next);
    const numbers = claimsIn(view.issued || [], text);
    const r = await asApp(view.shopId, '', c => saveMain(c, '', view.key, view.base, changes, numbers));
    if (r.ok) {
      for (const x of changes.remove) delete view.base[`${x.unit}|${x.key}`];
      Object.assign(view.base, r.versions);
      const claimed = new Set(Object.values(numbers).flat());
      view.issued = (view.issued || []).filter(x => !claimed.has(x.no));
      const sent = correctSplit(view.key, next, rowsToRenumber(next, changes, next), r.renumbered, r.counters);
      view.db = JSON.parse(sent);
      view.last = split(view.key, sent);
    }
    return { ...r, changes, numbers };
  }
  // A new receipt numbered the way the legacy app does it (19.js docNo).
  function newReceipt(view, id) {
    const base = 'MA-RE2610', i = (view.db.seq[base] || 0) + 1;
    view.db.seq[base] = i;
    const no = base + String(i).padStart(5, '0');
    (view.issued ||= []).push({ base, no });
    view.db.receipts.push({ id, no });
    view.db.audit.push({ id: `log-${id}`, kind: 'receipt', doc: no, note: `ออกใบเสร็จ ${no}` });
    return no;
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

  test('ตัวนับเลขเอกสารเดียวกัน (ก่อนเลขออกที่ server): คนที่สองถูกปฏิเสธ คนละตัวนับไม่ชนกัน', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const a = await open(shopId), b = await open(shopId), c = await open(shopId);
    a.db.seq['MA-RE2610'] = (a.db.seq['MA-RE2610'] || 0) + 1;
    b.db.seq['MA-RE2610'] = (b.db.seq['MA-RE2610'] || 0) + 1;
    c.db.seq['MA-QT2610'] = (c.db.seq['MA-QT2610'] || 0) + 1;
    assert.ok((await save(a)).ok);
    assert.equal((await save(b)).ok, false);
    assert.ok((await save(c)).ok);
  });

  test('สองเครื่องออกเลขเดียวกัน: เครื่องที่บันทึกทีหลังได้เลขถัดไป ทุกที่ที่เขียนเลขนั้นในการบันทึกเดียวกัน (3.2, R1-ก)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const a = await open(shopId), b = await open(shopId), c = await open(shopId);
    assert.equal(newReceipt(a, 'ra'), 'MA-RE261000004');
    assert.equal(newReceipt(b, 'rb'), 'MA-RE261000004');
    c.db.seq['MA-QT2610'] += 1;
    c.db.quotes.push({ id: 'qc', no: 'MA-QT261000005' });
    c.issued = [{ base: 'MA-QT2610', no: 'MA-QT261000005' }];
    const ra = await saveNumbered(a);
    assert.ok(ra.ok);
    assert.deepEqual([ra.numbers, ra.renumbered, ra.counters], [{ 'MA-RE2610': ['MA-RE261000004'] }, [], []]);
    const rb = await saveNumbered(b);
    assert.ok(rb.ok);
    assert.deepEqual(rb.renumbered, [['MA-RE261000004', 'MA-RE261000005']]);
    assert.deepEqual(rb.counters, [['MA-RE2610', 5]]);
    assert.ok((await saveNumbered(c)).ok);
    // The second browser's data now holds what the server saved; it carries on from there.
    assert.equal(b.db.receipts.at(-1).no, 'MA-RE261000005');
    assert.equal(b.db.audit.at(-1).note, 'ออกใบเสร็จ MA-RE261000005');
    assert.equal(newReceipt(b, 'rb2'), 'MA-RE261000006');
    assert.ok((await saveNumbered(b)).ok);
    const now = await open(shopId);
    assert.deepEqual(now.db.receipts.slice(-3).map(r => [r.id, r.no]), [['ra', 'MA-RE261000004'], ['rb', 'MA-RE261000005'], ['rb2', 'MA-RE261000006']]);
    assert.deepEqual(now.db.audit.slice(-3).map(x => x.doc), ['MA-RE261000004', 'MA-RE261000005', 'MA-RE261000006']);
    assert.equal(now.db.seq['MA-RE2610'], 6);
    assert.equal(now.db.seq['MA-QT2610'], 5);
  });

  test('สองเครื่องบันทึกพร้อมกันจริง ๆ: ทุกเลขไม่ซ้ำ ไม่มีใครถูกปฏิเสธ (3.2)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const views = await Promise.all([1, 2, 3, 4, 5, 6].map(() => open(shopId)));
    views.forEach((v, i) => newReceipt(v, `r${i}`));
    const results = await Promise.all(views.map(saveNumbered));
    assert.ok(results.every(r => r.ok));
    const now = await open(shopId);
    const nos = now.db.receipts.filter(r => /^r\d$/.test(r.id)).map(r => r.no).sort();
    assert.deepEqual(nos, ['MA-RE261000004', 'MA-RE261000005', 'MA-RE261000006', 'MA-RE261000007', 'MA-RE261000008', 'MA-RE261000009']);
    assert.equal(now.db.seq['MA-RE2610'], 9);
  });

  test('ตัวนับไม่ย้อน: ล้างข้อมูล (ลบตัวนับ) หรือกู้คืนข้อมูลเก่า (ตัวนับต่ำกว่า) แล้วเลขถัดไปยังต่อจากเลขสุดท้ายที่เคยออก (3.2, A7, F1)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const v = await open(shopId);
    const order = Object.keys(v.db.seq);
    const old = JSON.stringify(v.db);
    newReceipt(v, 'r1'); newReceipt(v, 'r2');
    assert.ok((await saveNumbered(v)).ok);

    // Restore the data from before the two receipts: the counter is kept at 5.
    v.db = JSON.parse(old);
    let r = await saveNumbered(v);
    assert.ok(r.ok);
    assert.deepEqual(r.counters, [['MA-RE2610', 5]]);
    assert.equal(v.db.seq['MA-RE2610'], 5);
    assert.equal(newReceipt(v, 'r3'), 'MA-RE261000006');
    assert.deepEqual((await saveNumbered(v)).renumbered, []);

    // Wipe: every counter is removed by the app and kept by the server, in the same order.
    v.db.seq = {};
    v.db.receipts = [];
    v.db.audit = [];
    r = await saveNumbered(v);
    assert.ok(r.ok);
    assert.deepEqual(Object.keys(v.db.seq), order);
    assert.equal(v.db.seq['MA-RE2610'], 6);
    const back = await open(shopId);
    assert.equal(JSON.stringify(back.db), JSON.stringify(v.db));

    // A browser that still numbers from 1 after the wipe gets the next free number.
    const w = await open(shopId);
    w.db.seq = {};
    assert.equal(newReceipt(w, 'r4'), 'MA-RE261000001');
    r = await saveNumbered(w);
    assert.deepEqual(r.renumbered, [['MA-RE261000001', 'MA-RE261000007']]);
    assert.equal(w.db.receipts.at(-1).no, 'MA-RE261000007');
    assert.equal(w.db.audit.at(-1).note, 'ออกใบเสร็จ MA-RE261000007');
    assert.deepEqual(Object.keys(w.db.seq), ['MA-RE2610', ...order.filter(k => k !== 'MA-RE2610')]);
    assert.equal(JSON.stringify((await open(shopId)).db), JSON.stringify(w.db));
  });

  test('เลขที่ที่ไม่ได้ออกในการบันทึกนี้ (พิมพ์อ้างถึง หรือของเอกสารเก่า) ไม่ถูกเปลี่ยน (3.2)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const a = await open(shopId), b = await open(shopId);
    newReceipt(a, 'ra');
    assert.ok((await saveNumbered(a)).ok);
    newReceipt(b, 'rb');
    b.db.receipts[0].note = 'อ้างถึง MA-RE261000004 และ MA-RE261000001';
    b.issued.push({ base: 'MA-RE2610', no: 'MA-RE261000009' });   // issued, but not in this save
    const r = await saveNumbered(b);
    assert.deepEqual(r.numbers, { 'MA-RE2610': ['MA-RE261000004'] });
    const now = await open(shopId);
    assert.equal(now.db.receipts.find(x => x.id === 'rb').no, 'MA-RE261000005');
    assert.equal(now.db.receipts[0].note, 'อ้างถึง MA-RE261000005 และ MA-RE261000001');
    assert.equal(now.db.seq['MA-RE2610'], 5);
  });

  test('เลขที่ออกแล้วแต่ตัวนับของเครื่องไม่ขยับ (ถูกแก้ระหว่างบันทึกหลังล้างข้อมูล): ยังได้เลขถัดไป ตัวนับขยับตาม และเลขเดียวกันในรายการเก่าไม่เปลี่ยน (3.2)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const v = await open(shopId);
    const old = v.db.audit.find(x => x.note.includes('MA-RE261000001'));
    assert.ok(old);
    v.db.receipts.push({ id: 'late', no: 'MA-RE261000001' });
    v.issued = [{ base: 'MA-RE2610', no: 'MA-RE261000001' }];
    const r = await saveNumbered(v);
    assert.deepEqual(r.renumbered, [['MA-RE261000001', 'MA-RE261000004']]);
    assert.deepEqual(r.counters, [['MA-RE2610', 4]]);
    const now = await open(shopId);
    assert.equal(now.db.receipts.at(-1).no, 'MA-RE261000004');
    assert.equal(now.db.audit.find(x => x.id === old.id).note, old.note);
    assert.equal(now.db.seq['MA-RE2610'], 4);
    assert.equal(JSON.stringify(now.db), JSON.stringify(v.db));
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

  test('ทุกการบันทึกเก็บประวัติของรายการที่เปลี่ยน พร้อมค่าก่อนและหลัง (3.1, R15)', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const v = await open(shopId);
    const edited = v.db.receipts[0], was = JSON.stringify(edited);
    edited.note = 'แก้แล้ว';
    v.db.cust.push({ id: 'new-cust', name: 'ลูกค้าใหม่' });
    const gone = v.db.cust.shift();
    v.db.cust.reverse(); v.db.cust.reverse();   // touched but the same
    assert.ok((await save(v)).ok);
    const log = await asApp(shopId, '', c => c.query(
      'select store_key, unit, key, op, version, before::text as before, after::text as after from change_log order by unit, key'));
    assert.deepEqual(log.rows.map(r => [r.store_key, r.unit, r.key, r.op, r.version]), [
      ['garage.v22', 'DB.cust', gone.id, 'delete', null],
      ['garage.v22', 'DB.cust', 'new-cust', 'insert', 1],
      ['garage.v22', 'DB.receipts', edited.id, 'update', 2],
    ]);
    const [removed, added, updated] = log.rows;
    assert.deepEqual(JSON.parse(removed.before), gone);
    assert.equal(removed.after, null);
    assert.equal(added.before, null);
    assert.deepEqual(JSON.parse(added.after), { id: 'new-cust', name: 'ลูกค้าใหม่' });
    assert.equal(updated.before, was);
    assert.equal(JSON.parse(updated.after).note, 'แก้แล้ว');
  });

  test('บันทึกที่ถูกปฏิเสธไม่เก็บประวัติ', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const a = await open(shopId), b = await open(shopId);
    a.db.receipts[0].note = 'A';
    assert.ok((await save(a)).ok);
    b.db.receipts[0].note = 'B';
    b.db.cust[0].name = 'B';
    assert.equal((await save(b)).ok, false);
    const units = await asApp(shopId, '', c => c.query('select unit from change_log'));
    assert.deepEqual(units.rows.map(r => r.unit), ['DB.receipts']);
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

  test('สำรองก่อนล้าง/กู้คืน/นำเข้า (3.2, F1): ไม่ถูกเขียนทับ อยู่ในรายชื่อ key และที่เก่ากว่า 90 วันถูกลบเมื่อสำรองครั้งใหม่', async () => {
    const { shopId } = await newShop('biz-trial', 'biz');
    const key = 'garage.v22.bak.safety-2026-10-13T09-00-00-wipe';
    await asApp(shopId, '', async c => {
      const before = (await readMain(c, '', 'garage.v22')).json;
      assert.equal(await makeBackup(c, '', key), true);
      assert.equal((await c.query(`update records set data = '"เปลี่ยนแล้ว"' where shop_id = app_shop() and unit = 'DB.pkgCutsV'`)).rowCount, 1);
      assert.equal(await makeBackup(c, '', key), true);
      assert.equal(await readBackup(c, '', key), before);
      await c.query("update backups set created_at = now() - interval '91 days' where shop_id = app_shop() and key = $1", [key]);
      assert.equal(await makeBackup(c, '', 'garage.v22.bak.2026-10-13'), true);
      assert.ok((await listKeys(c)).includes(key), 'a daily backup point leaves the copies alone');
      assert.equal(await makeBackup(c, '', 'garage.v22.bak.safety-2026-10-13T09-05-00-import'), true);
      assert.deepEqual((await listKeys(c)).filter(k => k.includes('.bak.')),
        ['garage.v22.bak.2026-10-13', 'garage.v22.bak.safety-2026-10-13T09-05-00-import']);
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
