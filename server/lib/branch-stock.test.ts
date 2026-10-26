import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataToMain, stockToBranch, stockToMain } from './branch-stock.ts';

test('สลับสต๊อกไปสาขาที่ทำงานแล้วกลับเป็นแบบที่ server เก็บ ได้แถวเดิมทุกไบต์เมื่อไม่ได้แก้อะไร', () => {
  const stored = { id: 's1', code: 'MS-1', qty: 5, min: 1, zone: 'A', bq: { b2: { qty: 2, min: 0, max: 0, zone: 'C', shelf: '', loc: '', lastMove: '' } } };
  const inB2 = stockToBranch(stored, 'b2');
  assert.equal(inB2.qty, 2);
  assert.equal(inB2.zone, 'C');
  assert.deepEqual((inB2.bq as any).main, { qty: 5, min: 1, max: 0, zone: 'A', shelf: '', loc: '', lastMove: '' });
  assert.equal((inB2.bq as any).b2, undefined);
  assert.equal(stockToMain(inB2, 'b2', stored), stored);
  // a record with no values for the branch yet: swapping adds empty ones, which are not a change
  const plain = { id: 's2', qty: 3 };
  assert.equal(stockToMain(stockToBranch(plain, 'b2'), 'b2', plain), plain);
});

test('ขายที่สาขา b2 แล้วเปลี่ยนเฉพาะยอดของ b2 ยอดสาขาหลักอยู่ในแถวเหมือนเดิม', () => {
  const stored = { id: 's1', qty: 5, bq: { b2: { qty: 2, min: 0, max: 0, zone: '', shelf: '', loc: '', lastMove: '' } } };
  const inB2 = stockToBranch(stored, 'b2');
  inB2.qty = 1;
  const back = stockToMain(inB2, 'b2', stored) as any;
  assert.notEqual(back, stored);
  assert.equal(back.qty, 5);
  assert.equal(back.bq.b2.qty, 1);
  assert.equal(back.bq.main, undefined);
});

test('ข้อมูลทั้งชุดของคนที่ทำงานสาขาอื่น กลับเป็นแบบที่ server เก็บ (stockCtx main) สาขาหลักไม่ต้องแปลง', () => {
  const s1 = { id: 's1', qty: 5 }, s2 = { id: 's2', qty: 0, bq: { b2: { qty: 4, min: 0, max: 0, zone: '', shelf: '', loc: '', lastMove: '' } } };
  const db: any = { stock: [stockToBranch(s1, 'b2'), stockToBranch(s2, 'b2')], stockCtx: 'b2' };
  assert.equal(dataToMain(db, new Map([['s1', s1], ['s2', s2]])), true);
  assert.equal(db.stockCtx, 'main');
  assert.equal(db.stock[0], s1);
  assert.equal(db.stock[1], s2);
  const main: any = { stock: [s1], stockCtx: 'main' };
  assert.equal(dataToMain(main, new Map()), false);
  assert.equal(main.stock[0], s1);
});
