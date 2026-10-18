// Phase 1: split legacy/DRIVEGO_TRIAL_v23.html into frontend/ without
// changing a single character of logic.
//
//   node tools/split-legacy.mjs          write frontend/ from the legacy file
//                                        (Phase 1 only: it overwrites the Phase 2 changes)
//   node tools/split-legacy.mjs --check  split the legacy file in memory and require
//                                        frontend/ to match it, except the files
//                                        listed in frontend/CHANGES.md (Phase 2 on)
//
// Output:
//   frontend/index.html      the markup, with each block replaced by a reference
//   frontend/js/NN.js        each inline <script> (55), in page order
//   frontend/css/NN.css      each <style> block (4), in page order
//   frontend/assets/img-N.*  each base64 image in the markup (identical ones share a file)
//   frontend/split-manifest.json  what came from where (legacy line numbers)
//
// Classic <script src> tags run in the same order as inline scripts and share
// the same global scope, and <link rel="stylesheet"> replaces <style> in the
// same place, so the page behaves the same. In Phase 1, frontend/ rebuilt
// the legacy file byte for byte; --check now proves that nothing moved
// beyond the changes listed in frontend/CHANGES.md.
import { mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const LEGACY = new URL('legacy/DRIVEGO_TRIAL_v23.html', ROOT);
const OUT = new URL('frontend/', ROOT);
const pad = n => String(n).padStart(2, '0');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };

function split(html) {
  const lineAt = i => html.slice(0, i).split('\n').length;
  const parts = [], scripts = [], styles = [], images = [];
  const imageFiles = new Map();
  const STYLE = /<style(\s[^>]*)?>/g;
  let p = 0;
  // Markup between blocks: base64 images become files.
  const markup = text => text.replace(/data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)/g, (m, mime, b64) => {
    if (!imageFiles.has(m)) {
      const file = `assets/img-${imageFiles.size + 1}.${EXT[mime]}`;
      imageFiles.set(m, file);
      images.push({ file, mime, b64 });
    }
    return imageFiles.get(m);
  });
  while (p < html.length) {
    const s = html.indexOf('<script>', p);
    STYLE.lastIndex = p;
    const st = STYLE.exec(html);
    const next = [s >= 0 ? s : Infinity, st ? st.index : Infinity];
    if (next[0] === Infinity && next[1] === Infinity) { parts.push(markup(html.slice(p))); break; }
    if (next[0] < next[1]) {
      // A script ends at the first </script>, exactly as the HTML parser does.
      const end = html.indexOf('</script>', s);
      const file = `js/${pad(scripts.length + 1)}.js`;
      scripts.push({ file, content: html.slice(s + 8, end), from: lineAt(s), to: lineAt(end) });
      parts.push(markup(html.slice(p, s)), `<script src="${file}"></script>`);
      p = end + 9;
    } else {
      const open = st[0], attrs = st[1] || '';
      const end = html.indexOf('</style>', st.index);
      const file = `css/${pad(styles.length + 1)}.css`;
      styles.push({ file, open, content: html.slice(st.index + open.length, end), from: lineAt(st.index), to: lineAt(end) });
      parts.push(markup(html.slice(p, st.index)), `<link rel="stylesheet" href="${file}"${attrs}>`);
      p = end + 8;
    }
  }
  return { index: parts.join(''), scripts, styles, images };
}

const legacy = readFileSync(LEGACY, 'utf8');
if (process.argv.includes('--check')) {
  // Every file the split makes must be in frontend/ unchanged, unless
  // frontend/CHANGES.md lists it; files frontend/ has beyond the split must be listed too.
  const { index, scripts, styles, images } = split(legacy);
  const expected = new Map([['index.html', Buffer.from(index)],
    ...scripts.map(s => [s.file, Buffer.from(s.content)]), ...styles.map(s => [s.file, Buffer.from(s.content)]),
    ...images.map(im => [im.file, Buffer.from(im.b64, 'base64')])]);
  let listed = new Set();
  try { listed = new Set([...readFileSync(new URL('CHANGES.md', OUT), 'utf8').matchAll(/`frontend\/([^`]+)`/g)].map(m => m[1])); } catch {}
  const present = new Set();
  const walk = (dir, rel = '') => { for (const e of readdirSync(new URL(dir, OUT), { withFileTypes: true })) {
    const p = rel + e.name;
    if (e.isDirectory()) walk(dir + e.name + '/', p + '/'); else present.add(p);
  } };
  walk('./');
  const changed = [], unlisted = [];
  for (const [file, content] of expected) {
    let now = null;
    try { now = readFileSync(new URL(file, OUT)); } catch {}
    if (now && now.equals(content)) continue;
    (listed.has(file) ? changed : unlisted).push(`${file}${now ? '' : ' (missing)'}`);
  }
  for (const file of present) {
    if (expected.has(file) || ['split-manifest.json', 'CHANGES.md'].includes(file)) continue;
    (listed.has(file) ? changed : unlisted).push(`${file} (new)`);
  }
  if (unlisted.length) {
    console.error(`frontend/ differs from the legacy split in files not listed in frontend/CHANGES.md:\n  ${unlisted.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`OK: frontend/ is the legacy split byte for byte, except ${changed.length} file(s) listed in frontend/CHANGES.md: ${changed.join(', ')}`);
} else {
  const { index, scripts, styles, images } = split(legacy);
  rmSync(OUT, { recursive: true, force: true });
  for (const d of ['js', 'css', 'assets']) mkdirSync(new URL(d + '/', OUT), { recursive: true });
  writeFileSync(new URL('index.html', OUT), index);
  for (const s of scripts) writeFileSync(new URL(s.file, OUT), s.content);
  for (const s of styles) writeFileSync(new URL(s.file, OUT), s.content);
  for (const im of images) writeFileSync(new URL(im.file, OUT), Buffer.from(im.b64, 'base64'));
  const manifest = {
    source: 'legacy/DRIVEGO_TRIAL_v23.html',
    note: 'Generated by tools/split-legacy.mjs. Lines are 1-based lines of the legacy file where each block starts and ends.',
    scripts: scripts.map(({ file, from, to }) => ({ file, legacyLines: [from, to] })),
    styles: styles.map(({ file, open, from, to }) => ({ file, open, legacyLines: [from, to] })),
    images: images.map(({ file, mime }) => ({ file, mime })),
  };
  writeFileSync(new URL('split-manifest.json', OUT), JSON.stringify(manifest, null, 1) + '\n');
  console.log(`frontend/: index.html (${Buffer.byteLength(index)} bytes), ${scripts.length} scripts, ${styles.length} styles, ${images.length} images`);
}
