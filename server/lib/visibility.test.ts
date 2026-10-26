// What a person may not see (task 3.9): masking the rows the server sends, and putting the stored values back
// into the rows that person saves.
//   node --test server/lib/visibility.test.ts   (npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { split } from './units.ts';
import { EMP_PRIVATE, maskRow, maskRows, masksFor, restoreRow } from './visibility.ts';

const state = JSON.parse(readFileSync(new URL('../../tests/fixtures/biz-trial.json', import.meta.url), 'utf8'));
let json = '';
for (const db of state.origins[0].indexedDB) for (const st of db.stores) for (const r of st.records) if (r.key === 'garage.v22') json = r.value;
const rows = split('garage.v22', json).rows;
const emp = rows.filter(r => r.unit === 'DB.emp');
const self = JSON.parse(emp[2].data).id as string;

test('without the pay right, other employees come without pay and personal data; their own record stays whole', () => {
  const masks = masksFor({ owner: false, pay: false, self });
  for (const r of maskRows(emp, masks)) {
    const was = JSON.parse(emp.find(x => x.key === r.key)!.data), now = JSON.parse(r.data);
    assert.deepEqual(Object.keys(now), Object.keys(was), 'every field stays where it was');
    for (const [f, v] of Object.entries(was)) {
      if (r.key !== self && EMP_PRIVATE.includes(f)) assert.equal(now[f], null, `${r.key}.${f}`);
      else assert.deepEqual(now[f], v, `${r.key}.${f}`);
    }
  }
  assert.ok(JSON.parse(emp[0].data).salary > 0 && JSON.parse(maskRow(emp[0], masks).data).salary === null);
});

test('with the pay right (or as the owner) nothing of the employees is masked', () => {
  for (const r of [{ owner: false, pay: true, self }, { owner: true, pay: true, self: '' }])
    assert.deepEqual(maskRows(emp, masksFor(r)), emp);
});

test('a payroll period keeps its totals; its lines are an empty list', () => {
  const period = { unit: 'DB.payroll', key: 'p1', data: JSON.stringify({ id: 'p1', month: '2026-10', lines: [{ empId: 'a', salary: 25000 }], totals: { n: 1, gross: 25000 } }) };
  const masked = JSON.parse(maskRow(period, masksFor({ owner: false, pay: false, self })).data);
  assert.deepEqual(masked, { id: 'p1', month: '2026-10', lines: [], totals: { n: 1, gross: 25000 } });
});

test('a saved row gets the stored values back where they were masked; the rest is what was sent', () => {
  const masks = masksFor({ owner: false, pay: false, self });
  const other = emp[0], seen = JSON.parse(maskRow(other, masks).data);
  seen.perms.doc.discount = !seen.perms.doc.discount;   // what the person changed
  seen.salary = 1;                                       // a hidden value cannot be changed
  const back = JSON.parse(restoreRow({ ...other, data: JSON.stringify(seen) }, other.data, masks).data);
  const want = JSON.parse(other.data);
  want.perms.doc.discount = seen.perms.doc.discount;
  assert.deepEqual(back, want);
  assert.equal(restoreRow({ ...other, data: JSON.stringify(seen) }, other.data, masks).data, JSON.stringify(want), 'the same text, in the same order');
  // a new record keeps what it came with
  assert.equal(restoreRow({ unit: 'DB.emp', key: 'new', data: '{"id":"new","salary":9}' }, undefined, masks).data, '{"id":"new","salary":9}');
  // the person's own record is not touched
  const mine = emp.find(r => r.key === self)!, changed = { ...mine, data: JSON.stringify({ ...JSON.parse(mine.data), tel: '0' }) };
  assert.equal(restoreRow(changed, mine.data, masks), changed);
});

test('lists inside a record are reached element by element', () => {
  const masks = [{ unit: 'DB.x', paths: ['items[].cost'] }];
  const row = { unit: 'DB.x', key: 'a', data: JSON.stringify({ items: [{ cost: 5, q: 1 }, { q: 2 }, { cost: 7 }] }) };
  const seen = maskRow(row, masks);
  assert.deepEqual(JSON.parse(seen.data), { items: [{ cost: null, q: 1 }, { q: 2 }, { cost: null }] });
  assert.equal(restoreRow(seen, row.data, masks).data, row.data);
});

test('the owner sees the national id on the shop account; nobody else does', () => {
  const shop = { unit: 'DGB.shop', key: '', data: '{"owner":"ก","idcard":"1234"}' };
  assert.equal(maskRow(shop, masksFor({ owner: true, pay: true, self: '' })).data, shop.data);
  assert.equal(maskRow(shop, masksFor({ owner: false, pay: true, self: '' })).data, '{"owner":"ก","idcard":null}');
});
