// The staff web page (docs/STAFF-TOOLS.md "หน้าเว็บของทีมงาน"): signing in (password, then the authenticator app's
// code), every shop with its licence, one shop's actions and log, opening a shop. Everything shown is put in as text
// (textContent), never as HTML: names and notes come from shops and staff.
'use strict';
(() => {
  const $app = document.getElementById('app');
  const $top = document.getElementById('top');
  const $nav = document.getElementById('nav');
  const $who = document.getElementById('who');
  let me = null;

  // ---------- small helpers ----------
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, String(v));
    }
    for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : String(c));
    return e;
  }
  const show = (...nodes) => { $app.replaceChildren(...nodes); const f = $app.querySelector('input:not([type=hidden]), select'); if (f) f.focus(); };
  const msg = (kind, text) => el('div', { class: `msg ${kind}`, role: kind === 'bad' ? 'alert' : 'status', text });
  let fieldNo = 0;
  function field(label, input, help) {
    const id = input.id || (input.id = `f${++fieldNo}`);
    return el('div', { class: 'field' }, el('label', { for: id }, label, help ? el('span', { class: 'help', text: ` ${help}` }) : null), input);
  }
  const input = (name, attrs = {}) => el('input', { name, type: 'text', autocomplete: 'off', ...attrs });
  const select = (name, options, value) => el('select', { name }, options.map(([v, t]) => el('option', { value: v, selected: v === value, text: t })));
  const values = form => Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]).filter(([, v]) => v !== ''));

  const isoDay = d => d.toISOString().slice(0, 10);
  const dayMs = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  const between = (a, b) => Math.round((dayMs(b) - dayMs(a)) / 86400000);
  const addDays = (s, n) => isoDay(new Date(dayMs(s) + n * 86400000));
  // dd/mm/yyyy in the Buddhist year, as the shops' screens write dates.
  const th = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${+s.slice(0, 4) + 543}` : '–';
  const when = t => { const d = new Date(t); return `${th(isoDay(new Date(d.getTime() + 7 * 3600000)))} ${new Date(d.getTime() + 7 * 3600000).toISOString().slice(11, 16)}`; };

  // ---------- the server ----------
  const T = {
    network: 'ติดต่อ server ไม่ได้ ลองใหม่อีกครั้ง',
    expired: 'หมดเวลา กรุณาเข้าสู่ระบบอีกครั้ง',
  };
  async function api(path, data) {
    let res;
    try {
      res = await fetch(`/api/staff/${path}`, data === undefined ? { headers: { accept: 'application/json' } }
        : { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(data) });
    } catch { throw new Error(T.network); }
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) { signInScreen(T.expired); throw Object.assign(new Error(T.expired), { silent: true }); }
    if (!res.ok) throw Object.assign(new Error(thai(body.error || `HTTP ${res.status}`)), { key: body.error });
    return body;
  }

  // The tools' messages (lib/licence-admin.ts, lib/shop-open.ts) in Thai; anything else as it is.
  const THAI = [
    [/^wrong$/, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'],
    [/^locked$/, 'กรอกผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่'],
    [/^short$/, 'รหัสผ่านต้องยาวอย่างน้อย 12 ตัวอักษร'],
    [/^same$/, 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม'],
    [/^stage$/, 'ขั้นตอนนี้ทำไปแล้ว กรุณาโหลดหน้าใหม่'],
    [/^origin$/, 'คำขอนี้ไม่ได้มาจากหน้าเว็บทีมงาน'],
    [/^code is required/, 'ต้องใส่รหัสร้าน'],
    [/^code: 3/, 'รหัสร้านต้องเป็นตัวพิมพ์เล็ก ตัวเลข หรือขีด 3–32 ตัว และห้ามใช้ api, staff หรือรหัสร้านตัวอย่าง'],
    [/^a shop with code \S+ exists already|^exists already/, 'มีร้านที่ใช้รหัสนี้แล้ว'],
    [/^package: /, 'ต้องเลือกแพ็กเกจ'],
    [/^kind: /, 'ต้องเลือกประเภท (ทดลองใช้ หรือ อู่นำร่อง)'],
    [/^name is required/, 'ต้องใส่ชื่อร้าน'],
    [/^owner is required/, 'ต้องใส่ชื่อ-นามสกุลเจ้าของ'],
    [/^user: 2/, 'ชื่อผู้ใช้ต้องเป็นตัวพิมพ์เล็ก ตัวเลข จุด ขีด หรือขีดล่าง 2–40 ตัว'],
    [/not a day/, 'วันที่ไม่ถูกต้อง'],
    [/^years: /, 'จำนวนปีต้องเป็นจำนวนเต็ม 1–10'],
    [/has no licence yet/, 'ร้านนี้ยังไม่มีวันใช้งาน ให้เริ่มนับวันทดลองใช้หรือนำร่องก่อน'],
    [/has no licence$/, 'ร้านนี้ยังไม่มีวันใช้งาน'],
    [/^the new removal day must be after (\S+)/, m => `วันลบใหม่ต้องหลังวันที่ ${th(m[1])}`],
    [/already ends on (\S+)/, m => `ร้านนี้สิ้นสุดวันที่ ${th(m[1])} อยู่แล้ว`],
    [/the last day \S+ is before the first/, 'วันสุดท้ายอยู่ก่อนวันเริ่ม'],
    [/: the licence has not ended/, 'ร้านยังไม่หมดอายุ ยังไม่ต้องโทรแจ้ง'],
    [/: told on (\S+) already/, m => `จดว่าโทรแจ้งแล้วเมื่อ ${th(m[1])}`],
    [/: not due yet: from (\S+)/, m => `ยังไม่ถึงเวลาโทรแจ้ง (เริ่มได้วันที่ ${th(m[1])})`],
    [/data was removed on|data removed on/, 'ข้อมูลของร้านนี้ถูกลบแล้ว'],
    [/: no HQ account|: no account /, 'ไม่พบบัญชีนี้'],
    [/the shop has no owner account/, 'ร้านนี้ยังไม่มีบัญชีเจ้าของ'],
    [/^no shop with code/, 'ไม่พบร้านนี้'],
  ];
  function thai(error) {
    for (const [re, out] of THAI) { const m = String(error).match(re); if (m) return typeof out === 'function' ? out(m) : out; }
    return String(error);
  }

  // A form whose button waits for the server and shows what went wrong above the button.
  function submitting(form, run) {
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const button = form.querySelector('button[type=submit]');
      form.querySelector('.msg.bad')?.remove();
      button.disabled = true;
      try { await run(values(form)); } catch (e) {
        if (!e.silent) button.before(msg('bad', e.message));
      } finally { button.disabled = false; }
    });
    return form;
  }

  // ---------- signing in ----------
  function signedOutTop() { $top.hidden = true; me = null; }

  function signInScreen(note) {
    signedOutTop();
    const form = el('form', { class: 'card narrow', autocomplete: 'off' },
      el('h1', { text: 'เข้าสู่ระบบทีมงาน DriveGo' }),
      note ? msg('warn', note) : null,
      field('ชื่อผู้ใช้', input('login', { autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: true })),
      field('รหัสผ่าน', input('password', { type: 'password', autocomplete: 'current-password', required: true })),
      el('button', { type: 'submit', class: 'primary', text: 'เข้าสู่ระบบ' }));
    show(submitting(form, async v => step((await api('sign-in', { login: v.login || '', password: v.password || '' })).next)));
  }

  function step(next) {
    if (next === 'password') return newPasswordScreen();
    if (next === 'app') return appScreen();
    if (next === 'code') return codeScreen();
    return start();
  }

  function newPasswordScreen() {
    const form = el('form', { class: 'card narrow' },
      el('h1', { text: 'ตั้งรหัสผ่านใหม่' }),
      el('p', { text: 'รหัสผ่านที่ใช้อยู่เป็นรหัสชั่วคราว ตั้งรหัสผ่านของคุณเองอย่างน้อย 12 ตัวอักษร (ไม่ต้องมีสัญลักษณ์ แต่ยิ่งยาวยิ่งดี)' }),
      field('รหัสผ่านใหม่', input('password', { type: 'password', autocomplete: 'new-password', minlength: 12, required: true })),
      field('พิมพ์รหัสผ่านใหม่อีกครั้ง', input('again', { type: 'password', autocomplete: 'new-password', required: true })),
      el('button', { type: 'submit', class: 'primary', text: 'บันทึกรหัสผ่าน' }));
    show(submitting(form, async v => {
      if ((v.password || '') !== (v.again || '')) throw new Error('รหัสผ่านสองช่องไม่ตรงกัน');
      step((await api('password', { password: v.password || '' })).next);
    }));
  }

  async function appScreen() {
    const s = await api('app');
    const form = el('form', { class: 'card narrow' },
      el('h1', { text: 'ตั้งค่าแอปยืนยันตัวตน' }),
      el('p', { text: 'ทุกครั้งที่เข้าสู่ระบบ นอกจากรหัสผ่านแล้วต้องใส่รหัส 6 หลักจากแอปในมือถือของคุณด้วย ตั้งค่าครั้งเดียว:' }),
      el('ol', { class: 'steps' },
        el('li', { text: 'ติดตั้งแอป Google Authenticator หรือ Microsoft Authenticator ในมือถือ' }),
        el('li', {}, 'ในแอป กดเพิ่มบัญชี (+) แล้วสแกน QR นี้',
          el('img', { class: 'qr', src: s.qr, alt: 'QR สำหรับแอปยืนยันตัวตน', width: 220, height: 220 }),
          el('span', { class: 'help', text: 'สแกนไม่ได้: เลือกใส่รหัสเอง แล้วพิมพ์รหัสนี้' }),
          el('div', { class: 'mono', 'data-secret': '', text: s.secret.replace(/(.{4})/g, '$1 ').trim() })),
        el('li', { text: 'พิมพ์รหัส 6 หลักที่แอปแสดงสำหรับ DriveGo' })),
      field('รหัส 6 หลัก', input('code', { inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 7, required: true })),
      el('button', { type: 'submit', class: 'primary', text: 'ยืนยัน' }));
    show(submitting(form, async v => { await sendCode(v.code); start(); }));
  }

  async function sendCode(code) {
    try { await api('code', { code: code || '' }); } catch (e) {
      if (e.key === 'wrong') throw new Error('รหัสไม่ถูกต้อง หรือหมดเวลาแล้ว ลองรหัสใหม่ที่แอปแสดง');
      throw e;
    }
  }

  function codeScreen() {
    const form = el('form', { class: 'card narrow' },
      el('h1', { text: 'รหัสยืนยันตัวตน' }),
      el('p', { text: 'เปิดแอปยืนยันตัวตนในมือถือ แล้วพิมพ์รหัส 6 หลักของ DriveGo' }),
      field('รหัส 6 หลัก', input('code', { inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 7, required: true })),
      el('button', { type: 'submit', class: 'primary', text: 'ยืนยัน' }));
    show(submitting(form, async v => { await sendCode(v.code); start(); }));
  }

  // ---------- signed in ----------
  const PAGES = [['#/', 'ร้านทั้งหมด'], ['#/new', 'เปิดร้านใหม่'], ['#/me', 'บัญชีของฉัน']];
  function signedInTop() {
    $top.hidden = false;
    const here = location.hash.startsWith('#/shop/') ? '#/' : (location.hash || '#/');
    $nav.replaceChildren(...PAGES.map(([href, text]) => el('a', { href, text, 'aria-current': href === here ? 'page' : null })));
    $who.replaceChildren(el('span', { text: `${me.name} (${me.login})` }),
      el('button', { type: 'button', text: 'ออกจากระบบ', onclick: async () => {
        await api('sign-out', {}).catch(() => {});
        history.replaceState(null, '', location.pathname);   // the next sign-in starts at the list
        signInScreen();
      } }));
  }

  async function route() {
    if (!me) return;
    signedInTop();
    const h = location.hash || '#/';
    try {
      if (h.startsWith('#/shop/')) return await shopScreen(decodeURIComponent(h.slice(7)));
      if (h === '#/new') return newShopScreen();
      if (h === '#/me') return myAccountScreen();
      return await listScreen();
    } catch (e) {
      if (!e.silent) show(msg('bad', e.message));
    }
  }

  const PKG = { biz: 'Biz', prox: 'ProX', franchise: 'Franchise' };
  const KIND = { trial: 'ทดลองใช้', pilot: 'อู่นำร่อง', paid: 'จ่ายแล้ว' };
  // What a shop needs from staff, or where it stands, as one tag.
  function state(s, today) {
    const l = s.licence;
    if (s.status === 'removed' || l?.removedOn) return ['ลบข้อมูลแล้ว', ''];
    if (s.due === 'notice') return ['ต้องโทรแจ้งร้าน', 'bad'];
    if (s.due === 'delete') return ['จะลบข้อมูลคืนนี้', 'bad'];
    if (s.due === 'purge') return ['จะลบประวัติคืนนี้', 'warn'];
    if (s.status === 'suspended') return ['ระงับ', 'bad'];
    if (!l) return ['ยังไม่มีวันใช้งาน', 'warn'];
    if (today > l.end) return l.noticeSentOn ? [`โทรแจ้งแล้ว ${th(l.noticeSentOn)}`, 'warn'] : ['หมดอายุ (อ่านอย่างเดียว)', 'warn'];
    if (between(today, l.end) <= 30) return ['ใกล้หมดอายุ', 'warn'];
    return ['ใช้งานได้', 'ok'];
  }
  const left = (l, today) => !l ? '–' : today > l.end ? 'หมดแล้ว' : `${between(today, l.end)} วัน`;

  async function listScreen() {
    const { shops, today } = await api('shops');
    const search = input('q', { type: 'search', placeholder: 'ค้นหารหัสร้าน ชื่อร้าน หรือช่องทางติดต่อ', 'aria-label': 'ค้นหา' });
    const filter = select('filter', [['all', 'ทุกร้าน'], ['soon', 'หมดอายุแล้ว หรือภายใน 30 วัน'], ['call', 'ต้องโทรแจ้งร้าน']], 'all');
    filter.setAttribute('aria-label', 'แสดง');
    const body = el('tbody');
    const count = el('p', { class: 'muted' });
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      const rows = shops.filter(s => (!q || [s.code, s.name, s.licence?.contact].some(x => String(x || '').toLowerCase().includes(q)))
        && (filter.value === 'all' || (filter.value === 'call' ? s.due === 'notice' : !s.licence || between(today, s.licence.end) <= 30)));
      body.replaceChildren(...rows.map(s => {
        const [label, kind] = state(s, today);
        const open = () => { location.hash = `#/shop/${encodeURIComponent(s.code)}`; };
        return el('tr', { class: 'link', tabindex: 0, onclick: open, onkeydown: e => { if (e.key === 'Enter') open(); } },
          el('td', { class: 'mono', text: s.code }), el('td', { text: s.name || '–' }), el('td', { text: PKG[s.package] || s.package }),
          el('td', { text: s.licence ? KIND[s.licence.kind] || s.licence.kind : '–' }), el('td', { text: th(s.licence?.end) }),
          el('td', { text: left(s.licence, today) }), el('td', { text: th(s.licence?.deleteOn) }),
          el('td', {}, el('span', { class: `tag ${kind}`, text: label })));
      }));
      count.textContent = `${rows.length} จาก ${shops.length} ร้าน · วันนี้ ${th(today)}`;
    };
    search.addEventListener('input', draw);
    filter.addEventListener('change', draw);
    draw();
    show(el('h1', { text: 'ร้านทั้งหมด' }), el('div', { class: 'toolbar' }, search, filter), count,
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['รหัสร้าน', 'ชื่อร้าน', 'แพ็กเกจ', 'ประเภท', 'วันสุดท้าย', 'เหลือ', 'วันลบข้อมูล', 'สถานะ'].map(t => el('th', { text: t })))),
        body)));
    search.focus();
  }

  // A temporary password, shown once.
  const passwordCard = (rows, extra) => el('div', { class: 'secret', role: 'status' },
    el('dl', {}, rows.map(([k, v]) => [el('dt', { text: k }), el('dd', { class: 'mono', text: v })])),
    el('p', { text: 'บอกเจ้าของร้านทางโทรศัพท์เท่านั้น ไม่ส่งทางแชตหรืออีเมล และไม่จดไว้ หน้านี้จะไม่แสดงรหัสนี้อีก ให้เจ้าของเปลี่ยนรหัสเองหลังเข้าระบบ' }),
    extra || null);

  const ACTION = { new: 'เปิดร้าน', open: 'เริ่มนับวันใหม่', renew: 'ต่ออายุ', postpone: 'เลื่อนวันลบข้อมูล', close: 'ปิดร้าน',
    contact: 'แก้ช่องทางติดต่อ', notice: 'โทรแจ้งแล้ว', password: 'ตั้งรหัสผ่านใหม่', delete: 'ลบข้อมูล', purge: 'ลบประวัติ' };
  function summary(action, d) {
    d = d || {};
    const parts = [];
    if (d.after?.end) parts.push(`ถึง ${th(d.after.end)}`);
    if (action === 'renew') parts.push(`${d.years} ปี จ่ายวันที่ ${th(d.paidOn)}`);
    if (action === 'postpone') parts.push(`วันลบ ${th(d.from)} → ${th(d.to)}`);
    if (action === 'notice') parts.push(`ลบวันที่ ${th(d.removalOn)}`);
    if (action === 'new') parts.push(`${PKG[d.pkg] || d.pkg} ${KIND[d.kind] || d.kind} ${th(d.start)}–${th(d.end)} ผู้ใช้ ${d.user}`);
    if (action === 'password') parts.push(`ผู้ใช้ ${d.user}`);
    if (d.contact && (action === 'contact' || action === 'open')) parts.push(`ติดต่อ: ${d.contact}`);
    if (d.note) parts.push(`หมายเหตุ: ${d.note}`);
    return parts.join(' · ');
  }

  // notice: what the last action said, shown above the buttons of the page drawn again.
  async function shopScreen(code, notice = []) {
    const { shop: s, log, accounts, today } = await api(`shops/${encodeURIComponent(code)}`);
    const l = s.licence;
    const [label, kind] = state(s, today);
    const out = el('div', { 'aria-live': 'polite' }, notice);
    const panel = el('div', { class: 'panel', hidden: true });
    const done = (text, extra) => () => shopScreen(code, [msg('ok', text), extra || null]);

    // One action's form under the buttons; `fill` gives its fields, `run` sends it.
    const forms = {
      password: ['ตั้งรหัสผ่านใหม่ให้เจ้าของร้าน', () => [
        msg('warn', 'ก่อนตั้งรหัสใหม่ โทรกลับไปที่เบอร์ที่ร้านให้ไว้ (ไม่ใช่เบอร์ที่โทรเข้ามา) แล้วถามชื่อ-นามสกุลเจ้าของและเลขผู้เสียภาษีของร้านให้ตรงก่อน'),
        s.package === 'franchise' && accounts.length ? field('บัญชี', select('user', accounts.map(a => [a.user, `${a.user} · ${a.name || a.role}${a.active ? '' : ' (ระงับ)'}`]),
          (accounts.find(a => a.role === 'HQ') || accounts[0]).user)) : null,
        el('label', { class: 'check' }, el('input', { type: 'checkbox', name: 'verified', value: '1', required: true }), 'โทรกลับและยืนยันตัวตนเจ้าของร้านแล้ว'),
      ], async v => {
        const r = await api(`shops/${encodeURIComponent(code)}`, { action: 'password', user: v.user });
        await done('ตั้งรหัสผ่านใหม่แล้ว รหัสเดิมใช้ไม่ได้ทันที', passwordCard([['ชื่อผู้ใช้', r.user], ['รหัสผ่านชั่วคราว', r.password]]))();
      }, 'danger'],
      renew: ['ต่ออายุ (ร้านจ่ายเงินแล้ว)', () => [
        el('p', { class: 'help', text: 'นับต่อจากวันสุดท้ายถ้ายังไม่หมดอายุ ถ้าหมดแล้วนับจากวันที่จ่าย ร้านกลับมาบันทึกได้ทันทีและข้อมูลจะไม่ถูกลบ' }),
        el('div', { class: 'grid2' },
          field('จำนวนปี', input('years', { type: 'number', min: 1, max: 10, value: 1, required: true })),
          field('วันที่จ่ายเงิน', input('paidOn', { type: 'date', value: today, required: true }))),
        field('หมายเหตุ', input('note', { placeholder: 'เช่น เลขที่ใบเสร็จ หรือช่องทางที่จ่าย' })),
      ], async v => { await api(`shops/${encodeURIComponent(code)}`, { action: 'renew', ...v }); await done('ต่ออายุแล้ว')(); }],
      postpone: ['เลื่อนวันลบข้อมูล', () => [
        el('p', { class: 'help', text: `วันลบตอนนี้ ${th(l?.deleteOn)} ใส่วันใหม่ หรือจำนวนวันที่เลื่อนออกไป อย่างใดอย่างหนึ่ง ร้านจะต้องถูกโทรแจ้งใหม่ 30 วันก่อนวันลบใหม่` }),
        el('div', { class: 'grid2' }, field('เลื่อนไปวันที่', input('to', { type: 'date' })), field('หรือเลื่อนออกไป (วัน)', input('days', { type: 'number', min: 1 }))),
        field('หมายเหตุ', input('note')),
      ], async v => { await api(`shops/${encodeURIComponent(code)}`, { action: 'postpone', ...v }); await done('เลื่อนวันลบข้อมูลแล้ว')(); }],
      close: ['ปิดร้าน', () => [
        msg('warn', 'หลังวันสุดท้าย ร้านเข้าระบบ ดู พิมพ์ และส่งออกข้อมูลได้ แต่แก้ไขไม่ได้ และข้อมูลจะถูกลบ 90 วันหลังวันสุดท้าย (ต้องโทรแจ้งก่อน 30 วัน)'),
        field('วันสุดท้ายที่ใช้งาน', input('lastDay', { type: 'date', value: addDays(today, -1), required: true }), 'ค่าตั้งต้นคือเมื่อวาน = แก้ไขไม่ได้ตั้งแต่ตอนนี้'),
        field('หมายเหตุ', input('note', { placeholder: 'เช่น ร้านขอยกเลิก' })),
      ], async v => { await api(`shops/${encodeURIComponent(code)}`, { action: 'close', ...v }); await done('ปิดร้านแล้ว')(); }, 'danger'],
      told: ['จดว่าโทรแจ้งร้านแล้ว', () => [
        el('p', { class: 'help', text: 'จดหลังโทรบอกร้านแล้วว่าข้อมูลจะถูกลบ ข้อมูลจะถูกลบไม่เร็วกว่า 30 วันหลังวันที่จด' }),
        field('หมายเหตุ', input('note', { placeholder: 'คุยกับใคร เบอร์อะไร' })),
      ], async v => {
        const r = await api(`shops/${encodeURIComponent(code)}`, { action: 'told', ...v });
        await done(`จดแล้ว ข้อมูลจะถูกลบวันที่ ${th(r.removalOn)}`)();
      }],
      contact: ['แก้ช่องทางติดต่อ', () => [
        field('ช่องทางติดต่อ', el('textarea', { name: 'contact', text: l?.contact || '' }), 'ใครที่ต้องโทรหาเรื่องต่ออายุและการลบข้อมูล'),
      ], async v => { await api(`shops/${encodeURIComponent(code)}`, { action: 'contact', contact: v.contact || '' }); await done('บันทึกช่องทางติดต่อแล้ว')(); }],
      open: ['เริ่มนับวันทดลองใช้ / นำร่องใหม่', () => [
        msg('warn', 'แทนวันเริ่มและวันสุดท้ายเดิมของร้านทั้งหมด ใช้กับร้านที่ยังไม่มีวันใช้งาน หรือเปลี่ยนจากทดลองใช้เป็นอู่นำร่อง'),
        el('div', { class: 'grid2' },
          field('ประเภท', select('kind', [['trial', 'ทดลองใช้ 60 วัน'], ['pilot', 'อู่นำร่อง 1 ปี']], l?.kind === 'pilot' ? 'pilot' : 'trial')),
          field('เริ่มนับจากวันที่', input('from', { type: 'date', value: today, required: true }))),
      ], async v => { await api(`shops/${encodeURIComponent(code)}`, { action: 'open', ...v }); await done('เริ่มนับวันใหม่แล้ว')(); }],
    };
    const removed = s.status === 'removed' || !!l?.removedOn;
    const buttons = removed ? [] : Object.entries(forms).map(([key, [title, fill, run, style]]) => el('button', {
      type: 'button', text: title, onclick: () => {
        out.replaceChildren();
        const form = el('form', {}, el('h2', { text: title }), fill(),
          el('div', { class: 'actions' }, el('button', { type: 'submit', class: style || 'primary', text: title }),
            el('button', { type: 'button', text: 'ยกเลิก', onclick: () => { panel.hidden = true; } })));
        panel.replaceChildren(submitting(form, run));
        panel.hidden = false;
        form.querySelector('input:not([type=checkbox]), select, textarea')?.focus();
      },
    }));

    show(el('a', { class: 'back', href: '#/', text: '← ร้านทั้งหมด' }),
      el('div', { class: 'card' },
        el('h1', {}, s.name || s.code, ' ', el('span', { class: `tag ${kind}`, text: label })),
        el('dl', { class: 'info' },
          el('dt', { text: 'รหัสร้าน' }), el('dd', { class: 'mono', text: s.code }),
          el('dt', { text: 'แพ็กเกจ' }), el('dd', { text: PKG[s.package] || s.package }),
          el('dt', { text: 'ประเภท' }), el('dd', { text: l ? KIND[l.kind] || l.kind : 'ยังไม่มีวันใช้งาน' }),
          el('dt', { text: 'วันเริ่ม' }), el('dd', { text: th(l?.start) }),
          el('dt', { text: 'วันสุดท้าย' }), el('dd', { text: l ? `${th(l.end)} (${left(l, today)})` : '–' }),
          el('dt', { text: 'วันลบข้อมูล' }), el('dd', { text: th(l?.deleteOn) }),
          el('dt', { text: 'โทรแจ้งเรื่องลบเมื่อ' }), el('dd', { text: th(l?.noticeSentOn) }),
          el('dt', { text: 'ช่องทางติดต่อ' }), el('dd', { text: l?.contact || '–' }),
          el('dt', { text: s.package === 'franchise' ? 'บัญชีของเครือ' : 'ชื่อผู้ใช้ของเจ้าของ' }),
          el('dd', { class: 'mono', text: accounts.map(a => a.user).join(', ') || '–' })),
        buttons.length ? el('div', { class: 'actions shop-actions' }, buttons) : null,
        out, panel),
      el('h2', { text: 'ประวัติ' }),
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['เมื่อ', 'โดย', 'ทำอะไร', 'รายละเอียด'].map(t => el('th', { text: t })))),
        el('tbody', {}, log.length ? log.map(r => el('tr', {}, el('td', { text: when(r.at) }), el('td', { text: r.actor }),
          el('td', { text: ACTION[r.action] || r.action }), el('td', { class: 'wrap', text: summary(r.action, r.detail) })))
          : el('tr', {}, el('td', { colspan: 4, class: 'muted', text: 'ยังไม่มี' }))))));
  }

  function newShopScreen() {
    const out = el('div');
    const form = el('form', { class: 'card' },
      el('h1', { text: 'เปิดร้านใหม่' }),
      el('p', { class: 'help', text: 'ร้านใหม่เป็นร้านว่าง (ไม่มีข้อมูลตัวอย่าง) มีบัญชีเจ้าของร้าน ข้อมูลจดทะเบียนจะไปอยู่ในเมนู 10 ตั้งค่าองค์กรตอนเจ้าของเข้าครั้งแรก' }),
      el('div', { class: 'grid2' },
        field('รหัสร้าน', input('code', { required: true, autocapitalize: 'none', spellcheck: 'false', pattern: '[a-z0-9][a-z0-9\\-]{2,31}', placeholder: 'เช่น daeng-garage' }),
          'ที่อยู่ของร้าน ตัวพิมพ์เล็ก ตัวเลข และขีด เปลี่ยนทีหลังไม่ได้'),
        field('แพ็กเกจ', select('pkg', [['biz', 'Biz'], ['prox', 'ProX'], ['franchise', 'Franchise (เครือ)']], 'biz')),
        field('ประเภท', select('kind', [['trial', 'ทดลองใช้ 60 วัน'], ['pilot', 'อู่นำร่อง 1 ปี']], 'trial')),
        field('เริ่มนับจากวันที่', input('from', { type: 'date' }), 'ไม่ใส่ = วันนี้')),
      el('div', { class: 'grid2' },
        field('ชื่อร้าน / ชื่อเครือ', input('name', { required: true })),
        field('ชื่อ-นามสกุลเจ้าของ', input('owner', { required: true })),
        field('ชื่อผู้ใช้ของเจ้าของ', input('user', { autocapitalize: 'none', spellcheck: 'false' }), 'ไม่ใส่ = รหัสร้านที่ตัดขีดออก (Franchise: hq)'),
        field('เลขประจำตัวผู้เสียภาษี', input('taxId', { inputmode: 'numeric' })),
        field('โทรศัพท์', input('tel', { type: 'tel' })),
        field('อีเมล', input('email', { type: 'email' }))),
      field('ที่อยู่', input('addr')),
      el('div', { class: 'grid2' }, field('รหัสไปรษณีย์', input('zip', { inputmode: 'numeric' })),
        field('ช่องทางติดต่อ', input('contact', { placeholder: 'เช่น คุณแดง 081-234-5678' }), 'เรื่องต่ออายุและการลบข้อมูล')),
      el('button', { type: 'submit', class: 'primary', text: 'เปิดร้าน' }));
    show(out, submitting(form, async v => {
      const r = await api('shops', v);
      form.reset();
      out.replaceChildren(msg('ok', `เปิดร้าน ${r.code} แล้ว ใช้ได้ถึง ${th(r.end)}`),
        passwordCard([['ที่อยู่ร้าน', `/${r.code}/`], ['ชื่อผู้ใช้', r.user], ['รหัสผ่านชั่วคราว', r.password]],
          el('a', { href: `#/shop/${encodeURIComponent(r.code)}`, text: 'ดูร้านนี้ →' })));
      window.scrollTo(0, 0);
    }));
  }

  function myAccountScreen() {
    const out = el('div');
    const form = el('form', { class: 'card narrow' },
      el('h1', { text: 'เปลี่ยนรหัสผ่านของฉัน' }),
      field('รหัสผ่านปัจจุบัน', input('current', { type: 'password', autocomplete: 'current-password', required: true })),
      field('รหัสผ่านใหม่', input('password', { type: 'password', autocomplete: 'new-password', minlength: 12, required: true }), 'อย่างน้อย 12 ตัวอักษร'),
      field('พิมพ์รหัสผ่านใหม่อีกครั้ง', input('again', { type: 'password', autocomplete: 'new-password', required: true })),
      el('button', { type: 'submit', class: 'primary', text: 'บันทึกรหัสผ่าน' }),
      el('p', { class: 'help', text: 'มือถือหายหรือเปลี่ยนเครื่อง: ให้ผู้ดูแลตั้งรหัสชั่วคราวให้ใหม่ แล้วตั้งค่าแอปยืนยันตัวตนอีกครั้ง' }));
    show(out, submitting(form, async v => {
      if ((v.password || '') !== (v.again || '')) throw new Error('รหัสผ่านสองช่องไม่ตรงกัน');
      try { await api('password', { current: v.current || '', password: v.password || '' }); } catch (e) {
        if (e.key === 'wrong') throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
        throw e;
      }
      form.reset();
      out.replaceChildren(msg('ok', 'เปลี่ยนรหัสผ่านแล้ว เครื่องอื่นที่เข้าระบบด้วยบัญชีนี้ถูกออกจากระบบ'));
    }));
  }

  async function start() {
    try {
      const r = await api('me');
      if (r.signedIn) { me = r; return route(); }
      if (r.next) return step(r.next);
      signInScreen();
    } catch (e) { if (!e.silent) show(msg('bad', e.message)); }
  }
  window.addEventListener('hashchange', route);
  start();
})();
