/* DriveGo new system (task 3.15, decision A2 and the owner's answers 15.1–15.9): the shop's licence is DriveGo's,
   kept on the server (server/lib/licence.ts), which also puts its dates into the shop's data (DB.shop.licStart /
   licEnd), so the legacy top bar line, the home banner (30 days before, and after the last day) and menu 10 show
   them as before. After the last day the server refuses every change but viewing (the message is in
   00-server-storage.js); staff renew with tools/shop-admin.mjs.
   · menu 10: the licence dates can be read, not changed, and "ต่ออายุ +1 ปี" / "+2 ปี" are gone (hidden in place,
     so nothing else on the page moves); extendLic does nothing (15.1);
   · every save keeps the server's dates (a wipe, an import, the sample data and a new franchise branch bring
     their own; the server would put its own back anyway), and the screens show them meanwhile;
   · after the last day, printing a saved quotation does not save its form first (the only print that does);
   · the owner panel's tag (05.js) follows the licence: a trial counts to its last day (not 15 days from the
     legacy trialStart), a paid or pilot licence reads "ใช้งานเต็ม ถึง …", one that ran out "หมดอายุทดลองใช้"
     (trial) or "หมดอายุการใช้งานแล้ว"; the demo button "เดโม: จำลองครบ 15 วัน" is gone (A1, 15.1). */
(function(){
 if(typeof renderLicense!=='function'||typeof save!=='function')return;
 const $i=id=>document.getElementById(id);
 let LIC=null;   /* {kind,start,end,today,readOnly} from api/licence while signed in */
 /* not window.fetch: the legacy wrapper (43.js) covers the screen while a request runs */
 function ask(){return new Promise(res=>{try{const x=new XMLHttpRequest();x.open('GET','/api/licence');x.setRequestHeader('cache-control','no-store');
  x.onload=()=>{try{res(x.status===200?JSON.parse(x.responseText):null);}catch(e){res(null);}};x.onerror=()=>res(null);x.send();}catch(e){res(null);}});}
 async function refresh(){
  LIC=await ask();
  if(!LIC||!LIC.end)return;
  pin();
  try{renderLicense();}catch(e){}
  try{const v=$i('v-setting');if(v&&v.offsetParent!==null){fillLic();if(typeof dgbRenderEmpPanel==='function')dgbRenderEmpPanel();}}catch(e){}
 }
 const pin=()=>{if(LIC&&LIC.end&&typeof DB==='object'&&DB&&DB.shop){DB.shop.licStart=LIC.start;DB.shop.licEnd=LIC.end;}};
 const fillLic=()=>{const s=$i('sLicStart'),e=$i('sLicEnd');if(s&&LIC){s.value=LIC.start;e.value=LIC.end;}};

 /* menu 10 */
 ['sLicStart','sLicEnd'].forEach(id=>{const el=$i(id);if(el){el.readOnly=true;el.tabIndex=-1;}});
 document.querySelectorAll('#v-setting button').forEach(b=>{if(/^extendLic\(/.test(b.getAttribute('onclick')||''))b.style.visibility='hidden';});
 window.extendLic=function(){};

 /* the server's dates, whatever the data set in hand says */
 const save0=window.save;window.save=async function(){pin();return save0.apply(this,arguments);};
 const rl0=window.renderLicense;window.renderLicense=function(){pin();return rl0.apply(this,arguments);};
 if(typeof fillSetting==='function'){const f0=window.fillSetting;window.fillSetting=function(){pin();return f0.apply(this,arguments);};}

 /* the owner panel (05.js) */
 if(typeof dgbLicActive==='function'){const a0=window.dgbLicActive;window.dgbLicActive=function(){return LIC&&LIC.end?LIC.kind!=='trial'&&!LIC.readOnly:a0();};}
 if(typeof dgbDaysLeft==='function'){const d0=window.dgbDaysLeft;window.dgbDaysLeft=function(){
  return LIC&&LIC.end?(LIC.readOnly?0:Math.max(1,daysBetween(iso(),LIC.end))):d0();};}
 window.dgbSimExpire=function(){};
 if(typeof dgbRenderEmpPanel==='function'){const p0=window.dgbRenderEmpPanel;window.dgbRenderEmpPanel=function(){const r=p0.apply(this,arguments);
  try{const w=$i('dgbEmpWrap');
   w.querySelectorAll('button').forEach(b=>{if(/^dgbSimExpire\(/.test(b.getAttribute('onclick')||''))b.style.visibility='hidden';});
   const t=w.querySelector('header .tag');
   if(t&&LIC&&LIC.end)t.textContent=LIC.kind==='trial'?(LIC.readOnly?'หมดอายุทดลองใช้':'ทดลองใช้ เหลือ '+dgbDaysLeft()+' วัน')
    :(LIC.readOnly?'หมดอายุการใช้งานแล้ว':'ใช้งานเต็ม ถึง '+thDate(LIC.end));
  }catch(e){}return r;};}

 /* a read-only shop prints a saved quotation without saving the form again first (the legacy print does) */
 if(typeof printQuote==='function'){const q0=window.printQuote;window.printQuote=function(){
  if(!(LIC&&LIC.readOnly)||typeof Q==='undefined'||!Q||!Q.no)return q0.apply(this,arguments);
  if(typeof pkgPermNeed==='function'&&!pkgPermNeed('quote','print'))return;
  logAudit('quote',Q,'print','ต้นฉบับ + สำเนา');save();printDocs(quoteSheets(Q));};}

 /* while signed in: now, and after each sign-in */
 const st=window.storage;
 if(st&&typeof st.signIn==='function'){
  const in0=st.signIn.bind(st);st.signIn=async function(){const r=await in0.apply(this,arguments);if(r&&r.ok)refresh();return r;};
  const out0=st.signOut.bind(st);st.signOut=async function(){LIC=null;return out0.apply(this,arguments);};
 }
 refresh();
 window.PKG_LICENCE={get:()=>LIC,refresh};
})();
