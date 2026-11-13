// lib/chunks.ts: a save's rows go to the database in groups of at most 2 MB of data or 2,000 rows, in their order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunks } from './chunks.ts';

test('แถวของการบันทึกแบ่งเป็นชุดละไม่เกิน 2 MB หรือ 2,000 แถว ตามลำดับเดิม แถวเดียวที่ใหญ่กว่า 2 MB อยู่ชุดของตัวเอง', () => {
  const MB = 1024 * 1024;
  const sizes = [MB, MB, 1, 3 * MB, 10, 10];
  const parts = chunks(sizes.map((n, i) => ({ i, n })), r => r.n);
  assert.deepEqual(parts.map(p => p.map(r => r.i)), [[0, 1], [2], [3], [4, 5]]);
  const many = chunks(Array.from({ length: 4500 }, (_, i) => i), () => 10);
  assert.deepEqual(many.map(p => p.length), [2000, 2000, 500]);
  assert.deepEqual(many.flat(), Array.from({ length: 4500 }, (_, i) => i));
  assert.deepEqual(chunks([], () => 1), []);
});
