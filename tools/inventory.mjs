// Builds the list of everything the legacy app can do, so nothing is
// forgotten during the migration:
//
//   docs/behaviors.csv   one row per function and per UI handler
//   docs/BEHAVIORS.md    summary in Thai
//
// Static part (acorn over the 55 <script> blocks and the markup):
//   - top-level functions, how many times each name is declared (the last one
//     wins), and every place that assigns or wraps it later
//   - which functions save data, directly (save/pxSave/frSave/dgbSave/STORE.set)
//     or through the functions they call
//   - every inline on*="…" handler and addEventListener, with the functions
//     it calls and the label of the element
// Runtime part (Playwright, same fixture as the tests, signed in as owner):
//   - which source each global name really points to after start-up, because
//     many functions are replaced or wrapped while the page runs
// Coverage (if coverage/raw exists, from `npm run coverage`):
//   - which scenarios executed each function
//
// Usage: node tools/inventory.mjs [--no-runtime]
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const ROOT = new URL('../', import.meta.url);
const HTML_PATH = new URL('legacy/DRIVEGO_TRIAL_v23.html', ROOT);
const html = readFileSync(HTML_PATH, 'utf8');

const lineStarts = [0];
for (let i = 0; i < html.length; i++) if (html.charCodeAt(i) === 10) lineStarts.push(i + 1);
const lineAt = off => {
  let lo = 0, hi = lineStarts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= off) lo = mid; else hi = mid - 1; }
  return lo + 1;
};

const SAVE_FNS = new Set(['save', 'pxSave', 'frSave', 'dgbSave']);

// ---------- static: scripts ----------
const fns = new Map();   // name -> { decls: [{line,start,end,src}], overrides: Set<line>, calls: Set, savesDirect }
const getFn = name => {
  if (!fns.has(name)) fns.set(name, { name, decls: [], overrides: new Set(), calls: new Set(), savesDirect: false, kind: 'function' });
  return fns.get(name);
};
const listeners = [];
const scripts = [];
for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  const base = m.index + '<script>'.length;
  scripts.push({ base, ast: acorn.parse(m[1], { ecmaVersion: 'latest', sourceType: 'script' }) });
}

function callsIn(node) {
  const out = new Set();
  let saves = false;
  walk.full(node, n => {
    if (n.type !== 'CallExpression') return;
    const c = n.callee;
    if (c.type === 'Identifier') out.add(c.name);
    else if (c.type === 'MemberExpression' && !c.computed && c.object.type === 'Identifier') {
      if (c.object.name === 'window') out.add(c.property.name);
      if (c.object.name === 'STORE' && c.property.name === 'set') saves = true;
    }
  });
  for (const s of SAVE_FNS) if (out.has(s)) saves = true;
  return { calls: out, saves };
}

// 1. global functions: top-level declarations and top-level const/let/var = function
for (const { base, ast } of scripts) {
  for (const st of ast.body) {
    if (st.type === 'FunctionDeclaration') {
      const f = getFn(st.id.name);
      f.decls.push({ line: lineAt(base + st.start), start: base + st.start, end: base + st.end });
      const { calls, saves } = callsIn(st.body);
      calls.forEach(c => f.calls.add(c));
      f.savesDirect ||= saves;
    } else if (st.type === 'VariableDeclaration') {
      for (const d of st.declarations) {
        if (d.id.type !== 'Identifier' || !d.init || !/Function|Arrow/.test(d.init.type)) continue;
        const f = getFn(d.id.name);
        f.kind = st.kind + ' function';
        f.decls.push({ line: lineAt(base + d.start), start: base + d.init.start, end: base + d.init.end });
        const { calls, saves } = callsIn(d.init);
        calls.forEach(c => f.calls.add(c));
        f.savesDirect ||= saves;
      }
    }
  }
}

// 2. later replacements anywhere in the code: NAME = …, window.NAME = …,
//    window['NAME'] = …, wrap*('NAME', …), ['a','b'].forEach(n => window[n] = …)
for (const { base, ast } of scripts) {
  walk.full(ast, n => {
    let name = null;
    if (n.type === 'AssignmentExpression') {
      const l = n.left;
      if (l.type === 'Identifier') name = l.name;
      else if (l.type === 'MemberExpression' && l.object.type === 'Identifier' && l.object.name === 'window')
        name = l.computed ? (l.property.type === 'Literal' ? l.property.value : null) : l.property.name;
      if (name && fns.has(name) && /Function|Arrow/.test(n.right.type)) {
        const f = fns.get(name);
        f.overrides.add(lineAt(base + n.start));
        const { calls, saves } = callsIn(n.right);
        calls.forEach(c => f.calls.add(c));
        f.savesDirect ||= saves;
      } else if (name && fns.has(name) && n.right.type !== 'Literal') {
        fns.get(name).overrides.add(lineAt(base + n.start));
      }
    }
    // el.onclick = … (handler set as a property instead of addEventListener)
    if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && !n.left.computed &&
        /^on[a-z]+$/.test(n.left.property.name) && /Function|Arrow|Identifier/.test(n.right.type)) {
      const { calls } = callsIn(n.right);
      if (n.right.type === 'Identifier') calls.add(n.right.name);
      listeners.push({
        line: lineAt(base + n.start), event: n.left.property.name.slice(2),
        target: html.slice(base + n.left.object.start, base + n.left.object.end).slice(0, 60),
        code: html.slice(base + n.right.start, base + n.right.end), calls,
      });
    }
    if (n.type === 'CallExpression') {
      const c = n.callee;
      const calleeName = c.type === 'Identifier' ? c.name : null;
      if (calleeName && /wrap/i.test(calleeName) && n.arguments[0] && n.arguments[0].type === 'Literal' && fns.has(n.arguments[0].value))
        fns.get(n.arguments[0].value).overrides.add(lineAt(base + n.start));
      if (c.type === 'MemberExpression' && !c.computed && c.property.name === 'forEach' && c.object.type === 'ArrayExpression') {
        const cb = n.arguments[0];
        const src = cb ? html.slice(base + cb.start, base + cb.end) : '';
        if (/window\[/.test(src))
          for (const el of c.object.elements)
            if (el && el.type === 'Literal' && fns.has(el.value)) fns.get(el.value).overrides.add(lineAt(base + n.start));
      }
      if (c.type === 'MemberExpression' && !c.computed && c.property.name === 'addEventListener' && n.arguments[0]?.type === 'Literal') {
        const h = n.arguments[1];
        const { calls } = h ? callsIn(h) : { calls: new Set() };
        if (h?.type === 'Identifier') calls.add(h.name);
        listeners.push({
          line: lineAt(base + n.start), event: n.arguments[0].value,
          target: html.slice(base + c.object.start, base + c.object.end).slice(0, 60),
          code: h ? html.slice(base + h.start, base + h.end) : '', calls,
        });
      }
    }
  });
}

// 3. who saves, directly or through the functions it calls (fixed point over
//    the call graph)
const savers = new Set([...fns.values()].filter(f => f.savesDirect || SAVE_FNS.has(f.name)).map(f => f.name));
for (let changed = true; changed;) {
  changed = false;
  for (const f of fns.values())
    if (!savers.has(f.name) && [...f.calls].some(c => savers.has(c))) { savers.add(f.name); changed = true; }
}
const savesVia = name => savers.has(name);

// ---------- static: inline handlers in markup and in HTML built by scripts ----------
const handlers = [];
for (const m of html.matchAll(/\son(click|change|input|submit|keyup|keydown|keypress|blur|focus|dblclick|mousedown|mouseup|pointerdown|contextmenu|paste|drop|dragover|dragstart|load|error|toggle|search)=(\\?["'])([\s\S]*?)\2/g)) {
  const code = m[3];
  const calls = new Set([...code.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map(x => x[1]).filter(x => fns.has(x)));
  const tagStart = html.lastIndexOf('<', m.index);
  const tag = (html.slice(tagStart + 1, tagStart + 20).match(/^[a-zA-Z0-9-]+/) || ['?'])[0];
  const close = html.indexOf('>', m.index + m[0].length);
  let label = close > 0 ? html.slice(close + 1, close + 300).split('<')[0] : '';
  label = label.replace(/\$\{[^}]*\}/g, '…').replace(/'\s*\+[^+]*\+\s*'/g, '…').replace(/\$\{.*$/, '…')
    .replace(/\s+/g, ' ').trim().slice(0, 60);
  handlers.push({ line: lineAt(m.index), event: m[1], tag, label, code, calls });
}

// ---------- runtime: what each global name really points to ----------
const live = new Map();
async function runtime() {
  const { chromium } = await import('@playwright/test');
  const { CONTEXT_OPTIONS, FIXED_NOW, TEST_SEED } = await import('../tests/support/config.mjs');
  const { prepareContext } = await import('../tests/support/browser.mjs');
  const { legacyApp } = await import('../tests/support/legacy-app.mjs');
  const server = spawn(process.execPath, [new URL('tools/serve.mjs', ROOT).pathname], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 500));
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext(CONTEXT_OPTIONS);
    await prepareContext(context, { seed: TEST_SEED, now: FIXED_NOW });
    const page = await context.newPage();
    const app = legacyApp(page, { dataset: 'biz-trial' });
    await app.loginAsOwner();
    const names = [...fns.keys()];
    const res = await page.evaluate(names => names.map(n => {
      let v;
      try { v = window[n]; if (typeof v !== 'function') v = (0, eval)(n); } catch (e) { v = undefined; }
      return [n, typeof v === 'function' ? Function.prototype.toString.call(v) : null];
    }), names);
    for (const [n, src] of res) live.set(n, src);
    await browser.close();
  } finally {
    server.kill();
  }
}
if (!process.argv.includes('--no-runtime')) await runtime();

// ---------- coverage ----------
const executed = new Map(); // line -> Set<scenario>
const covDir = new URL('coverage/raw/', ROOT);
const haveCoverage = existsSync(covDir);
if (haveCoverage) {
  for (const f of readdirSync(covDir)) {
    const { test, ran } = JSON.parse(readFileSync(new URL(f, covDir), 'utf8'));
    const sc = (test.match(/\bS\d+\b/) || [test])[0];
    for (const r of ran) {
      if (!executed.has(r.line)) executed.set(r.line, new Set());
      executed.get(r.line).add(sc);
    }
  }
}
const ranBy = lines => {
  const s = new Set();
  for (const l of lines) for (const x of executed.get(l) || []) s.add(x);
  return [...s].sort();
};

// ---------- rows ----------
const csv = v => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const rows = [];
const fnRows = [...fns.values()].sort((a, b) => a.decls[0].line - b.decls[0].line);
let n = 0;
for (const f of fnRows) {
  const declLines = f.decls.map(d => d.line);
  let liveLine = '', liveNote = '';
  const src = live.get(f.name);
  if (live.size) {
    if (src == null) liveNote = 'ไม่พบตอนทำงาน';
    else {
      const at = html.indexOf(src);
      const decl = f.decls.find(d => d.start === at || (at >= d.start && at < d.end));
      if (at < 0) liveNote = 'ถูกแทนที่ (หาต้นทางไม่ได้)';
      else if (decl && decl === f.decls[f.decls.length - 1]) liveLine = decl.line;
      else if (decl) { liveLine = decl.line; liveNote = 'ใช้ตัวที่ประกาศก่อน'; }
      else { liveLine = lineAt(at); liveNote = 'ถูกครอบ/แทนที่'; }
    }
  }
  const scen = ranBy([...declLines, ...f.overrides, ...(liveLine ? [liveLine] : [])]);
  const saves = f.savesDirect || SAVE_FNS.has(f.name) ? 'direct' : savesVia(f.name) ? 'indirect' : '';
  rows.push({
    id: 'F' + String(++n).padStart(4, '0'), kind: f.kind, name: f.name, line: declLines[declLines.length - 1],
    declared_lines: declLines.join(' '), replaced_at: [...f.overrides].sort((a, b) => a - b).join(' '),
    live_line: liveLine, live_note: liveNote, saves, label: '', code: '',
    calls: [...f.calls].filter(c => fns.has(c) && c !== f.name).sort().join(' '),
    tested_by: scen.join(' '),
  });
}
n = 0;
for (const h of handlers) {
  const calls = [...h.calls];
  const saves = calls.some(c => savesVia(c)) ? 'indirect' : '';
  const covered = calls.length && haveCoverage
    ? calls.map(c => new Set(ranBy([...fns.get(c).decls.map(d => d.line), ...fns.get(c).overrides])))
    : [];
  const both = covered.length ? [...covered.reduce((a, b) => new Set([...a].filter(x => b.has(x))))] : [];
  rows.push({
    id: 'H' + String(++n).padStart(4, '0'), kind: 'on' + h.event, name: '', line: h.line,
    declared_lines: '', replaced_at: '', live_line: '', live_note: '', saves,
    label: `<${h.tag}> ${h.label}`.trim(), code: h.code.replace(/\s+/g, ' ').slice(0, 160),
    calls: calls.sort().join(' '), tested_by: both.sort().join(' '),
  });
}
n = 0;
for (const l of listeners) {
  const calls = [...l.calls].filter(c => fns.has(c));
  rows.push({
    id: 'L' + String(++n).padStart(4, '0'), kind: 'listener:' + l.event, name: '', line: l.line,
    declared_lines: '', replaced_at: '', live_line: '', live_note: '', saves: calls.some(c => savesVia(c)) ? 'indirect' : '',
    label: l.target, code: l.code.replace(/\s+/g, ' ').slice(0, 160), calls: calls.sort().join(' '),
    tested_by: ranBy([l.line]).join(' '),
  });
}
const COLS = ['id', 'kind', 'name', 'line', 'declared_lines', 'replaced_at', 'live_line', 'live_note', 'saves', 'label', 'code', 'calls', 'tested_by'];
writeFileSync(new URL('docs/behaviors.csv', ROOT), [COLS.join(','), ...rows.map(r => COLS.map(c => csv(r[c])).join(','))].join('\n') + '\n');

// ---------- summary ----------
const F = rows.filter(r => r.id.startsWith('F'));
const H = rows.filter(r => r.id.startsWith('H'));
const L = rows.filter(r => r.id.startsWith('L'));
const saveF = F.filter(r => r.saves);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0) + '%';
const tested = arr => arr.filter(r => r.tested_by).length;
const summary = `# รายการพฤติกรรมของระบบเดิม

ไฟล์นี้สร้างอัตโนมัติด้วย \`npm run inventory\` (ห้ามแก้ด้วยมือ) จาก \`legacy/DRIVEGO_TRIAL_v23.html\`
รายละเอียดทุกแถวอยู่ใน [behaviors.csv](behaviors.csv)

## ภาพรวม

"ถูกเรียกระหว่าง test" นับจาก coverage ของ Chromium: โค้ดส่วนนั้นทำงานอย่างน้อยหนึ่งครั้งในสถานการณ์ใดสถานการณ์หนึ่ง
รวมถึงตอนเปิดโปรแกรมและล็อกอินด้วย จึงไม่ได้แปลว่าผลของมันถูกตรวจแล้ว
ใช้หาช่องโหว่: **ส่วนที่ไม่เคยถูกเรียกเลย คือส่วนที่ยังไม่มี test แน่นอน**

| รายการ | จำนวน | ถูกเรียกระหว่าง test${haveCoverage ? '' : ' (ยังไม่ได้วัด)'} |
|---|---|---|
| ฟังก์ชันทั้งหมด | ${F.length} | ${tested(F)} (${pct(tested(F), F.length)}) |
| ฟังก์ชันที่บันทึกข้อมูล (ตรง ๆ หรือผ่านฟังก์ชันอื่น) | ${saveF.length} | ${tested(saveF)} (${pct(tested(saveF), saveF.length)}) |
| — บันทึกข้อมูลเองโดยตรง | ${F.filter(r => r.saves === 'direct').length} | ${tested(F.filter(r => r.saves === 'direct'))} |
| จุดรับคำสั่งในหน้าจอ (on…=) | ${H.length} | ${tested(H)} (${pct(tested(H), H.length)}) |
| — ที่นำไปสู่การบันทึกข้อมูล | ${H.filter(r => r.saves).length} | ${tested(H.filter(r => r.saves))} |
| ตัวรับเหตุการณ์ที่ผูกด้วยโค้ด (addEventListener, el.onclick=) | ${L.length} | ${tested(L)} |

## จุดที่ต้องระวังตอนย้ายระบบ

| รายการ | จำนวน |
|---|---|
| ฟังก์ชันระดับบนสุดที่ประกาศชื่อซ้ำมากกว่า 1 ครั้ง | ${F.filter(r => r.declared_lines.includes(' ')).length} |
| ฟังก์ชันที่ถูกแทนที่หรือครอบในภายหลัง (จากการอ่านโค้ด) | ${F.filter(r => r.replaced_at).length} |
${live.size ? `| ฟังก์ชันที่ตอนทำงานจริงไม่ใช่ตัวที่ประกาศไว้ท้ายสุด | ${F.filter(r => r.live_note && r.live_note !== 'ไม่พบตอนทำงาน').length} |\n` : ''}
ฟังก์ชันที่ถูกแทนที่บ่อยที่สุด:

| ฟังก์ชัน | ประกาศที่บรรทัด | ถูกแทนที่/ครอบที่บรรทัด | บันทึกข้อมูล |
|---|---|---|---|
${F.filter(r => r.replaced_at).sort((a, b) => b.replaced_at.split(' ').length - a.replaced_at.split(' ').length).slice(0, 15)
  .map(r => `| \`${r.name}\` | ${r.declared_lines} | ${r.replaced_at} | ${r.saves === 'direct' ? 'ตรง' : r.saves === 'indirect' ? 'ผ่านฟังก์ชันอื่น' : '-'} |`).join('\n')}

${haveCoverage ? `## ฟังก์ชันที่บันทึกข้อมูลแต่ยังไม่มีสถานการณ์ไหนเรียก (${saveF.filter(r => !r.tested_by).length} ตัว)

ใช้วางแผนสถานการณ์ชุดถัดไป: คอลัมน์ปุ่มคือข้อความบนปุ่มในหน้าจอที่เรียกฟังก์ชันนั้นโดยตรง

| ฟังก์ชัน | บรรทัด | ปุ่มที่เรียก |
|---|---|---|
${saveF.filter(r => !r.tested_by).map(r => {
  const labels = [...new Set(H.filter(h => h.calls.split(' ').includes(r.name)).map(h => h.label.replace(/^<[^>]*>\s*/, '').trim()).filter(Boolean))].slice(0, 4);
  return `| \`${r.name}\` | ${r.line} | ${labels.join(' · ').replace(/\|/g, '/') || '-'} |`;
}).join('\n')}

` : ''}## คอลัมน์ใน behaviors.csv

| คอลัมน์ | ความหมาย |
|---|---|
| id | F = ฟังก์ชัน, H = จุดรับคำสั่งที่เขียนใน HTML (onclick="…" ฯลฯ), L = ตัวรับเหตุการณ์ที่ผูกด้วยโค้ด (addEventListener, el.onclick=…) |
| line | บรรทัดในไฟล์เดิม (ฟังก์ชัน = ตัวที่ประกาศท้ายสุด) |
| declared_lines | ทุกบรรทัดที่ประกาศฟังก์ชันชื่อนี้ |
| replaced_at | บรรทัดที่แทนที่หรือครอบฟังก์ชันนี้ในภายหลัง |
| live_line / live_note | ตอนระบบทำงานจริง (ล็อกอินเจ้าของร้านแล้ว) ชื่อนี้ชี้ไปที่โค้ดบรรทัดไหน ถ้าถูกครอบด้วยโค้ดครอบแบบทั่วไปที่ใช้หลายที่ บรรทัดคือที่แรกที่โค้ดนั้นปรากฏ |
| saves | direct = บันทึกข้อมูลเอง, indirect = เรียกฟังก์ชันที่บันทึกข้อมูล |
| label | ข้อความบนปุ่มหรือ element (สำหรับ H) |
| calls | ฟังก์ชันที่ถูกเรียก |
| tested_by | สถานการณ์ที่ทำให้โค้ดนี้ทำงาน (จาก \`npm run coverage\`) สำหรับ H นับเมื่อทุกฟังก์ชันที่ปุ่มเรียกถูกเรียกในสถานการณ์เดียวกัน |
`;
writeFileSync(new URL('docs/BEHAVIORS.md', ROOT), summary);
console.log(`functions ${F.length} (save ${saveF.length}), handlers ${H.length}, listeners ${L.length}, runtime ${live.size ? 'yes' : 'no'}, coverage ${haveCoverage ? 'yes' : 'no'}`);
