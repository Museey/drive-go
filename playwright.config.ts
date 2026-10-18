import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
import { CONTEXT_OPTIONS, LEGACY_URL } from './tests/support/config.mjs';

// Which app the scenarios run against. Goldens are always recorded from the
// legacy HTML; any other target is only ever compared with them.
const TARGET = process.env.TARGET || 'legacy';

// Approved behaviour changes (tests/intentional-changes.json): for TARGET=new
// a replaced scenario gives way to the one written for the new behaviour,
// which in turn never runs against the legacy app.
const { replaced } = JSON.parse(readFileSync('tests/intentional-changes.json', 'utf8')) as
  { replaced: { scenario: string; by: string; decision: string }[] };
for (const r of replaced) {
  if (!r.decision) throw new Error(`${r.scenario}: no approved decision given`);
  for (const f of [r.scenario, r.by]) if (!existsSync(`tests/scenarios/${f}`)) throw new Error(`tests/intentional-changes.json: tests/scenarios/${f} does not exist`);
}
const updating = process.argv.some(a => a === '-u' || a.startsWith('--update-snapshots'));
if (TARGET !== 'legacy' && updating)
  throw new Error('Goldens can only be recorded from the legacy app (TARGET=legacy).');

export default defineConfig({
  testDir: 'tests/scenarios',
  testIgnore: replaced.map(r => `**/${TARGET === 'new' ? r.scenario : r.by}`),
  snapshotPathTemplate: '{testDir}/../golden/{testFileName}/{arg}{ext}',
  updateSnapshots: TARGET === 'legacy' ? 'missing' : 'none',
  fullyParallel: true,
  timeout: 300_000,
  expect: { timeout: 15_000, toHaveScreenshot: { maxDiffPixels: 0 } },
  reporter: [['list']],
  use: { ...CONTEXT_OPTIONS, browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: TARGET === 'legacy'
    ? { command: 'node tools/serve.mjs', url: LEGACY_URL, reuseExistingServer: !process.env.CI }
    : undefined,
  // TARGET=new: builds server/ and starts it with a throwaway database for the
  // whole run (the workers open one shop per test in it).
  globalSetup: TARGET === 'new' ? './tests/support/new-system-setup.mjs' : undefined,
});
