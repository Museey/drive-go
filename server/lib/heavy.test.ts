// lib/heavy.ts: requests that hold a shop's whole data run at most two at a time, the others in the order they came.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Busy, heavy, heavyNow, heavyOrBusy } from './heavy.ts';

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

test('คำขอที่รอคิวนานเกินกำหนด หรือเบราว์เซอร์ยกเลิกแล้ว เลิกรอ ได้ 503 และไม่กินคิว (SECURITY-AUDIT ก1)', async () => {
  const tick = () => new Promise(r => setImmediate(r));
  const gates: (() => void)[] = [];
  const hold = () => heavy(() => new Promise<string>(go => gates.push(() => go('held'))));
  const a = hold(), b = hold();
  await tick();
  assert.deepEqual(heavyNow(), { running: 2, waiting: 0 });
  // Waits 50 ms, then gives up.
  await assert.rejects(heavy(async () => 'never', { waitMs: 50 }), Busy);
  assert.deepEqual(heavyNow(), { running: 2, waiting: 0 });
  // Its browser went away while it waited: answered 503 at once, the queue is as before.
  const ctl = new AbortController();
  const gone = heavyOrBusy(async () => new Response('never'), ctl.signal);
  await tick();
  assert.deepEqual(heavyNow(), { running: 2, waiting: 1 });
  ctl.abort();
  assert.equal((await gone).status, 503);
  assert.deepEqual(heavyNow(), { running: 2, waiting: 0 });
  // One that waits patiently still gets the next turn.
  const c = heavy(async () => 'c');
  gates[0]();
  assert.deepEqual(await Promise.all([a, c]), ['held', 'c']);
  gates[1]();
  assert.equal(await b, 'held');
  assert.deepEqual(heavyNow(), { running: 0, waiting: 0 });
});
