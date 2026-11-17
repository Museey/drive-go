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
  use: { ...CONTEXT_OPTIONS, deviceScaleFactor: 2, browserName: 'chromium', launchOptions: LAUNCH_OPTIONS, trace: 'off', actionTimeout: 30_000 },
  globalSetup: '../../tests/support/new-system-setup.mjs',
});
