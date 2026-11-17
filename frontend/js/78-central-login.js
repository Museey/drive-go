/* Central sign-in page (/login, the owner's decision of 2026-11-17, docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง"): it checked
   the shop code, user and password with the server, then opened this shop's page with them in this tab's sessionStorage
   (dg_signin). They are taken out at once, and typed into this page's own sign-in form and sent as a person would, so
   the app's sign-in, rules, messages and session are the ones it always had. Another shop's, or older than a minute:
   dropped. Nothing happens without them (a shop's own address works as before). */
(()=>{
 let v=null;try{v=JSON.parse(sessionStorage.getItem('dg_signin')||'null');sessionStorage.removeItem('dg_signin');}catch(e){}
 if(!v||typeof v!=='object'||!(Date.now()-Number(v.at)<60000))return;
 const shop=decodeURIComponent(location.pathname.split('/')[1]||'').toLowerCase();
 if(String(v.code||'').toLowerCase()!==shop)return;
 const shown=el=>!!(el&&(el.offsetWidth||el.offsetHeight||el.getClientRects().length));
 const type=(el,val)=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,val);
  el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 let tries=0;
 const go=()=>{
  const st=document.getElementById('drivego-studio');
  const u=st&&[...st.querySelectorAll('input')].find(i=>shown(i)&&/ชื่อผู้ใช้/.test(i.placeholder||''));
  const p=st&&[...st.querySelectorAll('input[type="password"]')].find(shown);
  const b=st&&[...st.querySelectorAll('[type="submit"]')].find(x=>shown(x)&&!x.disabled);
  if(u&&p&&b){type(u,String(v.user||''));type(p,String(v.pass||''));v=null;b.click();return;}
  if(++tries<100)setTimeout(go,200);
 };
 setTimeout(go,0);
})();
