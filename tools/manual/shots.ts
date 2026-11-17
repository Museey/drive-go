// What a chapter of the user manual uses to take its pictures (tools/manual/build.mjs).
import type { Locator, Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.env.MANUAL_OUT || 'user-manual', 'img');

// A picture of the page (or of one part of it), with red frames around what the reader presses or looks at, numbered
// when there are several. The frames are drawn over the page for the picture only, then taken away.
// keepToast: show the message at the bottom (hidden otherwise, as it comes and goes on a timer).
export async function shot(page: Page, name: string, opts: { mark?: (Locator | [Locator, string])[]; part?: Locator; pad?: number; keepToast?: boolean; scroll?: boolean; area?: Locator[] } = {}) {
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
      d.style.cssText = `position:fixed;left:${b.x - 6}px;top:${b.y - 6}px;width:${b.w + 12}px;height:${b.h + 12}px;` +
        'border:3px solid #7c3aed;border-radius:8px;z-index:2147483647;pointer-events:none;box-shadow:0 0 0 3px rgba(124,58,237,.18)';
      if (b.label) {
        const n = document.createElement('span');
        n.textContent = b.label;
        // beside the frame, on the left (on the right when the frame is at the window's left edge), so it never covers a label
        const side = b.x > 40 ? 'left:-34px' : 'right:-34px';
        n.style.cssText = `position:absolute;${side};top:calc(50% - 13px);min-width:26px;height:26px;border-radius:13px;background:#7c3aed;` +
          'color:#fff;font:700 15px/26px sans-serif;text-align:center;padding:0 4px;box-shadow:0 0 0 2px #fff';
        d.append(n);
      }
      document.body.append(d);
    }
  }, boxes);
  const file = join(OUT, `${name}.png`);
  const style = opts.keepToast ? '#saveFx, #pkg-loading { visibility: hidden !important; }' : '#toast, #saveFx, #pkg-loading { visibility: hidden !important; }';
  // area: only the part of the window around these elements (what else is on the page stays out of the picture).
  if (opts.area) {
    const bs = (await Promise.all(opts.area.map(l => l.first().boundingBox({ timeout: 5000 }).catch(() => null)))).filter(Boolean) as
      { x: number; y: number; width: number; height: number }[];
    const pad = opts.pad ?? 28, vw = page.viewportSize()!;
    const x0 = Math.max(0, Math.min(...bs.map(b => b.x)) - pad), y0 = Math.max(0, Math.min(...bs.map(b => b.y)) - pad);
    const x1 = Math.min(vw.width, Math.max(...bs.map(b => b.x + b.width)) + pad), y1 = Math.min(vw.height, Math.max(...bs.map(b => b.y + b.height)) + pad);
    await page.screenshot({ path: file, style, clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } });
    await page.evaluate(() => document.querySelectorAll('.__manual_mark').forEach(e => e.remove()));
    return;
  }
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
