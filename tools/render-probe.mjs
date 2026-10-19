// CI diagnosis (task T11): which fonts the browser really uses to draw the
// legacy sign-in screen, so a screenshot difference between machines can be
// traced to a font. Prints the web fonts' load status and, for a few points
// of the screen, the element there, its text and the platform fonts drawing it.
//
//   node tools/render-probe.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { CONTEXT_OPTIONS, FIXED_NOW, TEST_SEED } from '../tests/support/config.mjs';
import { prepareContext } from '../tests/support/browser.mjs';
import { legacyApp } from '../tests/support/legacy-app.mjs';

const server = spawn(process.execPath, [new URL('serve.mjs', import.meta.url).pathname], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  console.log('browser', browser.version());
  const context = await browser.newContext(CONTEXT_OPTIONS);
  await prepareContext(context, { seed: TEST_SEED, now: FIXED_NOW });
  const page = await context.newPage();
  page.on('requestfailed', r => console.log('request failed', r.url().slice(0, 120), r.failure()?.errorText));
  const app = legacyApp(page, { dataset: 'biz-trial' });
  await app.open();
  await app.settle();
  console.log('web fonts', await page.evaluate(() => [...document.fonts].map(f => `${f.family} ${f.weight} ${f.status}`).join('; ')));
  const cdp = await context.newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  for (const [x, y] of [[640, 100], [640, 400], [800, 726], [400, 726]]) {
    const { nodeId, backendNodeId } = await cdp.send('DOM.getNodeForLocation', { x, y, includeUserAgentShadowDOM: false }).catch(() => ({}));
    if (!backendNodeId) { console.log(x, y, 'nothing'); continue; }
    const { nodeIds } = await cdp.send('DOM.pushNodesByBackendIdsToFrontend', { backendNodeIds: [backendNodeId] }).catch(async () => { await cdp.send('DOM.getDocument', { depth: -1 }); return cdp.send('DOM.pushNodesByBackendIdsToFrontend', { backendNodeIds: [backendNodeId] }); });
    const id = nodeIds[0] || nodeId;
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: id });
    const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId: id });
    console.log(`${x},${y}`, outerHTML.replace(/\s+/g, ' ').slice(0, 140), '→', fonts.map(f => `${f.familyName}${f.postScriptName ? ' (' + f.postScriptName + ')' : ''} ${f.isCustomFont ? 'web' : 'system'} ×${f.glyphCount}`).join(', '));
  }
} finally {
  await browser.close();
  server.kill();
}
