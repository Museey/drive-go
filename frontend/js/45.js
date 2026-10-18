/* ข้อมูลพนักงาน & สิทธิการใช้งาน moves from 10 ตั้งค่าองค์กร (ส่วนที่ 2) to 09 งานบุคคล as its first sub-menu
   (user 2026-10-11). The block itself (#empBlock: page head, filters, register, every button) is moved as it is — only
   where it sits changes. Who sees it is unchanged: the right "ข้อมูลพนักงาน" (doc.emp), now together with menu 09. */
(()=>{
 const blk=document.getElementById('empBlock'),tabs=document.getElementById('hrTabs'),view=document.getElementById('v-hr');
 if(!blk||!tabs||!view||typeof hrGo!=='function'||tabs.querySelector('[data-h="emp"]'))return;
 const may=()=>{try{return can('doc.emp');}catch(e){return false;}};
 /* sub-menu button, first in the list */
 const b=document.createElement('button');b.dataset.h='emp';b.textContent='ข้อมูลพนักงาน';tabs.prepend(b);
 [...tabs.children].forEach((x,i)=>x.style.setProperty('--pkg-stagger',(i*22)+'ms'));
 /* its page inside 09 */
 const pane=document.createElement('div');pane.className='hpane';pane.id='h-emp';pane.style.display='none';
 const first=view.querySelector('.hpane');first.before(pane);pane.append(blk);
 const month=document.getElementById('hrMonth')&&document.getElementById('hrMonth').closest('.row');
 const o=hrGo;
 hrGo=window.hrGo=function(v){if(v==='emp'&&!may())v='sum';const r=o.call(this,v);
  if(month)month.style.display=v==='emp'?'none':'';
  if(v==='emp'&&typeof renderEmp==='function')renderEmp();return r;};
 /* rights: the button follows doc.emp; clicking menu 09 opens its first sub-menu — this page (NAV_FIRST_SUB is the
    original's own "first sub-menu" table) */
 try{NAV_FIRST_SUB.hr=()=>hrGo(may()?'emp':'sum');}catch(e){}
 const sync=()=>{const ok=may();b.style.display=ok?'':'none';
  if(!ok&&typeof hrPane!=='undefined'&&hrPane==='emp')try{hrGo('sum');}catch(e){}};
 if(typeof applyPerms==='function'){const ap=applyPerms;applyPerms=window.applyPerms=function(){const r=ap.apply(this,arguments);try{sync();}catch(e){}return r;};}
 try{sync();}catch(e){}
 window.PKG_EMP_IN_HR={sync};
})();
