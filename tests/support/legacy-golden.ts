// For scenarios that replace a legacy one in the new system
// (tests/intentional-changes.json): the steps that did not change must still
// match the replaced scenario's goldens, which were recorded from the legacy
// app. These helpers read those goldens; nothing here records or changes them.
import { readFileSync } from 'node:fs';
import type { Page, TestInfo } from '@playwright/test';
// The image comparator behind toHaveScreenshot.
import { getComparator } from 'playwright-core/lib/utils';
import { expect } from './test';

const compare = getComparator('image/png');
const golden = (scenario: string, file: string) => new URL(`../golden/${scenario}/${file}`, import.meta.url);

type App = { settle(): Promise<void>; signature(): Promise<object>; layoutStable(): Promise<void>; screenshotStyle: string };

// Walks the replaced scenario's flow.json step by step.
export function legacySteps(scenario: string, app: App) {
  const flow: { step: string }[] = JSON.parse(readFileSync(golden(scenario, 'flow.json'), 'utf8'));
  let i = 0;
  return {
    // The next legacy step must have this label and look the same.
    async same(label: string) {
      await app.settle();
      const legacy = flow[i++];
      expect(legacy?.step, `step ${i} of ${scenario}`).toBe(label);
      expect({ step: label, ...(await app.signature()) }).toEqual(legacy);
    },
    // A legacy step this scenario leaves out on purpose (its reason is in the scenario).
    skip(label: string) {
      expect(flow[i++]?.step).toBe(label);
    },
    done() { expect(i, `all steps of ${scenario}`).toBe(flow.length); },
  };
}

// The screen must be the replaced scenario's screenshot, pixel for pixel:
// taken and compared the way golden.screen() (toHaveScreenshot with
// maxDiffPixels 0) does it, against the legacy PNG.
export async function sameScreen(page: Page, app: App, testInfo: TestInfo, scenario: string, name: string) {
  await app.settle();
  await page.mouse.move(0, 0);
  await app.layoutStable();
  const expected = readFileSync(golden(scenario, `${name}.png`));
  const shot = () => page.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css', style: app.screenshotStyle });
  const differs = (b: Buffer) => compare(b, expected, { maxDiffPixels: 0 });
  // Like toHaveScreenshot: retry until the expect timeout.
  const until = Date.now() + 15_000;
  let actual = await shot(), result = differs(actual);
  while (result && Date.now() < until) { await page.waitForTimeout(250); actual = await shot(); result = differs(actual); }
  if (result) {
    await testInfo.attach(`${name}-actual.png`, { body: actual, contentType: 'image/png' });
    if (result.diff) await testInfo.attach(`${name}-diff.png`, { body: result.diff, contentType: 'image/png' });
  }
  expect(result?.errorMessage ?? null, `screen ${name} is ${scenario}'s ${name}.png`).toBeNull();
}

// What an action changed in the data must be what the replaced scenario's
// golden says (the same referee as golden.stateChange()).
export function legacyStateChange(scenario: string, name: string): string {
  return readFileSync(golden(scenario, `${name}-state.json`), 'utf8');
}
