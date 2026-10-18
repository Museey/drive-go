// Test fixtures for every scenario. Import { test, expect } from here, not
// from @playwright/test.
//
//   app     drives the app under test (today: the legacy HTML)
//   golden  the three referees, each compared with goldens recorded from the
//           legacy app under tests/golden/<spec file>/:
//             golden.stateChange(name, before)  referee 1: what the action changed in the data
//             golden.screen(name)               referee 2: screenshot
//             golden.step(label)                referee 3: page, pop-ups and messages at each step
//                                               (all steps of a test are checked together as flow.json)
//             golden.counts(name)               referee 1 for actions that replace the whole data set
//                                               (wipe, restore, import, demo data): record counts per collection
import { test as base, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { prepareContext } from './browser.mjs';
import { FIXED_NOW, FRONTEND_URL, LEGACY_ORIGIN, LEGACY_URL, NEW_URL, TEST_SEED } from './config.mjs';
import { legacyApp, messageRecorderInitScript } from './legacy-app.mjs';
import { stateDiff, stateCounts, formatDiff } from './state-diff.mjs';
import { executedFunctions } from './coverage.mjs';
import { SABOTAGE } from './sabotage.mjs';

const TARGET = process.env.TARGET || 'legacy';

type App = ReturnType<typeof legacyApp>;
type Golden = {
  step(label: string): Promise<void>;
  screen(name: string): Promise<void>;
  stateChange(name: string, before: unknown): Promise<void>;
  counts(name: string): Promise<void>;
};

export const test = base.extend<{ dataset: string; app: App; golden: Golden }>({
  // Starting data put into the browser before the app first opens (tests/fixtures/<dataset>.json).
  dataset: ['biz-trial', { option: true }],

  context: async ({ context }, use) => {
    await prepareContext(context, { seed: TEST_SEED, now: FIXED_NOW });
    await context.addInitScript(messageRecorderInitScript);
    if (process.env.SABOTAGE) await context.addInitScript(SABOTAGE[process.env.SABOTAGE]);
    await use(context);
  },

  page: async ({ page }, use, testInfo) => {
    const coverage = !!process.env.COVERAGE;
    if (coverage) await page.coverage.startJSCoverage({ resetOnNavigation: false });
    // Every file of the app itself must load (a split-out script that fails
    // to load would otherwise only show up in scenarios that use it).
    const missing: string[] = [];
    page.on('response', r => { if (r.url().startsWith(LEGACY_ORIGIN) && r.status() >= 400) missing.push(`${r.status()} ${r.url()}`); });
    page.on('requestfailed', r => {
      if (r.url().startsWith(LEGACY_ORIGIN) && !/ERR_ABORTED/.test(r.failure()?.errorText || '')) missing.push(`${r.failure()?.errorText} ${r.url()}`);
    });
    await use(page);
    expect(missing, 'files of the app that failed to load').toEqual([]);
    if (coverage) {
      const ran = executedFunctions(await page.coverage.stopJSCoverage());
      mkdirSync('coverage/raw', { recursive: true });
      writeFileSync(`coverage/raw/${testInfo.testId}.json`, JSON.stringify({ test: testInfo.titlePath.join(' › '), ran }));
    }
  },

  // legacy: the original HTML (goldens are recorded from it).
  // frontend: the same app split into files in Phase 1; must match every golden.
  // new: the new system (Phase 2, server/); must match every golden too.
  app: async ({ page, dataset }, use) => {
    const url = { legacy: LEGACY_URL, frontend: FRONTEND_URL, new: NEW_URL }[TARGET];
    if (!url) throw new Error(`No app adapter for TARGET=${TARGET}.`);
    await use(legacyApp(page, { dataset, url }));
  },

  golden: async ({ page, app }, use, testInfo) => {
    const steps: object[] = [];
    await use({
      async step(label) {
        await app.settle();
        steps.push({ step: label, ...(await app.signature()) });
      },
      async screen(name) {
        await app.settle();
        // Park the pointer so hover effects never depend on the last click.
        await page.mouse.move(0, 0);
        await app.layoutStable();
        await expect(page).toHaveScreenshot(`${name}.png`, { style: app.screenshotStyle });
      },
      async stateChange(name, before) {
        await app.settle();
        const after = await app.state();
        expect(formatDiff(stateDiff(before, after))).toMatchSnapshot(`${name}.state.json`);
      },
      async counts(name) {
        await app.settle();
        expect(formatDiff(stateCounts(await app.state()))).toMatchSnapshot(`${name}.counts.json`);
      },
    });
    if (steps.length && testInfo.status === testInfo.expectedStatus)
      expect(JSON.stringify(steps, null, 2) + '\n').toMatchSnapshot('flow.json');
  },
});

export { expect };
