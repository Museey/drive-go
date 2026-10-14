// Helper for writing scenarios: signs in as the owner on the test fixture,
// runs a few Playwright actions, then prints what the user would see
// (page, pop-ups, messages), the visible buttons and inputs of the top-most
// pop-up (or the page), and saves a screenshot.
//
//   node tools/explore.mjs <name> "<actions>"
//   node tools/explore.mjs pay "await page.getByRole('button', { name: 'ดูใบตัดสต็อกที่รอชำระ' }).click();"
//
// <actions> is the body of an async function with `page` and `app` in scope.
// Screenshot: test-results/explore/<name>.png. Needs the legacy server
// (node tools/serve.mjs) running, or starts one.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { CONTEXT_OPTIONS, TEST_SEED } from '../tests/support/config.mjs';
import { prepareContext } from '../tests/support/browser.mjs';
import { legacyApp, messageRecorderInitScript } from '../tests/support/legacy-app.mjs';

const [name = 'explore', actions = '', dataset = 'biz-trial'] = process.argv.slice(2);
const server = spawn(process.execPath, [new URL('serve.mjs', import.meta.url).pathname], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    ...CONTEXT_OPTIONS,
    storageState: new URL(`../tests/fixtures/${dataset}.json`, import.meta.url).pathname,
  });
  await prepareContext(context, TEST_SEED);
  await context.addInitScript(messageRecorderInitScript);
  const page = await context.newPage();
  const app = legacyApp(page);
  await app.loginAsOwner();
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction('page', 'app', actions)(page, app);
  await app.settle();
  mkdirSync('test-results/explore', { recursive: true });
  await page.screenshot({ path: `test-results/explore/${name}.png` });
  console.log('signature', JSON.stringify(await app.signature()));
  const info = await page.evaluate(() => {
    const vis = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const t = el => el.textContent.replace(/\s+/g, ' ').trim();
    const tops = [...document.querySelectorAll('[id^="m"].on, aside[id^="m"]')].filter(m => /^m[A-Z]/.test(m.id) && vis(m));
    const scope = tops.pop() || document.querySelector('.view.on') || document.body;
    const buttons = [...scope.querySelectorAll('button, a.btn, [onclick]')].filter(vis)
      .map(b => `${t(b).slice(0, 60)}${b.getAttribute('onclick') ? '   {' + b.getAttribute('onclick').slice(0, 70) + '}' : ''}`);
    const inputs = [...scope.querySelectorAll('input, select, textarea')].filter(vis).map(i => {
      const lab = i.id && document.querySelector(`label[for="${i.id}"]`);
      return `${i.tagName.toLowerCase()}[${i.type || ''}] ${lab ? 'label="' + t(lab) + '" ' : ''}${i.placeholder ? 'placeholder="' + i.placeholder + '" ' : ''}value="${String(i.value).slice(0, 30)}"`;
    });
    return { scope: scope.id, buttons: [...new Set(buttons)].slice(0, 120), inputs: inputs.slice(0, 60) };
  });
  console.log(`scope #${info.scope}\n--- buttons\n${info.buttons.join('\n')}\n--- inputs\n${info.inputs.join('\n')}`);
} finally {
  await browser.close();
  server.kill();
}
