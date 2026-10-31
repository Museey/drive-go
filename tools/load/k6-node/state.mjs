// What the k6 stand-ins share: the running VU and the metrics.
import { AsyncLocalStorage } from 'node:async_hooks';
export const context = new AsyncLocalStorage();
export const metrics = new Map();   // name -> { type, time, samples, add }
export function metric(name, type, time = false) {
  if (!metrics.has(name)) {
    const m = { type, time, samples: [] };
    m.add = (v) => { m.samples.push(type === 'rate' ? !!v : Number(v)); };
    metrics.set(name, m);
  }
  return metrics.get(name);
}
