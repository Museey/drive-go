/* Loading spinner in the middle of the screen while the program waits for data (user 2026-10-09: "ในกรณีที่จะนำเว็บไปใช้
   จริง อยากให้โชว์กลางจอหมุนๆ"). Today the data is local and answers at once, so it only shows when something really takes
   time: it waits 300 ms before appearing (no flicker on fast work) and counts nested waits.
   · start-up: until the sign-in form is ready (or the app is open)
   · every save() that is still running after 300 ms ("กำลังบันทึกข้อมูล…")
   · every fetch() — the future server calls — ("กำลังโหลดข้อมูล…")
   Other code can use window.pkgLoading.show(text) / hide() / wrap(promise, text). */
(()=>{
 const el=document.createElement('div');el.id='pkg-loading';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 /* แบบ 19 (user 2026-10-09, mockups/loading-options-2.html): three receipts, the top one slides off and goes to the back */
 const RC='<span class="pkg-ld-rc"><span class="pkg-ld-pp"><i class="h"></i><i></i><i class="s"></i><i></i><i class="s"></i><i class="t"></i></span></span>';
 el.innerHTML='<div class="pkg-ld-box"><span class="pkg-ld-stk" aria-hidden="true">'+RC+RC+RC+'</span><b class="pkg-ld-t">กำลังโหลดข้อมูล…</b><span class="pkg-ld-s">กรุณารอสักครู่</span></div>';
 document.body.append(el);
 let count=0,timer=0;
 function show(text){count++;el.querySelector('.pkg-ld-t').textContent=text||'กำลังโหลดข้อมูล…';
  if(el.hidden&&!timer)timer=setTimeout(()=>{timer=0;if(count>0)el.hidden=false;},300);}
 function hide(){count=Math.max(0,count-1);if(!count){clearTimeout(timer);timer=0;el.hidden=true;}}
 async function wrap(p,text){show(text);try{return await p;}finally{hide();}}
 /* saves */
 if(typeof save==='function'){const o=save;save=function(){const r=o.apply(this,arguments);if(r&&typeof r.then==='function'){show('กำลังบันทึกข้อมูล…');r.then(hide,hide);}return r;};}
 /* server calls (when the program runs on a server) */
 if(typeof window.fetch==='function'){const of=window.fetch;window.fetch=function(){show('กำลังโหลดข้อมูล…');let p;try{p=of.apply(this,arguments);}catch(e){hide();throw e;}p.then(hide,hide);return p;};}
 /* start-up: until the sign-in form can be used or the app is open */
 const up=()=>document.documentElement.classList.contains('pkg-open')||!!document.querySelector('#drivego-studio [type="submit"]:not([disabled])');
 if(!up()){show('กำลังเปิดโปรแกรม…');let tries=0;const t=setInterval(()=>{if(up()||++tries>200){clearInterval(t);hide();}},100);}
 window.pkgLoading={show,hide,wrap,demo:(ms=2500,text)=>{count++;el.querySelector('.pkg-ld-t').textContent=text||'กำลังโหลดข้อมูล…';el.hidden=false;setTimeout(hide,ms);}};
})();

/* Every short message (toast — about 700 places) as one centred pop-up (user 2026-10-09: no more top / bottom): it stays
   2 seconds (a long message 3.5 s), then fades out; it never blocks a click. When the "saved" tick is on screen the
   message sits just under it instead of on top of it. */
(()=>{
 const T=document.getElementById('toast');if(!T||typeof toast!=='function')return;
 /* messages that only repeat what the user just pressed (user 2026-10-09: "เปิดใบเสนอราคาใหม่ก็เด้ง popup … ไม่จำเป็น") —
    opening / starting / clearing a document. Messages that tell what to do next, warnings and results still show. */
 const MUTE=[/^เปิด\s+\S+$/,/^เปิด(ใบ\S+|เอกสาร)\s+\S+$/,/^เปิดใบ\S+ใบใหม่$/,/^เริ่มใบ\S*ใหม่/,/^ล้างใบที่เลือกแล้ว/,/^ล้างลูกค้าแล้ว/,/^ล้างข้อมูลแล้ว$/,
  /^เปิดรายงานลูกหนี้ — /,/^เปิดใบเสนอราคา\/อนุมัติซ่อม — /];
 const quiet=m=>{const t=String(m||'').trim();return MUTE.some(r=>r.test(t));};
 const show=function(m){if(quiet(m)){(window.__pkgQuiet=window.__pkgQuiet||[]).push(String(m));return;}T.textContent=m;T.classList.remove('out');T.classList.add('on');clearTimeout(T._t);clearTimeout(T._t2);
  const ms=String(m||'').length>90?3500:2000;T._t=setTimeout(()=>T.classList.add('out'),ms);T._t2=setTimeout(()=>T.classList.remove('on','out'),ms+450);};
 toast=show;window.toast=show;
})();

/* ข้อ 5 (user 2026-10-09, mockups/notice-examples.html): after a "saved" tick card the message that followed it only
   repeated the card. The first message right after saveFx() is now taken by the card: the part that repeats the card
   is dropped, and anything extra (e.g. "สินค้าจะเข้าสต๊อกเมื่อกดปุ่ม อนุมัติ", "ข้าม 3 แถว") shows inside the card as an
   amber line, with the card staying a little longer so it can be read. */
(()=>{
 const el=document.getElementById('saveFx');if(!el||typeof saveFx!=='function'||typeof toast!=='function')return;
 const box=el.querySelector('.box');let N=box&&box.querySelector('.pkg-fx-note');
 if(box&&!N){N=document.createElement('div');N.className='pkg-fx-note';box.appendChild(N);}
 let armed=false;
 const echo=s=>/แล้ว/.test(s)||/^นำเข้า/.test(s);
 const note=(m,sub)=>{const parts=String(m||'').split(/\s+[—·]\s+/).map(x=>x.trim()).filter(Boolean);
  if(parts.length&&echo(parts[0]))parts.shift();
  return parts.filter(p=>!(sub&&sub.includes(p))).join(' · ');};
 const fx=saveFx,ts=toast;
 const wrapped=function(title,sub){if(N)N.textContent='';const r=fx.apply(this,arguments);
  if(el.classList.contains('on')){armed=true;setTimeout(()=>{armed=false;},0);}return r;};
 const wrappedToast=function(m){if(!armed)return ts.apply(this,arguments);armed=false;
  const sub=(document.getElementById('saveFxT2')||{}).textContent||'',x=note(m,sub);
  (window.__pkgFxEcho=window.__pkgFxEcho||[]).push(String(m));
  if(!x||!N)return;N.textContent=x;
  clearTimeout(el._t);clearTimeout(el._t2);
  el._t=setTimeout(()=>el.classList.add('out'),3200);el._t2=setTimeout(()=>el.classList.remove('on','out'),3500);};
 saveFx=wrapped;window.saveFx=wrapped;toast=wrappedToast;window.toast=wrappedToast;
})();

/* Confirm dialog, design C (user 2026-10-09, mockups/dialog-options.html): a coloured header band with an icon tells the
   kind of question at a glance — ส้ม = warning (unsaved, short stock …), แดง = cancel / delete, เขียว = confirm / done.
   The tone comes from o.tone when given, otherwise from the words of the title and the yes-button, so the ≈108 existing
   askP / askConfirm / askPromptP calls change look without being touched. */
(()=>{
 const M=document.getElementById('mAsk');if(!M||typeof askConfirm!=='function')return;
 const head=M.querySelector('header'),yes=document.getElementById('askYes');
 const ic=document.createElement('span');ic.className='pkg-ask-ic';ic.setAttribute('aria-hidden','true');head.prepend(ic);
 const I={warn:'<svg viewBox="0 0 24 24"><path d="M12 3 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/></svg>',
  danger:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></svg>',
  ok:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16.5 9"/></svg>'};
 const toneOf=o=>{if(o.tone)return o.tone;if(o.ok)return 'ok';const t=String(o.title||''),y=String(o.yes||'');
  if(/ติดลบ/.test(y))return 'warn';   /* "ตัดสต๊อกติดลบ" = a warning, not a delete (user 2026-10-09) */
  if(/ลบ|ยกเลิก|ทิ้ง|ปฏิเสธ|ไม่อนุมัติ|ล้างข้อมูล|คืนสต/.test(y)||/^(ลบ|ยกเลิก)|ยกเลิกใบ|ลบ/.test(t))return 'danger';
  if(/^(อนุมัติ|บันทึก|ตกลง|ใช่|ไป|เปิด|ส่ง|รับ|เพิ่ม|สร้าง|ดึง|พิมพ์|ออกใบ)/.test(y.trim()))return 'ok';   /* a plain go-ahead, even after "ยังไม่…" in the title */
  if(/ไม่บันทึก|ข้าม|ทับ|ต่อไป|ยืนยันใช้/.test(y)||/ยังไม่|เตือน|ไม่พอ|เกิน|ซ้ำ|ไม่ตรง|ตรวจสอบ|มีข้อมูล|ระวัง/.test(t))return 'warn';
  return 'ok';};
 const o0=askConfirm;
 askConfirm=function(o){o=o||{};const r=o0.apply(this,arguments);const t=toneOf(o);M.dataset.tone=t;ic.innerHTML=I[t];
  yes.classList.remove('grn','pri','dgr','pkg-ask-warn','pkg-ask-danger','pkg-ask-ok');yes.classList.add('pkg-ask-'+t);return r;};
 window.askConfirm=askConfirm;
})();

