// The accountant's review pack (docs/LAUNCH-CHECKLIST.md, stage 2): the questions of docs/ACCOUNTANT-REVIEW.md as a
// PDF with a box to answer under each item, and the documents the new system prints, as PDFs, made by running the
// scenarios that print them (tests/support/test.ts PRINT_CAPTURE). Everything ends up in one zip to send on.
//
//   node tools/accountant-pack.mjs [--out accountant-pack] [--skip-run]
//
// --skip-run uses the PDFs of the last run (<out>/.captured) and only builds the questions and the zip again.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { prepareContext } from '../tests/support/browser.mjs';
import { LAUNCH_OPTIONS } from '../tests/support/config.mjs';

const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const out = resolve(arg('--out') || 'accountant-pack');
const captured = join(out, '.captured');
const samplesDir = join(out, 'ตัวอย่างเอกสาร');

// Sample NN of the questions: the first PDF a scenario printed whose name matches.
const SAMPLES = [
  ['01', 'ใบกำกับภาษีเต็มรูป', 'S220', /ใบกำกับภาษี_MA-TX261000001/],
  ['02', 'ใบกำกับภาษีที่ออกแทนใบที่ยกเลิก', 'S136', /ใบกำกับภาษี_/],
  ['03', 'ใบกำกับภาษีอย่างย่อ', 'S220', /ใบกำกับภาษีอย่างย่อ_MA-SA261000001_/],
  ['04', 'ใบลดหนี้', 'S142', /ใบลดหนี้/],
  ['05', 'รายงานภาษีขาย ภาษีซื้อ และสรุปภาษี', 'S220', /รายงานภาษีขาย/],
  ['06', 'ใบเสร็จรับเงินที่ชาร์จค่าธรรมเนียมบัตร 3%', 'S153', /ใบเสร็จรับเงิน/],
  ['07', 'ใบสำคัญจ่ายค่าใช้จ่าย', 'S146', /ใบสำคัญจ่าย/],
  ['08', 'ใบสำคัญจ่ายเงินเจ้าหนี้ที่หัก ณ ที่จ่าย', 'S149', /ใบสำคัญจ่าย/],
  ['09', '50 ทวิ ที่อู่ออกให้ผู้ขาย (หจก.)', 'S150', /MA-WH261000001/],
  ['10', '50 ทวิ ที่อู่ออกให้ผู้ขาย (ร้านค่าบริการ)', 'S150', /MA-WH261000002/],
  ['11', 'ใบสำคัญจ่ายเงินเดือน', 'S174', /ใบสำคัญจ่าย_.*พนักงาน/],
  ['12', 'ใบสำคัญจ่ายนำส่งประกันสังคม', 'S165', /สำนักงานประกันสังคม/],
  ['13', 'ใบสำคัญจ่ายนำส่ง ภ.ง.ด.1', 'S174', /กรมสรรพากร/],
  ['14', 'สลิปเงินเดือน', 'S174', /สลิปเงินเดือน/],
  ['15', 'สรุป ภ.ง.ด.1', 'S174', /ภ\.ง\.ด\.1/],
  ['16', '50 ทวิ ประจำปีของพนักงาน', 'S175', /หนังสือรับรอง/],
  ['17', 'ทะเบียนทรัพย์สินและค่าเสื่อมราคา', 'S210', /ทะเบียนทรัพย์สิน/],
  ['18', 'ใบสำคัญจ่ายค่าสินทรัพย์ (ซื้อเครดิต หัก ณ ที่จ่าย)', 'S211', /ใบสำคัญจ่าย/],
  ['19', 'งบกำไรขาดทุน', 'S214', /งบกำไรขาดทุน/],
  ['20', 'งบทดลอง', 'S214', /งบทดลอง/],
  ['21', 'รายงานสุขภาพการเงิน', 'S214', /สุขภาพการเงิน/],
];

if (!process.argv.includes('--skip-run')) {
  rmSync(captured, { recursive: true, force: true });
  const scenarios = [...new Set(SAMPLES.map(s => s[2]))];
  const files = readdirSync('tests/scenarios').filter(f => scenarios.includes(f.split('-')[0])).map(f => `tests/scenarios/${f}`);
  console.log(`printing from ${files.length} scenarios on the new system …`);
  const run = spawnSync('npx', ['playwright', 'test', ...files, '--workers=3', '--reporter=line', `--output=${join(out, '.results')}`], {
    stdio: 'inherit', env: { ...process.env, TARGET: 'new', PRINT_CAPTURE: captured },
  });
  if (run.status !== 0) console.error('some scenarios failed; the pack is built from what was printed (check the samples)');
}

rmSync(samplesDir, { recursive: true, force: true });
mkdirSync(samplesDir, { recursive: true });
const printed = existsSync(captured) ? readdirSync(captured).sort() : [];
const missing = [];
for (const [no, label, scenario, name] of SAMPLES) {
  const file = printed.find(f => f.startsWith(`${scenario}-`) && name.test(f));
  if (file) copyFileSync(join(captured, file), join(samplesDir, `${no} ${label}.pdf`));
  else missing.push(`${no} ${label} (${scenario})`);
}
if (missing.length) { console.error(`not printed: ${missing.join(', ')}`); process.exitCode = 1; }

// The questions: a small subset of Markdown (headings, paragraphs, lists, tables, bold) with an answer box under
// every numbered item (###).
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const ANSWER = '<div class="ans"><div><span class="box"></span> ถูกต้อง <span class="box"></span> ต้องแก้</div>'
  + '<div class="line">ความเห็น / ควรเป็น:</div><div class="line"></div><div class="line"></div></div>';
function toHtml(md) {
  const html = [];
  let para = [], list = [], table = [], item = false;
  const flush = () => {
    if (para.length) html.push(`<p>${para.map(inline).join('<br>')}</p>`);
    if (list.length) html.push(`<ul>${list.map(x => `<li>${x.split('\n').map(inline).join('<br>')}</li>`).join('')}</ul>`);
    if (table.length) {
      const rows = table.filter(r => !/^\|\s*-/.test(r)).map(r => r.slice(1, -1).split('|').map(c => c.trim()));
      html.push(`<table><thead><tr>${rows[0].map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>`
        + rows.slice(1).map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') + '</tbody></table>');
    }
    para = []; list = []; table = [];
  };
  const close = () => { flush(); if (item) { html.push(ANSWER, '</section>'); item = false; } };
  for (const line of md.split('\n')) {
    const h = /^(#{1,3}) (.*)$/.exec(line);
    if (h) {
      close();
      if (h[1] === '###') { html.push('<section class="item">'); item = true; }
      html.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
    } else if (/^- /.test(line)) { if (para.length) flush(); list.push(line.slice(2)); }
    else if (/^\s{2,}\S/.test(line) && list.length) list[list.length - 1] += `\n${line.trim()}`;
    else if (/^\|/.test(line)) table.push(line.trim());
    else if (!line.trim()) flush();
    else para.push(line);
  }
  close();
  return html.join('\n');
}
const FONTS = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap';
const page = `<!doctype html><html lang="th"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}"><style>
  body{font-family:Sarabun,sans-serif;font-size:11.5pt;line-height:1.55;color:#111;margin:0}
  h1{font-size:18pt;margin:0 0 8pt} h2{font-size:14pt;margin:18pt 0 6pt;padding-bottom:3pt;border-bottom:1.5pt solid #333}
  h3{font-size:12pt;margin:0 0 3pt} p{margin:0 0 6pt} ul{margin:0 0 6pt;padding-left:18pt}
  .item{break-inside:avoid;margin:10pt 0;padding:8pt 10pt;border:0.75pt solid #bbb;border-radius:4pt}
  .ans{margin-top:6pt;padding-top:5pt;border-top:0.75pt dashed #999}
  .box{display:inline-block;width:10pt;height:10pt;border:1pt solid #333;margin:0 4pt -1pt 12pt} .ans .box:first-child{margin-left:0}
  .line{border-bottom:0.75pt solid #999;height:18pt} .ans .line:first-of-type{border:0;height:auto;margin-top:4pt}
  table{border-collapse:collapse;width:100%;font-size:10.5pt} th,td{border:0.75pt solid #999;padding:3pt 6pt;text-align:left}
</style></head><body>${toHtml(readFileSync('docs/ACCOUNTANT-REVIEW.md', 'utf8'))}</body></html>`;

const browser = await chromium.launch(LAUNCH_OPTIONS);
try {
  const context = await browser.newContext();
  await prepareContext(context, { seed: 1, now: new Date() });
  const p = await context.newPage();
  await p.setContent(page, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({
    path: join(out, 'คำถามสำหรับผู้ทำบัญชี.pdf'), format: 'A4', printBackground: true,
    margin: { top: '16mm', bottom: '16mm', left: '15mm', right: '15mm' }, displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:8pt;width:100%;text-align:center;color:#666">หน้า <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
} finally { await browser.close(); }

const zip = `${out}.zip`;
rmSync(zip, { force: true });
const z = spawnSync('zip', ['-qr', zip, 'คำถามสำหรับผู้ทำบัญชี.pdf', 'ตัวอย่างเอกสาร'], { cwd: out, stdio: 'inherit' });
console.log(z.status === 0 ? `ready: ${zip}` : `questions and samples are in ${out} (zip failed)`);
