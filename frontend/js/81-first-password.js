/* DriveGo (เจ้าของโปรเจกต์ 2026-11-20, docs/NOTES.md "บังคับตั้งรหัสผ่านใหม่"): a password DriveGo's team issued (a shop opened,
   a website sign-up approved, a forgotten password) must be replaced by the person at the first sign-in. The server says so
   when signing in (mustChange); once the shop is open this window asks for a new password and cannot be closed: it saves
   the password as the app's own "เปลี่ยนรหัสผ่าน" does (owner: DGB.shop.pass, Franchise: the account's pass), which
   clears the mark on the server, or signs out. */
(() => {
  const st = window.storage;
  if (!st || typeof st.signIn !== 'function') return;
  const signIn = st.signIn.bind(st);
  let temporary = '';
  st.signIn = async (user, pass) => {
    const r = await signIn(user, pass);
    if (r && r.ok && r.mustChange) { temporary = String(pass); waitForShop(); }
    return r;
  };

  // The person's own account once the shop's page is open: the owner (Biz, ProX) or the Franchise account.
  const account = () => {
    try {
      if (typeof frAcc === 'function' && frAcc()) return { kind: 'fr', acc: frAcc() };
      if (typeof DGB !== 'undefined' && DGB && DGB.session && DGB.session.who === 'owner') return { kind: 'owner' };
    } catch (e) {}
    return null;
  };
  function waitForShop(tries = 0) {
    if (account()) return ask();
    if (tries < 150) setTimeout(() => waitForShop(tries + 1), 200);
  }

  function ask() {
    if (document.getElementById('dgFirstPass')) return;
    const box = document.createElement('div');
    box.id = 'dgFirstPass';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'dgFirstPassH');
    Object.assign(box.style, { position: 'fixed', inset: '0', zIndex: '2147483000', background: 'rgba(15,23,42,.72)', display: 'grid', placeItems: 'center', padding: '16px' });
    box.innerHTML = '<form novalidate style="background:#fff;color:#1f2933;border-radius:14px;padding:24px;width:min(420px,100%);box-shadow:0 20px 60px rgba(0,0,0,.35);font:inherit">'
      + '<h2 id="dgFirstPassH" style="margin:0 0 8px;font-size:20px">ตั้งรหัสผ่านใหม่ก่อนใช้งาน</h2>'
      + '<p style="margin:0 0 16px;line-height:1.6;color:#52606d">คุณเข้าระบบด้วยรหัสผ่านชั่วคราวจากทีมงาน DriveGo กรุณาตั้งรหัสผ่านของคุณเองก่อนเริ่มใช้งาน</p>'
      + '<label for="dgFirstPass1" style="display:block;font-weight:600;margin:0 0 4px">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</label>'
      + '<input id="dgFirstPass1" type="password" autocomplete="new-password" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cbd2d9;border-radius:8px;font:inherit;margin:0 0 12px">'
      + '<label for="dgFirstPass2" style="display:block;font-weight:600;margin:0 0 4px">พิมพ์รหัสผ่านใหม่อีกครั้ง</label>'
      + '<input id="dgFirstPass2" type="password" autocomplete="new-password" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cbd2d9;border-radius:8px;font:inherit;margin:0 0 12px">'
      + '<p id="dgFirstPassErr" role="alert" style="margin:0 0 12px;color:#c81e1e;min-height:1.4em"></p>'
      + '<button type="submit" style="width:100%;padding:11px;border:0;border-radius:8px;background:#1f5fbf;color:#fff;font:inherit;font-weight:700;cursor:pointer">บันทึกรหัสผ่านใหม่</button>'
      + '<button type="button" id="dgFirstPassOut" style="display:block;margin:12px auto 0;border:0;background:none;color:#52606d;text-decoration:underline;font:inherit;cursor:pointer">ออกจากระบบ</button>'
      + '</form>';
    document.body.appendChild(box);
    const form = box.querySelector('form'), p1 = box.querySelector('#dgFirstPass1'), p2 = box.querySelector('#dgFirstPass2'), err = box.querySelector('#dgFirstPassErr');
    const keep = e => { if (!box.contains(e.target)) { e.stopPropagation(); p1.focus(); } };
    document.addEventListener('focusin', keep, true);
    const close = () => { document.removeEventListener('focusin', keep, true); box.remove(); temporary = ''; };
    p1.focus();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const np = p1.value;
      if (np.length < 8) { err.textContent = 'รหัสผ่านสั้นเกินไป — อย่างน้อย 8 ตัวอักษร'; return p1.focus(); }
      if (np !== p2.value) { err.textContent = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน'; return p2.focus(); }
      if (np === temporary) { err.textContent = 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านชั่วคราว'; return p1.focus(); }
      const a = account();
      if (!a) return;
      form.querySelector('[type=submit]').disabled = true;
      try {
        if (a.kind === 'fr') { a.acc.pass = np; await frSave(); } else { DGB.shop.pass = np; await dgbSave(); }
        await st.idle();
        close();
        if (typeof toast === 'function') toast('เปลี่ยนรหัสผ่านเรียบร้อย — ใช้รหัสใหม่ในการเข้าระบบครั้งถัดไป');
      } catch (x) {
        err.textContent = 'บันทึกไม่สำเร็จ กรุณาลองใหม่';
        form.querySelector('[type=submit]').disabled = false;
      }
    });
    box.querySelector('#dgFirstPassOut').addEventListener('click', async () => {
      close();
      const a = account();
      if (a && a.kind === 'fr' && typeof frLogout === 'function') await frLogout();
      else if (typeof dgbLogout === 'function') await dgbLogout();
    });
  }
})();
