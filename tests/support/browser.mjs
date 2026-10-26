// Browser setup shared by the tests and the fixture tool: frozen clock,
// seeded Math.random, Google Fonts served from tests/support/fonts, and no
// other outside network.
import { readFileSync } from 'node:fs';
import { LEGACY_ORIGIN, seedRandomInitScript } from './config.mjs';

const fontsDir = new URL('./fonts/', import.meta.url);
const fonts = JSON.parse(readFileSync(new URL('manifest.json', fontsDir), 'utf8'));

export async function prepareContext(context, { seed, now }) {
  await context.clock.setFixedTime(new Date(now));
  await context.addInitScript(seedRandomInitScript, seed);
  // The side menu slides a submenu open over 560 ms. A click that lands while
  // it moves can hit the neighbouring item first and scroll the menu: a
  // timing effect, not behaviour, and the new system's timing differs from
  // the legacy file's. The test browser opens submenus at once.
  await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '#tabs .navchildren{transition:none!important}';
    document.head.append(style);
  }, { once: true }));
  // What the new system's live updates put into the app (task 3.10), for the report of a screenshot that differs.
  await context.addInitScript(() => {
    const log = window.__drivegoLive = [];
    for (const name of ['drivego:heard', 'drivego:applied', 'drivego:rights'])
      window.addEventListener(name, e => { if (log.length < 100) log.push(`${name.slice(8)} ${JSON.stringify(e.detail).slice(0, 160)}`); });
  });
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

// Puts a saved dataset (tests/fixtures/<name>.json, the storageState format)
// into the browser before the app starts: a blank page on the app's origin
// writes IndexedDB and localStorage and waits until the writes are committed.
// Done by hand instead of Playwright's storageState so the app can never read
// IndexedDB before the data is there.
export async function restoreDataset(page, dataset) {
  const state = JSON.parse(readFileSync(new URL(`../fixtures/${dataset}.json`, import.meta.url), 'utf8'));
  // A fixture holds one origin; the port it was saved from does not matter.
  const origin = state.origins[0];
  await page.route(`${LEGACY_ORIGIN}/__blank`, r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>restore</title>' }));
  await page.goto(`${LEGACY_ORIGIN}/__blank`);
  await page.evaluate(async origin => {
    localStorage.clear();
    for (const { name, value } of origin.localStorage || []) localStorage.setItem(name, value);
    for (const db of origin.indexedDB || []) {
      await new Promise((res, rej) => { const r = indexedDB.deleteDatabase(db.name); r.onsuccess = res; r.onerror = () => rej(r.error); });
      const conn = await new Promise((res, rej) => {
        const r = indexedDB.open(db.name, db.version);
        r.onupgradeneeded = () => {
          for (const st of db.stores) {
            const os = r.result.createObjectStore(st.name, { keyPath: st.keyPath, autoIncrement: st.autoIncrement });
            for (const ix of st.indexes || []) os.createIndex(ix.name, ix.keyPath, { unique: ix.unique, multiEntry: ix.multiEntry });
          }
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      for (const st of db.stores) {
        const tx = conn.transaction(st.name, 'readwrite');
        const os = tx.objectStore(st.name);
        for (const rec of st.records) st.keyPath ? os.put(rec.value) : os.put(rec.value, rec.key);
        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
      }
      conn.close();
    }
  }, origin);
  await page.unroute(`${LEGACY_ORIGIN}/__blank`);
}

// TARGET=new keeps the shop's data on the server (new-shop.mjs); only what the
// app keeps in the browser itself (localStorage) is put into the browser.
export async function restoreLocalStorage(page, dataset) {
  const state = JSON.parse(readFileSync(new URL(`../fixtures/${dataset}.json`, import.meta.url), 'utf8'));
  await page.route(`${LEGACY_ORIGIN}/__blank`, r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>restore</title>' }));
  await page.goto(`${LEGACY_ORIGIN}/__blank`);
  await page.evaluate(items => {
    localStorage.clear();
    for (const { name, value } of items) localStorage.setItem(name, value);
  }, state.origins[0].localStorage || []);
  await page.unroute(`${LEGACY_ORIGIN}/__blank`);
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
