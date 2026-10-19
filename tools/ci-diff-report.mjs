// After a failed CI run: where each failed screenshot differs from its golden,
// as text in the job log (the run's files are not always reachable from where
// the failure is studied). For the first failure it also prints small crops of
// the expected and actual images around the first difference, base64 PNG
// between BEGIN/END lines, so they can be rebuilt from the log.
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

let printed = false;
for (const diffPath of files.sort()) {
  const diff = PNG.sync.read(readFileSync(diffPath));
  // Playwright marks differing pixels red in the diff image.
  let n = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  const rows = new Map();
  for (let y = 0; y < diff.height; y++) for (let x = 0; x < diff.width; x++) {
    const i = (y * diff.width + x) * 4;
    if (diff.data[i] > 200 && diff.data[i + 1] < 80 && diff.data[i + 2] < 80) {
      n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      const band = Math.floor(y / 40) * 40;
      rows.set(band, (rows.get(band) || 0) + 1);
    }
  }
  console.log(`DIFF ${diffPath}: ${n} px, box ${x0},${y0}-${x1},${y1}, rows ${[...rows].map(([b, c]) => `${b}:${c}`).join(' ')}`);
  if (printed || !n) continue;
  printed = true;
  const actualPath = diffPath.replace(/-diff\.png$/, '-actual.png'), expectedPath = diffPath.replace(/-diff\.png$/, '-expected.png');
  for (const [label, path] of [['expected', expectedPath], ['actual', actualPath]]) {
    if (!existsSync(path)) continue;
    const img = PNG.sync.read(readFileSync(path));
    const w = Math.min(420, img.width), h = Math.min(160, img.height);
    const cx = Math.max(0, Math.min(img.width - w, x0 - 20)), cy = Math.max(0, Math.min(img.height - h, y0 - 20));
    const crop = new PNG({ width: w, height: h });
    PNG.bitblt(img, crop, cx, cy, w, h, 0, 0);
    console.log(`BEGIN ${label} ${cx},${cy} ${w}x${h}`);
    console.log(PNG.sync.write(crop).toString('base64'));
    console.log(`END ${label}`);
  }
}
