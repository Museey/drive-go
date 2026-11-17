// What a chapter of the user manual uses to take its pictures (tools/manual/build.mjs).
import type { Locator, Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.env.MANUAL_OUT || 'user-manual', 'img');

// A picture of the page (or of one part of it), with purple frames around what the reader presses or looks at, and
// beside a frame the number of its step (the label given with it, or 1, 2, 3 … when there are several and none is
// given). The frames are drawn over the page for the picture only, then taken away.
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
    type R = { x: number; y: number; w: number; h: number };
    const hit = (a: R, b: R) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    // What a number must not cover: text and controls the reader can see (not what is under a dialog's backdrop),
    // the frames, and the numbers already placed.
    const taken: R[] = bs.map(b => ({ x: b.x - 9, y: b.y - 9, w: b.w + 18, h: b.h + 18 }));
    const seen = (el: Element, r: R) => {
      const top = document.elementFromPoint(r.x + r.w / 2, r.y + r.h / 2);
      return !!top && (el.contains(top) || top.contains(el));
    };
    const onScreen = (r: R) => r.w > 0 && r.h > 0 && r.x < innerWidth && r.y < innerHeight && r.x + r.w > 0 && r.y + r.h > 0;
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent!.trim() || !n.parentElement) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const c of range.getClientRects()) {
        const r = { x: c.left, y: c.top, w: c.width, h: c.height };
        if (onScreen(r) && seen(n.parentElement, r)) taken.push(r);
      }
    }
    for (const el of document.querySelectorAll('input, select, textarea, button, img, svg, canvas')) {
      const c = el.getBoundingClientRect(), r = { x: c.left, y: c.top, w: c.width, h: c.height };
      if (onScreen(r) && seen(el, r)) taken.push(r);
    }
    const S = 26;
    for (const b of bs) {
      const d = document.createElement('div');
      d.className = '__manual_mark';
      d.style.cssText = `position:fixed;left:${b.x - 6}px;top:${b.y - 6}px;width:${b.w + 12}px;height:${b.h + 12}px;` +
        'border:3px solid #7c3aed;border-radius:8px;z-index:2147483647;pointer-events:none;box-shadow:0 0 0 3px rgba(124,58,237,.18)';
      document.body.append(d);
      if (!b.label) continue;
      // Beside the frame where nothing is: left, right, above, below; on the frame's corner when all are taken.
      const mid = b.y + b.h / 2 - S / 2;
      const spots: R[] = [
        { x: b.x - 6 - S - 6, y: mid, w: S, h: S }, { x: b.x + b.w + 12, y: mid, w: S, h: S },
        { x: b.x, y: b.y - 9 - S - 2, w: S, h: S }, { x: b.x, y: b.y + b.h + 11, w: S, h: S },
      ];
      const inside = (r: R) => r.x >= 0 && r.y >= 0 && r.x + r.w <= innerWidth && r.y + r.h <= innerHeight;
      const spot = spots.find(r => inside(r) && !taken.some(t => hit(t, r))) || { x: b.x - 6 - S / 2, y: b.y - 6 - S / 2, w: S, h: S };
      taken.push(spot);
      const n = document.createElement('span');
      n.className = '__manual_mark';
      n.textContent = b.label;
      n.style.cssText = `position:fixed;left:${spot.x}px;top:${spot.y}px;min-width:${S}px;height:${S}px;border-radius:${S / 2}px;` +
        `background:#7c3aed;color:#fff;font:700 15px/${S}px sans-serif;text-align:center;padding:0 4px;box-sizing:border-box;` +
        'box-shadow:0 0 0 2px #fff;z-index:2147483647;pointer-events:none';
      document.body.append(n);
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
