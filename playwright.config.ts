import { defineConfig } from '@playwright/test';
import { CONTEXT_OPTIONS, LEGACY_URL } from './tests/support/config.mjs';

// Which app the scenarios run against. Goldens are always recorded from the
// legacy HTML; any other target is only ever compared with them.
const TARGET = process.env.TARGET || 'legacy';
const updating = process.argv.some(a => a === '-u' || a.startsWith('--update-snapshots'));
if (TARGET !== 'legacy' && updating)
  throw new Error('Goldens can only be recorded from the legacy app (TARGET=legacy).');

export default defineConfig({
  testDir: 'tests/scenarios',
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
});
