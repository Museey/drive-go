// Builds a frozen starting dataset for the tests and saves the browser storage
// (IndexedDB + localStorage) to tests/fixtures/<plan>-<kind>.json.
//
//   node tools/make-fixture.mjs [biz|prox|franchise] [trial|full]
//
// trial (default) = what a tester gets from DRIVEGO_TRIAL_v24.html: on first
//         open the app fills itself with 36 months of demo data, and on the
//         owner's first sign-in it replaces the documents with the "ready to
//         try" set (PKG_TRIAL.fresh), shows "ข้อมูลทดลองพร้อมใช้งาน" and reloads.
//         We press ตกลง, let it reload, then sign out.
// full  = the 36-month demo data right after the first open (no sign-in).
//         About 18 MB, so it is not committed.
//
// Clock and Math.random are fixed (tests/support/config.mjs), so the content
// is the same on every run, but generated ids may differ: timers in the app
// draw random numbers before the trial data is built, and how many depends on
// timing. Goldens alias ids, so they do not depend on them. The committed
// fixture is the reference; rebuild only when the starting data must change. Two storage keys are dropped because they only hold
// copies of the data: the daily backup (<key>.bak.<date>) and the copy kept
// for ?restoreTrial=1 (<key>.trialkeep).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CONTEXT_OPTIONS, LAUNCH_OPTIONS, FIXTURE_NOW, FIXTURE_SEED, LEGACY_URL, OWNERS } from '../tests/support/config.mjs';
import { prepareContext, waitForLegacyBoot, waitForStableState, readState } from '../tests/support/browser.mjs';

const plan = process.argv[2] || 'biz';
const kind = process.argv[3] || 'trial';
const server = spawn(process.execPath, [new URL('serve.mjs', import.meta.url).pathname], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 500));
try {
  const browser = await chromium.launch(LAUNCH_OPTIONS);
  const context = await browser.newContext(CONTEXT_OPTIONS);
  await prepareContext(context, { seed: FIXTURE_SEED, now: FIXTURE_NOW });
  const page = await context.newPage();
  await page.goto(`${LEGACY_URL}?package=${plan}&login=account`);
  await waitForLegacyBoot(page);
  await waitForStableState(page);

  if (kind === 'trial') {
    const owner = OWNERS[plan];
    const studio = page.locator('#drivego-studio');
    await studio.locator('input:not([type=password]):visible').first().fill(owner.user);
    await studio.getByPlaceholder('กรอกรหัสผ่าน').fill(owner.pass);
    await page.locator('#drivego-studio [type="submit"]:visible').click();
    const ready = page.locator('#mAsk.on');
    await ready.filter({ hasText: 'ข้อมูลทดลองพร้อมใช้งาน' }).waitFor({ timeout: 120_000 });
    await Promise.all([page.waitForEvent('load'), ready.getByRole('button', { name: 'ตกลง' }).click()]);
    await waitForLegacyBoot(page);
    await waitForStableState(page);
    // After the reload the app may reopen the owner's session; sign out so
    // every test starts from the sign-in screen.
    if (await page.evaluate(() => document.documentElement.classList.contains('pkg-open'))) {
      await page.locator('#pkg-logout').click();
      await page.locator('#drivego-studio [type="submit"]:not([disabled])').waitFor();
      await waitForStableState(page);
    }
  }

  const s = await readState(page);
  console.log(`${plan}-${kind}: receipts=${s.DB.receipts.length} quotes=${s.DB.quotes.length} cust=${s.DB.cust.length} stock=${s.DB.stock.length} emp=${s.DB.emp.length} shop=${!!s.DGB.shop} session=${JSON.stringify(s.DGB.session)}`);

  mkdirSync(new URL('../tests/fixtures/', import.meta.url), { recursive: true });
  const path = new URL(`../tests/fixtures/${plan}-${kind}.json`, import.meta.url).pathname;
  await context.storageState({ path, indexedDB: true });
  const state = JSON.parse(readFileSync(path, 'utf8'));
  for (const o of state.origins)
    for (const db of o.indexedDB || [])
      for (const st of db.stores) st.records = st.records.filter(r => !/\.bak\.|\.trialkeep$/.test(String(r.key)));
  writeFileSync(path, JSON.stringify(state));
  console.log('saved', path);
  await browser.close();
} finally {
  server.kill();
}
