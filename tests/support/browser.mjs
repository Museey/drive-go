// Browser setup shared by the tests and the fixture tool: frozen clock,
// seeded Math.random, Google Fonts served from tests/support/fonts, and no
// other outside network.
import { readFileSync } from 'node:fs';
import { FIXED_NOW, seedRandomInitScript } from './config.mjs';

const fontsDir = new URL('./fonts/', import.meta.url);
const fonts = JSON.parse(readFileSync(new URL('manifest.json', fontsDir), 'utf8'));

export async function prepareContext(context, seed) {
  await context.clock.setFixedTime(new Date(FIXED_NOW));
  await context.addInitScript(seedRandomInitScript, seed);
  await context.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, route => {
    const hit = fonts[route.request().url()];
    if (!hit) return route.abort();
    return route.fulfill({
      path: new URL(hit.file, fontsDir).pathname,
      contentType: hit.type,
      headers: { 'access-control-allow-origin': '*' },
    });
  });
}

// The legacy app is ready when its sign-in button is enabled (boot finished)
// or it has already opened the workspace.
export async function waitForLegacyBoot(page) {
  await page.waitForFunction(
    () => document.documentElement.classList.contains('pkg-open') ||
      !!document.querySelector('#drivego-studio [type="submit"]:not([disabled])'),
    null, { timeout: 90_000 });
}

// Snapshot of everything the legacy app persists: DB (business data),
// FR (franchise accounts/branches) and DGB (shop account and session).
export function readState(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify({ DB, FR, DGB })));
}

// Waits until the persisted state stops changing (demo seeding, deferred saves).
export async function waitForStableState(page, { quietMs = 3000, timeoutMs = 120_000 } = {}) {
  const start = Date.now();
  let last = '', since = Date.now();
  while (Date.now() - start < timeoutMs) {
    const now = await page.evaluate(() => JSON.stringify({ DB, FR, DGB }));
    if (now !== last) { last = now; since = Date.now(); }
    else if (Date.now() - since >= quietMs) return;
    await page.waitForTimeout(250);
  }
  throw new Error('legacy state did not settle');
}
