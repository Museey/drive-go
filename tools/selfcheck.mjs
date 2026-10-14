// Proves the referees work: runs S01 once per deliberate breakage
// (tests/support/sabotage.mjs) and requires that the run fails on the
// golden of the matching referee. Exit code 0 = every breakage was caught.
import { spawnSync } from 'node:child_process';

const SPEC = 'tests/scenarios/S01-pay-stock-cut-cash.spec.ts';
const CASES = [
  ['skip-audit', 'pay-cash-state.json', 'ข้อมูลที่เปลี่ยน (state)'],
  ['recolor-title', 'pay-panel.png', 'ภาพหน้าจอ'],
  ['reword-message', 'flow.json', 'ลำดับขั้นตอนและข้อความ'],
];

let ok = true;
for (const [name, golden, referee] of CASES) {
  const r = spawnSync('npx', ['playwright', 'test', SPEC, '--reporter=line'], {
    env: { ...process.env, SABOTAGE: name }, encoding: 'utf8',
  });
  const out = r.stdout + r.stderr;
  const caught = r.status !== 0 && out.includes(golden);
  ok &&= caught;
  console.log(`${caught ? 'จับได้   ' : 'จับไม่ได้'}  ${name.padEnd(15)} → กรรมการ${referee} (${golden})`);
}
process.exit(ok ? 0 : 1);
