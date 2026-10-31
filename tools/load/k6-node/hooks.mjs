// Module hooks of tools/load/k6-node/run.mjs: k6's modules are its own files.
const SHIMS = { k6: 'k6.mjs', 'k6/http': 'http.mjs', 'k6/metrics': 'metrics.mjs', 'k6/execution': 'execution.mjs', 'k6/timers': 'timers.mjs' };
export async function resolve(specifier, ctx, next) {
  if (SHIMS[specifier]) return { url: new URL(SHIMS[specifier], import.meta.url).href, shortCircuit: true };
  if (/^k6(\/|$)/.test(specifier)) throw new Error(`k6-node has no ${specifier}`);
  return next(specifier, ctx);
}
