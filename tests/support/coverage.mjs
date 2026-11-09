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

// Which inline handlers of the page (onclick="…", onchange="…" and the like)
// a scenario actually fired. Coverage alone cannot tell: a button counts as
// used only when the user pressed it, not when the functions it calls ran
// from another button. Each handler is reported once per page load as
// "<event>\n<attribute text>" through the binding window.__drivegoTrigger.
export const TRIGGER_EVENTS = ['click', 'change', 'input', 'submit', 'keyup', 'keydown', 'keypress', 'blur', 'focus',
  'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'contextmenu', 'paste', 'drop', 'dragover', 'dragstart', 'load',
  'error', 'toggle', 'search'];
export function triggerRecorderInitScript(events) {
  const seen = new Set();
  for (const type of events)
    document.addEventListener(type, e => {
      for (const el of e.composedPath()) {
        if (!el || el.nodeType !== 1) continue;
        let code = el.getAttribute('on' + type);
        // A handler set as a property (el.onchange = fn): "<event>\nfn:<the function's source>"
        if (code == null && typeof el['on' + type] === 'function') code = 'fn:' + Function.prototype.toString.call(el['on' + type]);
        if (code == null) continue;
        const key = type + '\n' + code;
        if (seen.has(key)) continue;
        seen.add(key);
        if (typeof window.__drivegoTrigger === 'function') window.__drivegoTrigger(key);
      }
    }, true);
}
