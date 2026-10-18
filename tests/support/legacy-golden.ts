// For scenarios that replace a legacy one in the new system
// (tests/intentional-changes.json): the steps that did not change must still
// match the replaced scenario's goldens, which were recorded from the legacy
// app. These helpers read those goldens; nothing here records or changes them.
import { readFileSync } from 'node:fs';
import type { Page, TestInfo } from '@playwright/test';
import { expect } from './test';

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
// taken the way golden.screen() takes it, and equal to the legacy PNG.
export async function sameScreen(page: Page, app: App, testInfo: TestInfo, scenario: string, name: string) {
  await app.settle();
  await page.mouse.move(0, 0);
  await app.layoutStable();
  const shot = () => page.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css', style: app.screenshotStyle });
  let a = await shot(), b = await shot();
  for (let n = 0; !a.equals(b) && n < 10; n++) { a = b; b = await shot(); }
  const expected = readFileSync(golden(scenario, `${name}.png`));
  if (!b.equals(expected)) await testInfo.attach(`${name}-actual.png`, { body: b, contentType: 'image/png' });
  expect(b.equals(expected), `screen ${name} is ${scenario}'s ${name}.png`).toBe(true);
}

// What an action changed in the data must be what the replaced scenario's
// golden says (the same referee as golden.stateChange()).
export function legacyStateChange(scenario: string, name: string): string {
  return readFileSync(golden(scenario, `${name}-state.json`), 'utf8');
}
