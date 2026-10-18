// Splitting the legacy data into rows and putting it back (design §3.2, task T5).
//   node --test server/lib/units.test.ts   (npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { SECRET_PLACEHOLDER, assemble, diff, rootOf, split } from './units.ts';

// Every main STORE key of every fixture, as the legacy app saved it.
const fixtures = ['biz-trial', 'prox-trial', 'franchise-trial', 'biz-full'];
const stored: { name: string; key: string; json: string }[] = [];
for (const name of fixtures) {
  const file = new URL(`../../tests/fixtures/${name}.json`, import.meta.url);
  if (!existsSync(file)) { console.log(`# ${name}.json not found (npm run fixture -- biz full makes it); not checked`); continue; }
  const state = JSON.parse(readFileSync(file, 'utf8'));
  for (const db of state.origins[0].indexedDB) for (const st of db.stores) for (const r of st.records)
    if (rootOf(r.key)) stored.push({ name, key: r.key, json: r.value });
}

test('แบ่งแล้วประกอบกลับได้ข้อความเดิมทุกไบต์ ทุก key ของทุก fixture', () => {
  assert.ok(stored.length >= 9);
  for (const { name, key, json } of stored) {
    const s = split(key, json);
    assert.equal(assemble(key, s.layout, s.rows, { session: s.session, secrets: s.secrets }), json, `${name} ${key}`);
  }
});

test('รหัสผ่านไม่อยู่ในแถวที่จะเก็บ และประกอบโดยไม่ใส่รหัสคืนจะได้ค่าแทน', () => {
  for (const { name, key, json } of stored) {
    const s = split(key, json);
    for (const sec of s.secrets) {
      const row = s.rows.find(r => r.unit === sec.unit && r.key === sec.key)!;
      assert.equal(JSON.parse(row.data)[sec.field], SECRET_PLACEHOLDER, `${name} ${sec.unit} ${sec.key}`);
    }
    const out = JSON.parse(assemble(key, s.layout, s.rows, { session: s.session }));
    if (key === 'dgb.v22' && out.shop) assert.equal(out.shop.pass, SECRET_PLACEHOLDER);
    if (key === 'franchise.v22') for (const a of out.accounts) assert.equal(a.pass, a.pass ? SECRET_PLACEHOLDER : a.pass);
  }
  const fr = stored.find(x => x.name === 'franchise-trial' && x.key === 'franchise.v22')!;
  const s = split(fr.key, fr.json);
  assert.deepEqual(s.secrets.map(x => `${x.unit}/${x.field}`), Array(4).fill('FR.accounts/pass'));
  assert.ok(!s.rows.some(r => r.data.includes('"pass":"1234"')));
});

test('ช่องของคนที่เข้าระบบอยู่ (session) ไม่อยู่ในแถวของร้าน และไม่ใส่ค่าก็ได้ค่าเริ่มต้น', () => {
  const json = JSON.stringify({ stock: [], curEmp: 'emp1', shop: { name: 'x' } });
  const s = split('garage.v22', json);
  assert.deepEqual(s.session, { 'DB.curEmp': '"emp1"' });
  assert.ok(!s.rows.some(r => r.unit === 'DB.curEmp'));
  assert.equal(assemble('garage.v22', s.layout, s.rows), '{"stock":[],"curEmp":"","shop":{"name":"x"}}');
});

test('id ซ้ำในรายการเดียวกันเป็นคนละแถว (พบในข้อมูล 36 เดือน) และลำดับคงเดิม', () => {
  const json = JSON.stringify({ moves: [{ id: 'a', q: 1 }, { id: 'b' }, { id: 'a', q: 2 }, { q: 3 }, { id: 'a', q: 4 }] });
  const s = split('garage.v22', json);
  assert.deepEqual(s.rows.map(r => r.key), ['a', 'b', 'a#2', '#3', 'a#3']);
  assert.equal(assemble('garage.v22', s.layout, s.rows), json);
});

test('แต่ละชนิดแบ่งเป็นแถวตามตาราง: รายการ, ผังบัญชีตามรหัส, ตัวนับ, กลุ่มซ้อน, ทั้งก้อน', () => {
  const json = JSON.stringify({
    receipts: [{ id: 'r1', no: 'MA-RE1' }], coa: [{ code: '1000', name: 'เงินสด' }], seq: { 'MA-RE2610': 3, 'MA-QT2610': 1 },
    px: { queue: [{ id: 'q1' }], shop: { name: 'p' }, seq: 4 }, fifo: { v: 1, lots: [{ id: 'l1' }], allocs: [] },
    shop: { name: 'ร้าน' }, curBranch: 'main', newThing: [1, 2],
  });
  const s = split('garage.v22', json);
  assert.deepEqual(s.rows.map(r => `${r.unit}|${r.key}`), [
    'DB.receipts|r1', 'DB.coa|1000', 'DB.seq|MA-RE2610', 'DB.seq|MA-QT2610', 'DB.px.queue|q1', 'DB.px.shop|', 'DB.px.seq|',
    'DB.fifo.v|', 'DB.fifo.lots|l1', 'DB.shop|', 'DB.curBranch|', 'DB.newThing|']);
  assert.equal(assemble('garage.v22', s.layout, s.rows), json);
});

test('ช่องที่ปกติเป็นรายการแต่ค่าไม่ใช่รายการ ก็เก็บทั้งก้อนแล้วประกอบกลับได้', () => {
  for (const v of [null, {}, 'x', [1, 2], [{ id: 1 }, 2]]) {
    const json = JSON.stringify({ receipts: v, seq: v });
    const s = split('garage.v22', json);
    assert.equal(assemble('garage.v22', s.layout, s.rows), json, JSON.stringify(v));
  }
});

test('ส่วนต่าง: แก้ เพิ่ม ลบ แล้วบอกเฉพาะแถวที่เปลี่ยน ไม่ต้องส่งลำดับถ้าเพิ่มต่อท้าย', () => {
  const a = split('garage.v22', JSON.stringify({ receipts: [{ id: 'r1', paid: false }, { id: 'r2' }, { id: 'r3' }], seq: { A: 1 }, shop: { n: 1 } }));
  const b = split('garage.v22', JSON.stringify({ receipts: [{ id: 'r1', paid: true }, { id: 'r3' }, { id: 'r4' }], seq: { A: 2, B: 1 }, shop: { n: 1 } }));
  const d = diff(a, b);
  assert.equal(d.layout, undefined);
  assert.deepEqual(d.upsert.map(r => `${r.unit}|${r.key}`), ['DB.receipts|r1', 'DB.receipts|r4', 'DB.seq|A', 'DB.seq|B']);
  assert.deepEqual(d.remove, [{ unit: 'DB.receipts', key: 'r2' }]);
  assert.deepEqual(d.order, {});
  assert.deepEqual(diff(a, a), { upsert: [], remove: [], order: {} });
});

test('ส่วนต่าง: ลำดับเปลี่ยนหรือแทรกกลางต้องส่งลำดับทั้งชุดของหน่วยนั้น และช่องใหม่ส่ง layout', () => {
  const a = split('garage.v22', JSON.stringify({ receipts: [{ id: 'r1' }, { id: 'r2' }] }));
  const swapped = split('garage.v22', JSON.stringify({ receipts: [{ id: 'r2' }, { id: 'r1' }] }));
  const inserted = split('garage.v22', JSON.stringify({ receipts: [{ id: 'r0' }, { id: 'r1' }, { id: 'r2' }], qPresets: { probs: [] } }));
  assert.deepEqual(diff(a, swapped).order, { 'DB.receipts': ['r2', 'r1'] });
  const d = diff(a, inserted);
  assert.deepEqual(d.order, { 'DB.receipts': ['r0', 'r1', 'r2'] });
  assert.equal(d.layout, '[["receipts","L"],["qPresets","D"]]');
});

test('ส่วนต่างของข้อมูล 36 เดือน: แก้ใบเสร็จใบเดียวส่งแถวเดียว', { skip: !stored.some(x => x.name === 'biz-full') && 'biz-full.json not built' }, () => {
  const full = stored.find(x => x.name === 'biz-full' && x.key === 'garage.v22')!;
  const before = split(full.key, full.json);
  const db = JSON.parse(full.json);
  db.receipts[100].note = 'แก้ไข';
  const t = Date.now();
  const d = diff(before, split(full.key, JSON.stringify(db)));
  console.log(`# 36-month data: split + diff ${Date.now() - t} ms`);
  assert.deepEqual(d.upsert.map(r => r.key), [db.receipts[100].id]);
  assert.deepEqual(d.remove, []);
});

test('key ที่ไม่ใช่ข้อมูลหลักไม่ถูกแบ่ง', () => {
  assert.equal(rootOf('garage.v22::B002'), 'DB');
  assert.equal(rootOf('garage.v22.bak.2026-10-13'), null);
  assert.equal(rootOf('dgb.guide.v22'), null);
  assert.throws(() => split('garage.v22.trialkeep', '{}'));
});
