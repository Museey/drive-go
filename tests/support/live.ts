// Another device of the same shop (task 3.10 scenarios, TARGET=new only): its own browser and session, the same
// shop address and the same fixed clock, as S126 does it.
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { prepareContext } from './browser.mjs';
import { CONTEXT_OPTIONS, FIXED_NOW, TEST_SEED } from './config.mjs';
import { legacyApp } from './legacy-app.mjs';

export async function secondDevice(browser: Browser, page: Page, n = 1): Promise<{ page: Page; app: ReturnType<typeof legacyApp>; context: BrowserContext }> {
  const context = await browser.newContext(CONTEXT_OPTIONS);
  await prepareContext(context, { seed: TEST_SEED + n, now: FIXED_NOW });
  const other = await context.newPage();
  return { page: other, app: legacyApp(other, { url: page.url().split('?')[0], restore: async () => {} }), context };
}

// Waits until a device has put every save it heard into the app's data (window.storage.live, server/client/live.ts).
export async function heard(page: Page): Promise<void> {
  await page.waitForFunction(() => !(window as any).storage.live.waiting);
  await page.evaluate(() => (window as any).storage.idle());
}
