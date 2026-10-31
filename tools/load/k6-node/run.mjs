// Runs a k6 script with Node instead of k6, for the parts of k6 tools/load/pilot.js uses (http.asyncRequest,
// check, Trend/Counter/Rate, exec.vu.idInTest, k6/timers, open, __ENV, a per-vu-iterations scenario, thresholds,
// handleSummary). For checking the script against a server where k6 is not installed (tools/load-test.mjs --node);
// the numbers of a load test are k6's.
//   node tools/load/k6-node/run.mjs <script> [-e NAME=value …]
import { register } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { context, metrics } from './state.mjs';

register('./hooks.mjs', import.meta.url);

const args = process.argv.slice(2), env = { ...process.env };
let script = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-e') { const [k, ...v] = args[++i].split('='); env[k] = v.join('='); } else if (!script) script = resolve(args[i]);
}
if (!script) throw new Error('usage: node tools/load/k6-node/run.mjs <script> [-e NAME=value …]');
globalThis.__ENV = env;
globalThis.open = p => readFileSync(resolve(dirname(script), p), 'utf8');
Object.defineProperty(globalThis, '__VU', { get: () => context.getStore()?.vu ?? 0 });

const mod = await import(pathToFileURL(script).href);
const sc = Object.values(mod.options?.scenarios || {})[0] || { vus: 1, iterations: 1 };
if (sc.executor && sc.executor !== 'per-vu-iterations') throw new Error(`k6-node runs per-vu-iterations only, not ${sc.executor}`);
const started = Date.now();
const data = mod.setup ? await mod.setup() : undefined;
await Promise.all(Array.from({ length: sc.vus || 1 }, (_, n) => context.run({ vu: n + 1 }, async () => {
  for (let i = 0; i < (sc.iterations || 1); i++) {
    try { await mod.default(data); } catch (e) { console.error(`VU ${n + 1}: ${e.stack || e}`); metrics.get('failures')?.add?.(1); }
  }
})));
if (mod.teardown) await mod.teardown(data);

// The summary as k6 hands it to handleSummary (the fields pilot.js reads).
const stats = mod.options?.summaryTrendStats || ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'];
const pct = (s, p) => s.length ? s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] : 0;
const valuesOf = m => {
  const s = m.samples;
  if (m.type === 'trend') {
    const sorted = [...s].sort((a, b) => a - b), v = {};
    for (const st of stats) {
      if (st === 'avg') v.avg = s.reduce((a, b) => a + b, 0) / (s.length || 1);
      else if (st === 'min') v.min = sorted[0] ?? 0;
      else if (st === 'max') v.max = sorted[sorted.length - 1] ?? 0;
      else if (st === 'med') v.med = pct(sorted, 50);
      else if (st === 'count') v.count = s.length;
      else if (/^p\((\d+(\.\d+)?)\)$/.test(st)) v[st] = pct(sorted, Number(st.slice(2, -1)));
    }
    return v;
  }
  if (m.type === 'counter') { const count = s.reduce((a, b) => a + b, 0); return { count, rate: count / ((Date.now() - started) / 1000) }; }
  const passes = s.filter(Boolean).length;
  return { rate: s.length ? passes / s.length : 0, passes, fails: s.length - passes };
};
const out = { metrics: {}, state: { testRunDurationMs: Date.now() - started } };
let failedThresholds = 0;
for (const [name, m] of metrics) {
  const values = valuesOf(m);
  const entry = { type: m.type, contains: m.time ? 'time' : 'default', values };
  const th = mod.options?.thresholds?.[name];
  if (th) {
    entry.thresholds = {};
    for (const expr of th) {
      const [, stat, op, num] = expr.match(/^\s*([a-z]+(?:\([\d.]+\))?)\s*(<=|>=|==|!=|<|>)\s*([\d.]+)\s*$/) || [];
      const v = values[stat];
      const ok = v === undefined ? m.samples.length === 0 && (stat === 'count')
        : { '<': v < +num, '<=': v <= +num, '>': v > +num, '>=': v >= +num, '==': v === +num, '!=': v !== +num }[op];
      entry.thresholds[expr] = { ok: !!ok };
      if (!ok) failedThresholds++;
    }
  }
  out.metrics[name] = entry;
}
// A threshold on a metric nothing was added to (no failures) holds, as in k6.
for (const [name, list] of Object.entries(mod.options?.thresholds || {})) if (!out.metrics[name])
  out.metrics[name] = { type: 'counter', values: { count: 0 }, thresholds: Object.fromEntries(list.map(e => [e, { ok: /count\s*==\s*0|count\s*<|rate\s*</.test(e) }])) };
const written = mod.handleSummary ? await mod.handleSummary(out) : { stdout: JSON.stringify(out, null, 1) };
for (const [where, text] of Object.entries(written)) {
  if (where === 'stdout') process.stdout.write(text + '\n');
  else if (where === 'stderr') process.stderr.write(text + '\n');
  else writeFileSync(where, text);
}
process.exit(failedThresholds ? 99 : 0);
