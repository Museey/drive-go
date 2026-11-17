// Screenshots for the user manual (tools/manual/build.mjs): each *.spec.ts here walks one chapter on the new system
// (TARGET=new, one shop per test from the fixture biz-trial, the clock at 2026-10-13 09:00 as in the scenarios) and
// saves its screenshots to $MANUAL_OUT/img. Run by build.mjs; by hand:
//   TARGET=new MANUAL_OUT=<folder> npx playwright test -c tools/manual/manual.config.ts
import { defineConfig } from '@playwright/test';
import { CONTEXT_OPTIONS, LAUNCH_OPTIONS } from '../../tests/support/config.mjs';

export default defineConfig({
  testDir: '.',
  testMatch: /\d\d-.*\.spec\.ts$/,
  fullyParallel: true,
  timeout: 600_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  // Pictures people read: twice the pixels (the PDF shows them at half size, sharp on screen and paper).
  // 1280 × 960: a little taller than the tests' 800, so a list shows its first rows under its filters. --lang: date and
  // time fields drawn the Thai way (13/10/2026, 09:00) instead of the US way; the page's locale alone does not do it.
  use: { ...CONTEXT_OPTIONS, viewport: { width: 1280, height: 960 }, deviceScaleFactor: 2, browserName: 'chromium',
    launchOptions: { ...LAUNCH_OPTIONS, args: [...LAUNCH_OPTIONS.args, '--lang=th-TH'] }, trace: 'off', actionTimeout: 30_000 },
  globalSetup: '../../tests/support/new-system-setup.mjs',
});
