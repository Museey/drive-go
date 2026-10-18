// For scenarios that replace a legacy one in the new system
// (tests/intentional-changes.json): the steps that did not change must still
// match the replaced scenario's goldens, which were recorded from the legacy
// app. These helpers read those goldens; nothing here records or changes them.
import { readFileSync } from 'node:fs';
import type { Locator, Page, TestInfo } from '@playwright/test';
// The image comparator behind toHaveScreenshot, and its PNG codec.
import { getComparator } from 'playwright-core/lib/utils';
import { PNG } from 'playwright-core/lib/utilsBundle';
import { expect } from './test';
import { formatDiff, stateDiff } from './state-diff.mjs';

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
// `mask`: elements that show what was changed on purpose (the scenario checks
// their content itself); their boxes are painted over in both images, so
// everything around them must still match.
export async function sameScreen(page: Page, app: App, testInfo: TestInfo, scenario: string, name: string,
  { mask = [] }: { mask?: Locator[] } = {}) {
  await app.settle();
  await page.mouse.move(0, 0);
  await app.layoutStable();
  const boxes: { x: number; y: number; width: number; height: number }[] = [];
  // Widened a little: a badge may stick out of the element it belongs to.
  for (const l of mask) for (const el of await l.all()) {
    const b = await el.boundingBox();
    if (b) boxes.push({ x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 });
  }
  if (mask.length) expect(boxes.length, `masked elements of ${name}`).toBeGreaterThan(0);
  const expected = paint(readFileSync(golden(scenario, `${name}.png`)), boxes);
  const shot = async () => paint(await page.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css', style: app.screenshotStyle }), boxes);
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

// Fills each box (CSS pixels, widened to whole pixels) with one colour.
function paint(png: Buffer, boxes: { x: number; y: number; width: number; height: number }[]): Buffer {
  if (!boxes.length) return png;
  const img = PNG.sync.read(png);
  for (const b of boxes) {
    const x1 = Math.min(img.width, Math.ceil(b.x + b.width)), y1 = Math.min(img.height, Math.ceil(b.y + b.height));
    for (let y = Math.max(0, Math.floor(b.y)); y < y1; y++)
      for (let x = Math.max(0, Math.floor(b.x)); x < x1; x++) img.data.set([255, 0, 255, 255], (y * img.width + x) * 4);
  }
  return PNG.sync.write(img);
}

// What an action changed in the data must be what the replaced scenario's
// golden says (the same referee as golden.stateChange()).
export function legacyStateChange(scenario: string, name: string): string {
  return readFileSync(golden(scenario, `${name}-state.json`), 'utf8');
}

// The replaced scenario's goldens used the way the golden fixture is used:
// every step, screen and data change must be the legacy one (a screen may
// leave out what the new scenario checks itself, see sameScreen's mask).
export function legacyGolden(scenario: string, { app, page, testInfo }: { app: App & { state(): Promise<object> }; page: Page; testInfo: TestInfo }) {
  const steps = legacySteps(scenario, app);
  return {
    step: steps.same,
    skip: steps.skip,
    done: steps.done,
    screen: (name: string, opts?: { mask?: Locator[] }) => sameScreen(page, app, testInfo, scenario, name, opts),
    async stateChange(name: string, before: object) {
      await app.settle();
      expect(formatDiff(stateDiff(before, await app.state())), `data change ${name}`).toBe(legacyStateChange(scenario, name));
    },
  };
}
