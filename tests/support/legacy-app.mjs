// How the tests drive the legacy HTML. A future target (the new system) gets
// its own file with the same functions, so the scenarios stay unchanged.
import { LEGACY_URL, OWNERS } from './config.mjs';
import { restoreDataset, waitForLegacyBoot, waitForStableState, readState } from './browser.mjs';

// Records every message the user sees: the centred toast (#toast) and the
// "saved" card (#saveFx). Messages the app mutes on purpose never reach #toast.
export function messageRecorderInitScript() {
  window.__seenMessages = [];
  const push = text => { text = (text || '').replace(/\s+/g, ' ').trim(); if (text) window.__seenMessages.push(text); };
  new MutationObserver(records => {
    for (const r of records) {
      const el = r.type === 'attributes' ? r.target : r.target.nodeType === 1 ? r.target : r.target.parentElement;
      if (!el) continue;
      if (el.id === 'toast' && r.type === 'childList') push(el.textContent);
      // The sign-in form shows its errors in place, not as a toast.
      if (el.id === 'studio-result' && r.type === 'childList' && !el.hidden) push(el.textContent);
      if (el.id === 'saveFx' && r.type === 'attributes' && el.classList.contains('on') && !(r.oldValue || '').split(' ').includes('on')) {
        const t1 = el.querySelector('#saveFxT1'), t2 = el.querySelector('#saveFxT2');
        push('✓ ' + [t1 && t1.textContent, t2 && t2.textContent].filter(Boolean).join(' · '));
      }
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
}

// dataset: starting data (tests/fixtures/<dataset>.json) put into the browser
// before the first open(). Its first word is the package (biz, prox,
// franchise): the app is opened with ?package=<it> (biz is the default and is
// left out, as the goldens were recorded that way) and loginAsOwner() uses
// that package's owner account.
export function legacyApp(page, { dataset = 'biz-trial' } = {}) {
  const plan = dataset.split('-')[0];
  let restored = false;
  return {
    async open(params = '') {
      if (!restored) { await restoreDataset(page, dataset); restored = true; }
      const pkg = plan === 'biz' ? '' : `package=${plan}&`;
      await page.goto(`${LEGACY_URL}?${pkg}login=account${params ? '&' + params : ''}`);
      await waitForLegacyBoot(page);
    },

    async loginAsOwner() {
      await this.open();
      await this.login(OWNERS[plan].user, OWNERS[plan].pass);
    },

    async login(user, pass) {
      const studio = page.locator('#drivego-studio');
      // The user box reads "ชื่อผู้ใช้ อีเมล หรือเบอร์โทร" (Biz, ProX) or "ชื่อผู้ใช้ของคุณ" (Franchise).
      await studio.getByPlaceholder(/ชื่อผู้ใช้/).fill(user);
      await studio.getByPlaceholder('กรอกรหัสผ่าน').fill(pass);
      await studio.locator('[type="submit"]:visible').click();
      await page.waitForFunction(() => document.documentElement.classList.contains('pkg-open'));
      await this.settle();
    },

    // Signs out through the account menu and its confirmation, back to the
    // sign-in screen.
    async logout() {
      await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
      await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).filter({ visible: true }).click();
      await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
      await this.settle();
    },

    // A sign-in that must fail: returns the error the form shows.
    async loginRefused(user, pass) {
      const studio = page.locator('#drivego-studio');
      await studio.getByPlaceholder(/ชื่อผู้ใช้/).fill(user);
      await studio.getByPlaceholder('กรอกรหัสผ่าน').fill(pass);
      await studio.locator('[type="submit"]:visible').click();
      const result = page.locator('#studio-result');
      await result.waitFor({ state: 'visible' });
      await this.settle();
      if (await page.evaluate(() => document.documentElement.classList.contains('pkg-open')))
        throw new Error(`sign-in as ${user} was expected to fail but succeeded`);
      return (await result.textContent()).trim();
    },

    // Waits until table column widths and page height stop changing: some
    // registers size their columns a moment after drawing.
    async layoutStable() {
      let last = '', since = Date.now();
      for (const start = Date.now(); Date.now() - start < 8000;) {
        const now = await page.evaluate(() => [...document.querySelectorAll('th')]
          .filter(th => th.offsetWidth).map(th => th.offsetWidth).join(',') + '|' + document.documentElement.scrollHeight);
        if (now !== last) { last = now; since = Date.now(); }
        else if (Date.now() - since >= 600) return;
        await page.waitForTimeout(150);
      }
    },

    // Lets deferred renders and saves finish before the next step.
    settle() {
      return waitForStableState(page, { quietMs: 800 });
    },

    state() {
      return readState(page);
    },

    // What the user is looking at: the open menu page, any open pop-ups, and
    // the messages that appeared since the previous call.
    async signature() {
      return page.evaluate(() => {
        // Text of an element with a space between separate pieces of text,
        // so "<b>รับชำระ</b><span>MA-SA…</span>" reads "รับชำระ MA-SA…".
        const text = el => {
          if (!el) return '';
          const parts = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          while (walk.nextNode()) parts.push(walk.currentNode.data);
          return parts.join(' ').replace(/\s+/g, ' ').trim();
        };
        const visible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
        // Menu page: the open top-level menu and its open sub-menu item. On the
        // sign-in screen the menu stays in the DOM behind it, so say so instead.
        const signedIn = document.documentElement.classList.contains('pkg-open');
        const nav = signedIn
          ? [...new Set([...document.querySelectorAll('.navparent.on, .navchildren button.on, [id$="Tabs"] button.on')].filter(visible))].map(text)
          : ['(หน้าเข้าสู่ระบบ)'];
        // Pop-ups have ids starting with "m" (mAsk, mSale…) and get class "on"
        // when open; side panels such as the payment panel (aside#mSalePay)
        // are shown without it; cards such as "ตรวจก่อนบันทึก" have role=dialog.
        const title = m => {
          // Franchise inspect bar: no heading, its own text says which branch.
          if (m.id === 'frInspectBar') { const c = m.cloneNode(true); c.querySelectorAll('button').forEach(b => b.remove()); return text(c).slice(0, 100); }
          const h = m.querySelector('#askTitle, header h2, h2, h3') || m.querySelector('header, [class*="-head"]');
          if (!h) return m.getAttribute('aria-label') || m.id;
          const c = h.cloneNode(true);
          c.querySelectorAll('button').forEach(b => b.remove());
          return text(c) || m.getAttribute('aria-label') || m.id;
        };
        // Franchise request details (#frDet) and inspect bar (#frInspectBar)
        // are shown with style="display:flex" instead.
        const modals = [...new Set([...document.querySelectorAll('[id^="m"].on, aside[id^="m"], [role="dialog"], #frDet, #frInspectBar')]
          .filter(m => (m.getAttribute('role') === 'dialog' || /^m[A-Z]/.test(m.id) || /^fr(Det|InspectBar)$/.test(m.id)) && visible(m)))].map(title);
        // A message shown several times in a row reads as one to the user.
        const messages = window.__seenMessages.splice(0).filter((m, i, a) => m !== a[i - 1]);
        return { page: nav, popups: modals, messages };
      });
    },

    // Hidden in screenshots because they come and go on a timer; their text
    // is checked by the flow referee instead.
    screenshotStyle: '#toast, #saveFx, #pkg-loading { visibility: hidden !important; }',
  };
}
