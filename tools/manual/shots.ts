// What a chapter of the user manual uses to take its pictures (tools/manual/build.mjs).
import type { Locator, Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.env.MANUAL_OUT || 'user-manual', 'img');

// A picture of the page (or of one part of it), with red frames around what the reader presses or looks at, numbered
// when there are several. The frames are drawn over the page for the picture only, then taken away.
// keepToast: show the message at the bottom (hidden otherwise, as it comes and goes on a timer).
export async function shot(page: Page, name: string, opts: { mark?: (Locator | [Locator, string])[]; part?: Locator; pad?: number; keepToast?: boolean; scroll?: boolean } = {}) {
  mkdirSync(OUT, { recursive: true });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  // The first frame's element in the middle of its window, so the frames are on the picture.
  const first = (opts.mark || [])[0];
  if (first && opts.scroll !== false) {
    const loc = (Array.isArray(first) ? first[0] : first).first();
    await loc.evaluate(e => e.scrollIntoView({ block: 'center', inline: 'nearest' }), undefined, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
  const boxes: { x: number; y: number; w: number; h: number; label: string }[] = [];
  for (const [i, m] of (opts.mark || []).entries()) {
    const [loc, label] = Array.isArray(m) ? m : [m, (opts.mark!.length > 1 ? String(i + 1) : '')];
    const b = await loc.first().boundingBox({ timeout: 5000 }).catch(() => null);
    if (b) boxes.push({ x: b.x, y: b.y, w: b.width, h: b.height, label });
  }
  await page.evaluate((bs) => {
    for (const b of bs) {
      const d = document.createElement('div');
      d.className = '__manual_mark';
      d.style.cssText = `position:fixed;left:${b.x - 4}px;top:${b.y - 4}px;width:${b.w + 8}px;height:${b.h + 8}px;` +
        'border:3px solid #e11d48;border-radius:8px;z-index:2147483647;pointer-events:none;box-shadow:0 0 0 3px rgba(225,29,72,.18)';
      if (b.label) {
        const n = document.createElement('span');
        n.textContent = b.label;
        n.style.cssText = 'position:absolute;left:-14px;top:-14px;min-width:24px;height:24px;border-radius:12px;background:#e11d48;' +
          'color:#fff;font:700 14px/24px sans-serif;text-align:center;padding:0 4px';
        d.append(n);
      }
      document.body.append(d);
    }
  }, boxes);
  const file = join(OUT, `${name}.png`);
  const style = opts.keepToast ? '#saveFx, #pkg-loading { visibility: hidden !important; }' : '#toast, #saveFx, #pkg-loading { visibility: hidden !important; }';
  if (opts.part) {
    const b = await opts.part.first().boundingBox({ timeout: 5000 }).catch(() => null);
    const pad = opts.pad ?? 12, vw = page.viewportSize()!;
    if (b) {
      const x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad);
      await page.screenshot({ path: file, style, clip: { x, y, width: Math.min(vw.width - x, b.width + 2 * pad), height: Math.min(vw.height - y, b.height + 2 * pad) } });
    } else await page.screenshot({ path: file, style });
  } else await page.screenshot({ path: file, style });
  await page.evaluate(() => document.querySelectorAll('.__manual_mark').forEach(e => e.remove()));
}
