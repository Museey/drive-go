// After a failed CI run: where and how each failed screenshot differs from its
// golden, as text in the job log (the run's files are not always reachable
// from where the failure is studied). For each failure: the pixels
// toHaveScreenshot counted, how far the colours are apart, and whether the
// picture matches the golden when moved by a pixel or two (a shift, not a
// different drawing). For the first failure it also draws a small part of the
// expected and actual images as text, one character per pixel.
//
//   node tools/ci-diff-report.mjs [test-results]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle');
const root = process.argv[2] || 'test-results';
if (!existsSync(root)) process.exit(0);

const files = [];
const walk = dir => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('-diff.png')) files.push(p);
  }
};
walk(root);

const read = p => existsSync(p) ? PNG.sync.read(readFileSync(p)) : null;
const lum = (img, x, y) => { const i = (y * img.width + x) * 4; return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]; };
const ramp = '@%#*+=-:. ';   // dark to light
const draw = (img, x0, y0, w, h) => {
  const rows = [];
  for (let y = y0; y < Math.min(img.height, y0 + h); y++) {
    let s = '';
    for (let x = x0; x < Math.min(img.width, x0 + w); x++) s += ramp[Math.min(9, Math.floor(lum(img, x, y) / 25.6))];
    rows.push(s);
  }
  return rows;
};

let printed = false;
for (const diffPath of files.sort()) {
  const diff = read(diffPath);
  // Playwright marks the pixels it counted red in the diff image.
  const W = 110, H = 24;   // the part drawn as text, where most counted pixels are
  let n = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  const blocks = new Map();
  for (let y = 0; y < diff.height; y++) for (let x = 0; x < diff.width; x++) {
    const i = (y * diff.width + x) * 4;
    if (diff.data[i] > 200 && diff.data[i + 1] < 80 && diff.data[i + 2] < 80) {
      n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      const b = `${Math.floor(x / W) * W},${Math.floor(y / H) * H}`;
      blocks.set(b, (blocks.get(b) || 0) + 1);
    }
  }
  console.log(`DIFF ${diffPath}: ${n} px counted, box ${x0},${y0}-${x1},${y1}`);
  const expected = read(diffPath.replace(/-diff\.png$/, '-expected.png'));
  const actual = read(diffPath.replace(/-diff\.png$/, '-actual.png'));
  if (!expected || !actual) continue;
  if (expected.width !== actual.width || expected.height !== actual.height) {
    console.log(`  size: expected ${expected.width}x${expected.height}, actual ${actual.width}x${actual.height}`);
    continue;
  }
  // How far apart the colours are, over every pixel that is not byte-equal.
  const buckets = [0, 0, 0, 0, 0], edges = [2, 8, 32, 128, 255];
  let changed = 0;
  for (let i = 0; i < expected.data.length; i += 4) {
    const d = Math.max(Math.abs(expected.data[i] - actual.data[i]), Math.abs(expected.data[i + 1] - actual.data[i + 1]), Math.abs(expected.data[i + 2] - actual.data[i + 2]));
    if (!d) continue;
    changed++;
    buckets[edges.findIndex(e => d <= e)]++;
  }
  console.log(`  ${changed} px not equal; largest channel difference 1-2: ${buckets[0]}, 3-8: ${buckets[1]}, 9-32: ${buckets[2]}, 33-128: ${buckets[3]}, 129+: ${buckets[4]}`);
  // Does the actual picture equal the expected one moved by (dx, dy)?
  const shifts = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    let bad = 0;
    for (let y = Math.max(0, y0, -dy); y <= Math.min(y1, expected.height - 1 - dy); y++)
      for (let x = Math.max(0, x0, -dx); x <= Math.min(x1, expected.width - 1 - dx); x++)
        if (Math.abs(lum(expected, x, y) - lum(actual, x + dx, y + dy)) > 24) bad++;
    shifts.push([bad, dx, dy]);
  }
  shifts.sort((a, b) => a[0] - b[0]);
  console.log(`  pixels far apart if actual is moved by (dx,dy): ${shifts.slice(0, 4).map(([b, dx, dy]) => `(${dx},${dy}) ${b}`).join(', ')}`);
  if (printed || !n) continue;
  printed = true;
  const [cx, cy] = [...blocks].sort((p, q) => q[1] - p[1])[0][0].split(',').map(Number);
  const e = draw(expected, cx, cy, W, H), a = draw(actual, cx, cy, W, H);
  console.log(`  expected | actual, from ${cx},${cy} (one character per pixel, @ dark . light)`);
  e.forEach((row, i) => console.log(`  ${row} | ${a[i]}`));
}
