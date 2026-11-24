// The central sign-in page (/login): the team's design (docs/design/drivegox-website-2026-11-19/login.html: cards with
// their icons and animations, the garage drawing, Thai and English) with DriveGo's sign-in (the owner's decisions of
// 2026-11-17, docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง").
// One card per package (BaziX, ProX, Franchise): the person picks the one their shop uses and the sign-in form opens in
// that card (one form, moved from card to card, so what is typed stays). It checks the shop code, user and password with
// the server (POST /api/auth/login with check: no session yet). Right, but the shop uses another package: refused, naming
// the card to use (told only once the password is right, so no one learns a shop's package from its code). Right: it opens
// the shop's own page, which signs in with them through its usual sign-in (frontend/js/78-central-login.js): the app's
// rules, messages and session are the ones it always had. They go there in this tab's sessionStorage, read once and
// removed at once. The shop code is kept on this device for next time.
(() => {
  // The design's texts (Thai and English; the owner chose no Chinese), then the form's.
  const T = {
    th: { eb: 'สำหรับสมาชิก', h: 'เข้าสู่ระบบ <em>DriveGo</em>', sub: 'เลือกระบบที่อู่ของคุณสมัครใช้งาน แล้วเข้าสู่หน้าลงชื่อเข้าใช้ของระบบนั้น', go: 'เข้าสู่ระบบ',
      sys: [{ k: 'biz', n: 'BaziX', full: 'DriveGo', tier: 'Professional System', d: 'ระบบบริหารอู่สำหรับคุมทั้งอู่ ตั้งแต่เอกสาร สต๊อก จนถึงต้นทุนงาน', l: ['ใบสั่งซ่อม ใบเสนอราคา และใบเสร็จ', 'คลังอะไหล่และตัดสต๊อกอัตโนมัติ', 'ต้นทุนและกำไรรายบิล'] },
        { k: 'prox', n: 'ProX', full: 'DriveGo', tier: 'Top Performance System', d: 'ระบบครบวงจรพร้อม Ecosystem เชื่อมลูกค้า ซัพพลายเออร์ และแอปผู้ใช้รถ', l: ['ทุกความสามารถของ BaziX', 'แดชบอร์ดวิเคราะห์เชิงลึก', 'คิวจองและประวัติรถจาก DriveGo BOOK'] },
        { k: 'franchise', n: 'Franchise', full: 'DriveGo-', tier: 'หลายสาขาและแฟรนไชส์', d: 'ศูนย์กลางควบคุมทุกสาขา มาตรฐานเอกสารและขั้นตอนเดียวกันทั้งเครือ', l: ['เห็นตัวเลขทั้งเครือจากหน้าจอเดียว', 'เปรียบเทียบผลงานระหว่างสาขา', 'โอนย้ายอะไหล่ระหว่างสาขา'] }],
      mh: 'คู่มือการใช้งานระบบ', mp: 'ดาวน์โหลดคู่มือของระบบที่คุณใช้ เพื่ออ่านขั้นตอนการทำงานทีละหน้าจอ ตั้งแต่เปิดงานจนถึงปิดบิล', ml: 'คู่มือ', pdf: 'PDF',
      td: 'เปิด Test Drive คู่มือภาพออนไลน์ทุกหน้าจอ', help: 'เข้าสู่ระบบไม่ได้หรือยังไม่ได้เป็นสมาชิก โทร',
      code: 'รหัสร้าน', codeEg: 'เช่น 482913', user: 'ชื่อผู้ใช้ / อีเมล / เบอร์โทร', pass: 'รหัสผ่าน', submit: 'เข้าสู่ระบบ',
      hint: ['<b>ไม่ทราบรหัสร้าน</b> ดูจากข้อความที่ทีมงานส่งตอนเปิดร้าน หรือถามเจ้าของร้าน',
        '<b>ลืมรหัสผ่าน</b> พนักงานให้เจ้าของร้านตั้งรหัสใหม่ให้ เจ้าของร้านติดต่อทีมงานทาง <a href="https://lin.ee/VtmOwnO" target="_blank" rel="noopener">LINE</a>'],
      empty: 'กรุณากรอกรหัสร้าน ชื่อผู้ใช้ และรหัสผ่าน', wrong: 'รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง',
      offline: 'เชื่อมต่อ server ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่',
      card: n => `ร้านนี้ใช้แพ็กเกจ ${n} — กรุณาเข้าสู่ระบบที่การ์ด ${n}` },
    en: { eb: 'Members', h: 'Log in to <em>DriveGo</em>', sub: 'Choose the system your garage subscribes to, then continue to that system’s sign-in page.', go: 'Log in',
      sys: [{ k: 'biz', n: 'BaziX', full: 'DriveGo', tier: 'Professional System', d: 'Garage management that keeps the whole shop under control, from documents and stock to job cost.', l: ['Job orders, quotations and receipts', 'Parts warehouse with automatic stock deduction', 'Cost and profit per bill'] },
        { k: 'prox', n: 'ProX', full: 'DriveGo', tier: 'Top Performance System', d: 'The complete system with the Ecosystem that links customers, suppliers and the driver app.', l: ['Everything in BaziX', 'In-depth analytics dashboard', 'Bookings and car history from DriveGo BOOK'] },
        { k: 'franchise', n: 'Franchise', full: 'DriveGo-', tier: 'Multi-branch and franchise', d: 'A control centre for every branch, with one document and process standard across the group.', l: ['Group figures on a single screen', 'Compare performance across branches', 'Transfer parts between branches'] }],
      mh: 'User manuals', mp: 'Download the manual for the system you use and follow the workflow screen by screen, from opening a job to closing the bill.', ml: 'Manual', pdf: 'PDF',
      td: 'Open Test Drive, the online picture guide to every screen', help: 'Cannot log in, or not a member yet? Call',
      code: 'Shop code', codeEg: 'e.g. 482913', user: 'User name / e-mail / phone', pass: 'Password', submit: 'Log in',
      hint: ['<b>Don’t know your shop code?</b> It is in the message the team sent when your shop was opened, or ask the shop owner.',
        '<b>Forgot your password?</b> Staff ask the shop owner to set a new one; shop owners contact the team on <a href="https://lin.ee/VtmOwnO" target="_blank" rel="noopener">LINE</a>.'],
      empty: 'Enter the shop code, user name and password', wrong: 'The shop code, user name or password is not right',
      offline: 'Cannot reach the server. Check the internet connection and try again.',
      card: n => `This shop uses ${n} — please log in on the ${n} card` },
  };
  // The package names in the wrong-card message: the cards' own titles (owner 2026-11-19).
  const NAME = { biz: 'DriveGo BaziX', prox: 'DriveGo ProX', franchise: 'DriveGo-Franchise' };
  const IC = { biz: 'box', prox: 'cloud' };
  // The user manuals (server/site/manual, tools/manual/build.mjs; the owner's decision of 2026-11-19).
  const MANUAL = { biz: 'bazix', prox: 'prox', franchise: 'franchise' };
  // The design's animated branch network for Franchise: head office in the middle, three branches, data flowing.
  const hs = (x, y, r) => `M${x - r} ${y}l${r}-${(r * .9).toFixed(2)} ${r} ${(r * .9).toFixed(2)}v${r}h-${2 * r}z`;
  const NET = `<svg class="net-ic" viewBox="0 0 48 48" aria-hidden="true"><path class="ln" d="M24 17V11"/><path class="ln" d="M18.500 28L10.500 35"/><path class="ln" d="M29.500 28L37.500 35"/><circle class="rg" cx="24" cy="24" r="9"/><path class="nd n0" d="${hs(24, 22.5, 6)}"/><path class="nd n1" d="${hs(24, 6.5, 3.6)}"/><path class="nd n2" d="${hs(7.5, 38, 3.6)}"/><path class="nd n3" d="${hs(40.500, 38, 3.6)}"/></svg>`;
  const ic = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const $ = s => document.querySelector(s);

  const form = $('#signin'), code = $('#code'), user = $('#user'), pass = $('#pass'), error = $('#error'), button = $('#go');
  const cards = $('#cards'), home = form.parentNode;
  let chosen = null;   // the package of the card picked
  try { code.value = localStorage.getItem('dg_shop') || ''; } catch (e) {}
  const t = () => T[DG.lang] || T.th;
  const say = text => { error.textContent = text; error.hidden = !text; };
  const place = () => {
    for (const c of cards.children) {
      const open = c.dataset.package === chosen;
      c.classList.toggle('open', open);
      c.querySelector('.pick').hidden = open;
      if (open) c.querySelector('.pick').before(form);
    }
    form.hidden = !chosen;
  };
  function render() {
    const x = t();
    $('#eb').textContent = x.eb; $('#h1').innerHTML = x.h; $('#sub').textContent = x.sub;
    home.append(form);   // out of the cards while they are drawn again
    cards.innerHTML = x.sys.map((s, i) => `<section class="sys fade" data-package="${s.k}" aria-labelledby="plan-${s.k}">
      <span class="wm" aria-hidden="true"><svg viewBox="0 0 48 48"><use href="#i-wheel"/></svg></span>
      <div class="top"><span class="badge">${s.k === 'franchise' ? NET : ic(IC[s.k])}</span><span class="tier">${s.tier}</span></div>
      <h2 id="plan-${s.k}">${s.full}${s.full.endsWith('-') ? '' : ' '}<b>${s.n}</b></h2><p>${s.d}</p>
      <ul>${s.l.map(l => `<li>${ic('check')}<span>${l}</span></li>`).join('')}</ul>
      <button class="btn btn-a pick" type="button">${x.go} ${s.n} ${ic('arrow')}</button></section>`).join('');
    [...cards.children].forEach((c, i) => c.style.setProperty('--d', `${.1 + i * .1}s`));
    $('#man').style.setProperty('--d', '.4s');
    $('#man').innerHTML = `<div class="tx"><span class="mi">${ic('book')}</span><div><h2>${x.mh}</h2><p>${x.mp}</p></div></div>
      <div class="dls">${x.sys.map(s => `<a class="dl" href="/site/manual/drivego-${MANUAL[s.k]}-manual.pdf" download>${ic('down')}<span>${x.ml} ${s.full}${s.full.endsWith('-') ? '' : ' '}${s.n}</span><small>${x.pdf}</small></a>`).join('')}</div>`;
    $('#lCode').textContent = x.code; code.placeholder = x.codeEg; $('#lUser').textContent = x.user; $('#lPass').textContent = x.pass;
    button.textContent = x.submit;
    $('#hint').innerHTML = x.hint.map(h => `<p>${h}</p>`).join('');
    $('#help').innerHTML = `<a href="/testdrive">${x.td}</a><br>${x.help} <a href="tel:+66821087000">082-108-7000</a> · <a href="mailto:sales@drivegox.com">sales@drivegox.com</a>`;
    say('');
    place();
  }
  cards.addEventListener('click', e => {
    const b = e.target.closest('.pick');
    if (!b) return;
    chosen = b.closest('.sys').dataset.package;
    place();
    say('');
    (code.value ? (user.value ? pass : user) : code).focus();
  });
  // The design's card tilt and light following the pointer (no tilt on the card with the form, which is being typed in).
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  cards.addEventListener('pointermove', e => {
    const c = e.target.closest('.sys'); if (!c) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
    if (!calm && !c.classList.contains('open')) { c.style.setProperty('--ty', ((x - .5) * 7).toFixed(2) + 'deg'); c.style.setProperty('--tx', ((.5 - y) * 6).toFixed(2) + 'deg'); }
  });
  cards.addEventListener('pointerout', e => {
    const c = e.target.closest('.sys');
    if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--tx', '0deg'); c.style.setProperty('--ty', '0deg'); }
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const x = t();
    const c = code.value.trim().toLowerCase(), u = user.value.trim(), p = pass.value;
    if (!c || !u || !p) return say(x.empty);
    if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(c)) return say(x.wrong);
    say('');
    button.disabled = true;
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: c, user: u, pass: p, check: true }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) { say(body.error || x.wrong); return; }
      if (body.package && chosen && body.package !== chosen) { say(x.card(NAME[body.package] || body.package)); return; }
      try { localStorage.setItem('dg_shop', c); } catch (e) {}
      sessionStorage.setItem('dg_signin', JSON.stringify({ code: c, user: u, pass: p, at: Date.now() }));
      location.assign(`/${encodeURIComponent(c)}/?login=account`);
    } catch (e) {
      say(x.offline);
    } finally {
      button.disabled = false;
    }
  });
  DG.onLang(render); DG.start(); DG.garage($('#garage'));
})();
