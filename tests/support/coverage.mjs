// Turns Chromium JS coverage for the legacy page into "function name + line in
// DRIVEGO_TRIAL_v24.html" for every function that ran at least once.
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../legacy/DRIVEGO_TRIAL_v24.html', import.meta.url), 'utf8');
const lineStarts = [0];
for (let i = 0; i < html.length; i++) if (html.charCodeAt(i) === 10) lineStarts.push(i + 1);
const lineAt = offset => {
  let lo = 0, hi = lineStarts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1; }
  return lo + 1;
};
const scriptOffsets = new Map();

export function executedFunctions(entries) {
  const out = [];
  for (const e of entries) {
    if (!e.source) continue;
    let base = scriptOffsets.get(e.source);
    if (base === undefined) { base = html.indexOf(e.source); scriptOffsets.set(e.source, base); }
    if (base < 0) continue; // not one of the HTML's own <script> blocks
    for (const f of e.functions) {
      const r = f.ranges[0];
      if (r && r.count > 0) out.push({ name: f.functionName, line: lineAt(base + r.startOffset) });
    }
  }
  return out;
}
