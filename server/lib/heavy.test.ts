// lib/heavy.ts: requests that hold a shop's whole data run at most two at a time, the others in the order they came.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heavy, heavyNow } from './heavy.ts';

test('งานที่อ่านข้อมูลทั้งก้อนทำพร้อมกันได้ไม่เกิน 2 งาน งานที่เหลือรอตามลำดับ งานที่ล้มก็คืนคิว', async () => {
  const order: string[] = [];
  let most = 0;
  const gates = new Map<string, () => void>();
  const job = (name: string, fail = false) => heavy(async () => {
    order.push(`start ${name}`);
    most = Math.max(most, heavyNow().running);
    await new Promise<void>(go => gates.set(name, go));
    order.push(`end ${name}`);
    if (fail) throw new Error(name);
    return name;
  });
  const tick = () => new Promise(r => setImmediate(r));
  const all = [job('a', true), job('b'), job('c'), job('d')].map(p => p.catch(e => `failed ${e.message}`));
  await tick();
  assert.deepEqual(heavyNow(), { running: 2, waiting: 2 });
  gates.get('a')!(); await tick(); await tick();
  assert.deepEqual(heavyNow(), { running: 2, waiting: 1 });
  gates.get('b')!(); await tick(); await tick();
  gates.get('c')!(); await tick(); await tick();
  gates.get('d')!();
  assert.deepEqual(await Promise.all(all), ['failed a', 'b', 'c', 'd']);
  assert.equal(most, 2);
  assert.deepEqual(order, ['start a', 'start b', 'end a', 'start c', 'end b', 'start d', 'end c', 'end d']);
  assert.deepEqual(heavyNow(), { running: 0, waiting: 0 });
});
