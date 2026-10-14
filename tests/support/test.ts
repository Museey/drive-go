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
import { test as base, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { prepareContext } from './browser.mjs';
import { TEST_SEED } from './config.mjs';
import { legacyApp, messageRecorderInitScript } from './legacy-app.mjs';
import { stateDiff, formatDiff } from './state-diff.mjs';
import { executedFunctions } from './coverage.mjs';
import { SABOTAGE } from './sabotage.mjs';

const TARGET = process.env.TARGET || 'legacy';

type App = ReturnType<typeof legacyApp>;
type Golden = {
  step(label: string): Promise<void>;
  screen(name: string): Promise<void>;
  stateChange(name: string, before: unknown): Promise<void>;
};

export const test = base.extend<{ dataset: string; app: App; golden: Golden }>({
  // Starting data restored into the browser before the test (tests/fixtures/<dataset>.json).
  dataset: ['biz-trial', { option: true }],

  storageState: async ({ dataset }, use) => {
    await use(new URL(`../fixtures/${dataset}.json`, import.meta.url).pathname);
  },

  context: async ({ context }, use) => {
    await prepareContext(context, TEST_SEED);
    await context.addInitScript(messageRecorderInitScript);
    if (process.env.SABOTAGE) await context.addInitScript(SABOTAGE[process.env.SABOTAGE]);
    await use(context);
  },

  page: async ({ page }, use, testInfo) => {
    const coverage = !!process.env.COVERAGE;
    if (coverage) await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);
    if (coverage) {
      const ran = executedFunctions(await page.coverage.stopJSCoverage());
      mkdirSync('coverage/raw', { recursive: true });
      writeFileSync(`coverage/raw/${testInfo.testId}.json`, JSON.stringify({ test: testInfo.titlePath.join(' › '), ran }));
    }
  },

  app: async ({ page }, use) => {
    if (TARGET !== 'legacy') throw new Error(`No app adapter for TARGET=${TARGET} yet (added in Phase 2).`);
    await use(legacyApp(page));
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
        await expect(page).toHaveScreenshot(`${name}.png`, { style: app.screenshotStyle });
      },
      async stateChange(name, before) {
        await app.settle();
        const after = await app.state();
        expect(formatDiff(stateDiff(before, after))).toMatchSnapshot(`${name}.state.json`);
      },
    });
    if (steps.length && testInfo.status === testInfo.expectedStatus)
      expect(JSON.stringify(steps, null, 2) + '\n').toMatchSnapshot('flow.json');
  },
});

export { expect };
