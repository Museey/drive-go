// The central sign-in page (/login, the owner's decisions of 2026-11-17, docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง").
// Three cards, one per package (Biz, ProX, Franchise): the person picks the one their shop uses and the sign-in form
// opens in that card (one form, moved from card to card, so what is typed stays). It checks the shop code, user and
// password with the server (POST /api/auth/login with check: no session yet). Right, but the shop uses another package:
// refused, naming the card to use (told only once the password is right, so no one learns a shop's package from its
// code). Right: it opens the shop's own page, which signs in with them through its usual sign-in
// (frontend/js/78-central-login.js): the app's rules, messages and session are the ones it always had. They go there in
// this tab's sessionStorage, read once and removed at once. The shop code is kept on this device for next time.
(() => {
  const form = document.getElementById('signin');
  const code = document.getElementById('code'), user = document.getElementById('user'), pass = document.getElementById('pass');
  const error = document.getElementById('error');
  const button = form.querySelector('button');
  const plans = [...document.querySelectorAll('.plan')];
  const nameOf = pkg => (plans.find(p => p.dataset.package === pkg) || {}).dataset?.name || '';
  let chosen = null;
  try { code.value = localStorage.getItem('dg_shop') || ''; } catch (e) {}
  const say = text => { error.textContent = text; error.hidden = !text; };
  const choose = plan => {
    chosen = plan;
    for (const p of plans) {
      p.classList.toggle('open', p === plan);
      p.querySelector('.pick').hidden = p === plan;
    }
    plan.append(form);
    form.hidden = false;
    say('');
    (code.value ? (user.value ? pass : user) : code).focus();
  };
  for (const p of plans) p.querySelector('.pick').addEventListener('click', () => choose(p));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const c = code.value.trim().toLowerCase(), u = user.value.trim(), p = pass.value;
    if (!c || !u || !p) return say('กรุณากรอกรหัสร้าน ชื่อผู้ใช้ และรหัสผ่าน');
    if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(c)) return say('รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง');
    say('');
    button.disabled = true;
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: c, user: u, pass: p, check: true }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) { say(body.error || 'รหัสร้าน ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง'); return; }
      if (body.package && chosen && body.package !== chosen.dataset.package) {
        const name = nameOf(body.package);
        say(`ร้านนี้ใช้แพ็กเกจ ${name} — กรุณาเข้าสู่ระบบที่การ์ด ${name}`);
        return;
      }
      try { localStorage.setItem('dg_shop', c); } catch (e) {}
      sessionStorage.setItem('dg_signin', JSON.stringify({ code: c, user: u, pass: p, at: Date.now() }));
      location.assign(`/${encodeURIComponent(c)}/?login=account`);
    } catch (e) {
      say('เชื่อมต่อ server ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่');
    } finally {
      button.disabled = false;
    }
  });
})();
