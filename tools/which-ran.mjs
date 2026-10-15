// Which scenarios executed the given legacy functions, from the coverage
// files that `COVERAGE=1 npx playwright test …` writes to coverage/raw/.
//
//   node tools/which-ran.mjs saveSetting addCoa backupNow
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const names = process.argv.slice(2);
const dir = new URL('../coverage/raw/', import.meta.url);
if (!existsSync(dir)) { console.log('no coverage yet: run COVERAGE=1 npx playwright test <files>'); process.exit(1); }
const ranBy = new Map(names.map(n => [n, new Set()]));
for (const f of readdirSync(dir)) {
  const { test, ran } = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
  const id = (test.match(/\bS\d+\b/) || [test])[0];
  // A function replaced by `window.x = function…` runs under the name "window.x".
  for (const r of ran) {
    const n = r.name.replace(/^window\./, '');
    if (ranBy.has(n)) ranBy.get(n).add(id);
  }
}
for (const [n, s] of ranBy) console.log(`${s.size ? 'ran    ' : 'NOT RUN'}  ${n}${s.size ? '  ← ' + [...s].sort().join(' ') : ''}`);
