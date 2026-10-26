// Hearing the other devices' saves (task 3.10, ./live.ts), in a pretend browser: the stream is driven by the test.
//   node --test server/client/live.test.ts   (npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { type LiveMain, createLive } from './live.ts';
import { split } from '../lib/units.ts';

const KEY = 'garage.v22';
class Source extends EventTarget {
  static last: Source;
  constructor() { super(); Source.last = this; }
  close() {}
}
const g = globalThis as Record<string, unknown>;
g.window = new EventTarget();
g.document = { body: null };
g.EventSource = Source;
g.KEY = KEY;
const every = setInterval;
g.setInterval = (f: () => void, ms: number) => every(f, ms).unref();

// The shop's data on the server: what a read of the key gives.
function server(db: object, version: number) {
  const json = JSON.stringify(db), s = split(KEY, json);
  const base: Record<string, number> = {};
  for (const r of s.rows) base[`${r.unit}|${r.key}`] = version;
  return { value: json, sent: json, last: s, base, cursor: version } as LiveMain;
}

test('อ่านข้อมูลใหม่ทั้งก้อนแล้วรอไว้ระหว่างหน้าจอไม่ว่าง ถ้าแอปบันทึกเองหลังจากนั้น ตอนใส่จะอ่านใหม่ ไม่ทับสิ่งที่แอปเพิ่งบันทึก', async () => {
  const a = { id: 'a', code: 'A' }, b = { id: 'b', code: 'B' };
  let onServer = server({ stock: [a] }, 1), reads = 0;
  const m: LiveMain = server({ stock: [a] }, 1);
  g.DB = { stock: [{ ...a }] };
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(job: () => Promise<T>) => { const run = queue.then(job); queue = run.catch(() => {}); return run; };
  const idle = () => enqueue(async () => {});
  const live = createLive({
    mains: new Map([[KEY, m]]), enqueue, problems: [],
    send: async () => { throw new Error('no rows are asked for'); },
    read: async () => { reads++; return { ...onServer }; },
    mustReload: async (text: string) => { throw new Error(text); },
  });
  let busy = true;
  live.api.setBusy(() => busy);
  live.start(1);

  // Too much missed: read again whole, and wait (a form page is open).
  Source.last.dispatchEvent(new Event('resync'));
  await idle();
  assert.equal(reads, 1);
  assert.equal(live.api.waiting, true);

  // The app adds B and saves it; its save step is in the queue behind the screens' "put it in now".
  busy = false;
  const putIn = live.api.apply();
  (g.DB as { stock: object[] }).stock.push({ ...b });
  m.waiting = 1;
  void enqueue(async () => { onServer = server({ stock: [a, b] }, 2); m.sends = 1; m.waiting = 0; });
  await putIn;
  await idle();
  await idle();

  assert.equal(reads, 2, 'read again after the app saved');
  assert.deepEqual((g.DB as { stock: { code: string }[] }).stock.map(x => x.code), ['A', 'B']);
  assert.equal(live.api.waiting, false);
  live.stop();
});
