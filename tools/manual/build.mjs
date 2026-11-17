// The user manual of DriveGoBiz as a PDF, with pictures of the real screens (the owner's request of 2026-11-17).
//   node tools/manual/build.mjs [--out user-manual] [--skip-run]
// 1. takes the pictures: tools/manual/NN-*.spec.ts on the new system (TARGET=new, the fixture biz-trial, the clock of the
//    scenarios; builds server/ first unless NO_BUILD=1), into <out>/img;
// 2. writes <out>/manual.html from tools/manual/content.mjs and prints it to <out>/คู่มือการใช้งาน DriveGoBiz.pdf
//    (A4, the app's font Sarabun from tests/support/fonts, no internet needed).
// --skip-run uses the pictures already in <out>/img. When a screen changes, run this again: the pictures follow.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { LAUNCH_OPTIONS } from '../../tests/support/config.mjs';
import { chapters, title, subtitle, edition } from './content.mjs';

const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const out = resolve(arg('--out', 'user-manual'));
mkdirSync(join(out, 'img'), { recursive: true });

if (!process.argv.includes('--skip-run')) {
  const r = spawnSync('npx', ['playwright', 'test', '-c', 'tools/manual/manual.config.ts', '--output', join(out, '.results')],
    { stdio: 'inherit', env: { ...process.env, TARGET: 'new', MANUAL_OUT: out } });
  if (r.status !== 0) { console.error('[manual] taking the pictures failed: see above'); process.exit(r.status || 1); }
}

// The page each chapter starts on in a printed PDF: the first page after the contents with the chapter's title.
function chapterPages(pdf, titles) {
  const r = spawnSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
  if (r.status !== 0) { console.error('[manual] no pdftotext: contents without page numbers'); return []; }
  const norm = t => t.replace(/\s+/g, '');
  const texts = r.stdout.split('\f').map(norm);
  let from = 2;
  return titles.map(t => {
    const i = texts.findIndex((x, k) => k >= from && x.includes(norm(t)));
    if (i < 0) return undefined;
    from = i + 1;
    return i + 1;
  });
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// **bold** and `labels` in the content: a label is what is written on the screen (a button, a field, a menu).
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<span class="ui">$1</span>');
const missing = [], pictures = [];
let html = '';
const toc = [];
chapters.forEach((ch, ci) => {
  const n = ci + 1;
  toc.push(`<li><a href="#c${n}"><span>${n}.</span> ${esc(ch.title)}<em>@@P${n}@@</em></a></li>`);
  html += `<section class="chapter" id="c${n}"><h1><span class="num">${n}</span>${esc(ch.title)}</h1>`;
  let fig = 0;
  for (const b of ch.blocks) {
    if (b.h) html += `<h2>${esc(b.h)}</h2>`;
    if (b.p) html += `<p>${inline(b.p)}</p>`;
    // start: a list that goes on after a picture keeps its numbers (the numbers on the pictures are these numbers)
    if (b.steps) html += `<ol class="steps"${b.start ? ` start="${b.start}"` : ''}>${b.steps.map(s => `<li>${inline(s)}</li>`).join('')}</ol>`;
    if (b.list) html += `<ul>${b.list.map(s => `<li>${inline(s)}</li>`).join('')}</ul>`;
    if (b.note) html += `<div class="note"><b>ข้อควรรู้</b> ${inline(b.note)}</div>`;
    if (b.warn) html += `<div class="warn"><b>ระวัง</b> ${inline(b.warn)}</div>`;
    if (b.img) {
      const file = join(out, 'img', `${b.img}.png`);
      if (!existsSync(file)) { missing.push(b.img); continue; }
      fig++;
      pictures.push(b.img);
      html += `<figure><img src="pdf-img/${b.img}.jpg" style="width:@@W:${b.img}:${b.small ? 1 : 0}@@mm"><figcaption>ภาพ ${n}.${fig} ${inline(b.cap || '')}</figcaption></figure>`;
    }
  }
  html += '</section>';
});
if (missing.length) { console.error(`[manual] pictures missing: ${missing.join(', ')}`); process.exit(1); }
// The pictures are taken at twice the screen's pixels (2560 wide): the page is 180 mm wide, so 1600 pixels (about
// 225 dpi) as JPEG keep them sharp on paper and the PDF a size that can be sent (PNGs at full size made it 27 MB).
mkdirSync(join(out, 'pdf-img'), { recursive: true });
// Each picture at the size of the screen it shows (a part of a window stays as large as on the screen, a whole window
// shrinks to the page), at most 92% of the text width (72% for a small one) and 112 mm high so a page holds more.
const sizes = Object.fromEntries(await Promise.all(pictures.map(async name => [name, await sharp(join(out, 'img', `${name}.png`)).metadata()])));
html = html.replace(/@@W:(.+?):([01])@@/g, (_, name, small) => {
  const { width, height } = sizes[name], mm = 0.2646;
  return (Math.min(width / 2 * mm, (small === '1' ? 0.72 : 0.92) * 180, 112 * width / height)).toFixed(1);
});
await Promise.all(pictures.map(name => sharp(join(out, 'img', `${name}.png`)).resize({ width: 1600, withoutEnlargement: true })
  .jpeg({ quality: 82, mozjpeg: true }).toFile(join(out, 'pdf-img', `${name}.jpg`))));

// The app's own font, from the copy the tests use (tests/support/fonts): no internet.
const fontsDir = new URL('../../tests/support/fonts/', import.meta.url);
const fonts = JSON.parse(readFileSync(new URL('manifest.json', fontsDir), 'utf8'));
const cssUrl = Object.keys(fonts).find(u => u.includes('family=Sarabun') && u.includes('Manrope'));

const page = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="stylesheet" href="${esc(cssUrl)}">
<style>
@page { size: A4; margin: 16mm 15mm 18mm; }
* { box-sizing: border-box; }
body { font-family: 'Sarabun', sans-serif; font-size: 11.5pt; line-height: 1.55; color: #1f2933; margin: 0; }
.cover { height: 260mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
.cover .brand { font-family: 'Manrope', 'Sarabun', sans-serif; font-weight: 800; font-size: 34pt; color: #12263f; }
.cover .brand span { color: #d4a43a; }
.cover h1 { font-size: 26pt; margin: 8mm 0 2mm; color: #12263f; }
.cover p { font-size: 13pt; color: #52606d; margin: 1mm 0; }
.cover .bar { height: 3mm; width: 40mm; background: #f2a900; margin: 10mm 0; border-radius: 2mm; }
.toc { page-break-after: always; }
.toc h1 { font-size: 20pt; color: #12263f; }
.toc ol { list-style: none; padding: 0; font-size: 13pt; }
.toc li { padding: 2.2mm 0; border-bottom: 1px dotted #cbd2d9; }
.toc a { color: #12263f; text-decoration: none; }
.toc a span { display: inline-block; width: 12mm; color: #d4a43a; font-weight: 600; }
.toc a { display: flex; } .toc a em { margin-left: auto; font-style: normal; color: #52606d; }
.chapter { page-break-before: always; }
.chapter h1 { font-size: 19pt; color: #12263f; border-bottom: 2.5pt solid #f2a900; padding: 3mm 0 2mm; margin: 0 0 4mm; }
.chapter h1 .num { display: inline-block; background: #12263f; color: #fff; border-radius: 2mm; padding: 0 3mm; margin-right: 3mm; }
h2 { font-size: 14pt; color: #12263f; margin: 6mm 0 2mm; page-break-after: avoid; }
p { margin: 1.5mm 0 2.5mm; }
ol.steps { margin: 1mm 0 3mm; padding-left: 7mm; }
ol.steps li { margin: 1mm 0; page-break-inside: avoid; }
ul { margin: 1mm 0 3mm; padding-left: 6mm; }
.ui { background: #fff4d6; border: 0.6pt solid #f2c34a; border-radius: 1.2mm; padding: 0 1.2mm; white-space: nowrap; font-weight: 600; color: #6b4a00; }
.note, .warn { border-radius: 2mm; padding: 2.5mm 3.5mm; margin: 2mm 0 3.5mm; page-break-inside: avoid; }
.note { background: #eef6ff; border-left: 3pt solid #3b82f6; }
.warn { background: #fff1f2; border-left: 3pt solid #e11d48; }
figure { margin: 2mm 0 5mm; page-break-inside: avoid; text-align: center; }
figure img { border: 0.6pt solid #cbd2d9; border-radius: 1.5mm; }
figcaption { font-size: 9.5pt; color: #616e7c; margin-top: 1.5mm; }
</style></head><body>
<div class="cover"><div class="brand">Drive<span>Go</span></div><div class="bar"></div>
<h1>${esc(title)}</h1><p>${esc(subtitle)}</p><p>${esc(edition)}</p></div>
<div class="toc"><h1>สารบัญ</h1><ol>${toc.join('')}</ol></div>
${html}
</body></html>`;

const browser = await chromium.launch(LAUNCH_OPTIONS);
try {
  const context = await browser.newContext({ locale: 'th-TH' });
  await context.route(/^https?:\/\//, route => {
    const hit = fonts[route.request().url()];
    if (!hit) return route.abort();
    return route.fulfill({ path: new URL(hit.file, fontsDir).pathname, contentType: hit.type, headers: { 'access-control-allow-origin': '*' } });
  });
  const p = await context.newPage();
  const pdf = join(out, `${title}.pdf`);
  const print = async html => {
    writeFileSync(join(out, 'manual.html'), html);
    await p.goto('file://' + join(out, 'manual.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForFunction(() => [...document.images].every(i => i.complete));
    await p.pdf({ path: pdf, format: 'A4', printBackground: true, outline: true, displayHeaderFooter: true, headerTemplate: '<div></div>',
      footerTemplate: '<div style="width:100%;font-size:8px;color:#888;text-align:center;font-family:sans-serif">DriveGoBiz · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' } });
  };
  // Twice: the table of contents gets each chapter's page from the first print (pdftotext, poppler-utils; without it the
  // contents have no page numbers). The numbers do not move anything, so the second print has the same pages.
  await print(page.replace(/@@P\d+@@/g, ''));
  const pages = chapterPages(pdf, chapters.map(c => c.title));
  await print(page.replace(/@@P(\d+)@@/g, (_, n) => pages[Number(n) - 1] ? String(pages[Number(n) - 1]) : ''));
  console.log(`[manual] ${pdf}`);
} finally {
  await browser.close();
}
