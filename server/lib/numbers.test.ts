// Document numbers issued on the server (task 3.2): the pieces the server and
// the browser share.
//   node --test server/lib/numbers.test.ts   (npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { baseOf, claimsIn, correctSplit, renumberText, rowsToRenumber, shiftLater } from './numbers.ts';
import { diff, eachRecord, rootOf, split } from './units.ts';

const stored: { name: string; key: string; json: string }[] = [];
for (const name of ['biz-trial', 'prox-trial', 'franchise-trial', 'biz-full']) {
  const file = new URL(`../../tests/fixtures/${name}.json`, import.meta.url);
  if (!existsSync(file)) continue;
  const state = JSON.parse(readFileSync(file, 'utf8'));
  for (const db of state.origins[0].indexedDB) for (const st of db.stores) for (const r of st.records)
    if (rootOf(r.key)) stored.push({ name, key: r.key, json: r.value });
}
const biz = stored.find(x => x.name === 'biz-trial' && x.key === 'garage.v22')!;

test('เปลี่ยนเลขพร้อมกันทีเดียว (15→16 และ 16→17 ไม่กลายเป็น 15→17) เฉพาะเลขที่เขียนเต็มตัว', () => {
  const text = 'MA-RE261000015 MA-RE261000016 MA-RE2610000150 XMA-RE261000015 MA-RE261000015-R1 "MA-RE261000016"';
  assert.equal(renumberText(text, [['MA-RE261000015', 'MA-RE261000016'], ['MA-RE261000016', 'MA-RE261000017']]),
    'MA-RE261000016 MA-RE261000017 MA-RE2610000150 XMA-RE261000015 MA-RE261000016-R1 "MA-RE261000017"');
});

test('ตัวนับของเลขที่ที่เพิ่งออก คือตัวนับที่ค่าตรงกับเลขลำดับ', () => {
  const seq = { 'MA-SA2610': 15, 'MA-SA261': 3, 'MA-RE2610': 4 };
  assert.equal(baseOf(seq, 'MA-SA261000015'), 'MA-SA2610');
  assert.equal(baseOf(seq, 'MA-RE261000004'), 'MA-RE2610');
  assert.equal(baseOf(seq, 'MA-RE261000003'), undefined);
  assert.equal(baseOf({ 'MA-SA2610': 100000 }, 'MA-SA2610100000'), 'MA-SA2610');
});

test('ส่งเฉพาะเลขที่ออกแล้วที่อยู่ในข้อมูลที่บันทึก เรียงตามลำดับ', () => {
  const issued = [{ base: 'MA-RE2610', no: 'MA-RE261000006' }, { base: 'MA-RE2610', no: 'MA-RE261000005' },
    { base: 'MA-RE2610', no: 'MA-RE261000007' }, { base: 'MA-QT2610', no: 'MA-QT261000009' }];
  assert.deepEqual(claimsIn(issued, '{"a":"MA-RE261000005","b":"MA-RE261000006 MA-QT261000009"}'),
    { 'MA-RE2610': ['MA-RE261000005', 'MA-RE261000006'], 'MA-QT2610': ['MA-QT261000009'] });
});

test('เลขที่ออกหลังบันทึกที่ถูกแก้ ขยับไปต่อท้ายตัวนับใหม่ถ้าชนกัน', () => {
  const later = [{ base: 'MA-RE2610', no: 'MA-RE261000016' }, { base: 'MA-RE2610', no: 'MA-RE261000017' }];
  assert.deepEqual(shiftLater(later, [['MA-RE2610', 16]]),
    { renumbered: [['MA-RE261000016', 'MA-RE261000017'], ['MA-RE261000017', 'MA-RE261000018']], counters: [['MA-RE2610', 18]] });
  assert.deepEqual(shiftLater(later, [['MA-RE2610', 15]]), { renumbered: [], counters: [['MA-RE2610', 17]] });
  assert.deepEqual(shiftLater([], [['MA-QT2610', 9]]), { renumbered: [], counters: [['MA-QT2610', 9]] });
});

test('ทุกแถวที่แบ่งได้มีรายการตัวจริงในข้อมูลของแอป (หน่วยและ key เดียวกัน ค่าเดียวกัน) ทุก fixture', () => {
  for (const { name, key, json } of stored) {
    const s = split(key, json, { keepSecrets: true });
    const live = new Map<string, string>();
    eachRecord(key, JSON.parse(json), (unit, k, get) => live.set(`${unit}|${k}`, JSON.stringify(get())));
    assert.deepEqual(live, new Map(s.rows.map(r => [`${r.unit}|${r.key}`, r.data])), `${name} ${key}`);
  }
});

test('แก้เลขเฉพาะแถวที่บันทึกนั้นเขียนและแถวที่เปลี่ยนหลังจากนั้น ตัวนับตั้งที่เดิมหรือต่อท้าย รหัสผ่านและข้อมูลอื่นอยู่ครบทุกไบต์', () => {
  const key = biz.key, before = split(key, biz.json);
  const db = JSON.parse(biz.json);
  db.receipts.push({ id: 'new', no: 'MA-RE261000001' });   // the same number as an older record's
  db.emp[0].pin = '9999';
  delete db.seq['MA-BL2610'];
  const value = JSON.stringify(db), next = split(key, value), changes = diff(before, next);
  const text = correctSplit(key, next, rowsToRenumber(next, changes, next), [['MA-RE261000001', 'MA-RE261000004']],
    [['MA-RE2610', 4], ['MA-BL2610', 1]]);
  const want = JSON.parse(value);
  want.receipts.at(-1).no = 'MA-RE261000004';
  want.seq['MA-RE2610'] = 4;
  want.seq['MA-BL2610'] = 1;
  assert.equal(text, JSON.stringify(want));
  assert.ok(text.includes('"pin":"9999"'));
  assert.ok(want.audit.some((x: { note: string }) => x.note.includes('MA-RE261000001')));
});
