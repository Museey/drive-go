/* One close ✕ for every window (user 2026-10-11: "แก้เป็น X ให้เหมือนกันทั้งระบบ … ไม่ต้องใส่ในส่วน popup เล็ก").
   · a window that already had a close control in its title row (✕ / "ปิด" / "✕ ปิด", classes mclose · pkg-x-close · pkg-mx)
     keeps that button and what it does — it only gets the shared look (.pkg-xbtn)
   · a window without one gets a new ✕ at the top-right corner; pressing it presses the window's own "ยกเลิก / ปิด"
     button (so any check that button does still runs), or closeModal(id) when there is none
   · not added to the small pop-ups: the yes / no question (mAsk) and "บันทึกข้อมูลสำเร็จ" (mSaleDone); the two retired
     windows (mCatMgr, mTaxNew) are left alone. Footer "ยกเลิก / ปิด" buttons and the side rail stay as they are. */
(()=>{
 const SKIP=new Set(['mAsk','mSaleDone','mCatMgr','mTaxNew']);
 const txt=b=>b.textContent.replace(/\s+/g,' ').trim();
 /* .mclose is the original's phone-only close (fixed at the screen corner under 720px) — left exactly as it is */
 const isClose=b=>!b.classList.contains('mclose')&&(b.classList.contains('pkg-x-close')||b.classList.contains('pkg-mx')||b.classList.contains('pkg-xbtn')||/^(✕|×|ปิด|✕ ปิด|× ปิด)$/.test(txt(b)));
 const mark=b=>{if(b.classList.contains('pkg-xbtn'))return;b.textContent='✕';b.title='ปิด';b.setAttribute('aria-label','ปิด');b.classList.add('pkg-xbtn');};
 const own=b=>!b.closest('.pkg-side-tools,.pkg-rail,.pkg-foot-save,.pkg-print-box');
 /* the window's own dismiss button, looked up when ✕ is pressed (forms are redrawn) */
 const dismiss=(m,id)=>{const all=[...m.querySelectorAll('button')].filter(b=>own(b)&&!b.classList.contains('pkg-xbtn')&&!b.disabled);
  const re=new RegExp("closeModal\\('"+id+"'\\)|getElementById\\('"+id+"'\\)\\.classList\\.remove\\('on'\\)");
  return all.find(b=>/^(ยกเลิก|ปิด|ปิดหน้าต่าง)$/.test(txt(b))&&re.test(b.getAttribute('onclick')||''))
   ||all.find(b=>re.test(b.getAttribute('onclick')||''))
   ||all.find(b=>b.closest('footer')&&/^(ยกเลิก|ปิด|ปิดหน้าต่าง)$/.test(txt(b)));};
 function fit(m){const id=m.id;if(!id||SKIP.has(id))return;
  /* every title row of the window (a window can hold more than one panel, e.g. the kit list and the kit editor) */
  const heads=[...m.querySelectorAll('.sheet>header,.sheet>.panel>header')];if(!heads.length)return;
  let has=false;
  heads.forEach(h=>{[...h.querySelectorAll('button')].filter(isClose).forEach(b=>{mark(b);has=true;});});
  if(has||m.querySelector('header .pkg-xbtn'))return;
  const b=document.createElement('button');b.type='button';b.className='pkg-xbtn pkg-xabs';b.textContent='✕';b.title='ปิด';b.setAttribute('aria-label','ปิด');
  b.addEventListener('click',()=>{const d=dismiss(m,id);if(d)d.click();else if(typeof closeModal==='function')closeModal(id);else m.classList.remove('on');});
  heads[0].append(b);}
 const run=()=>document.querySelectorAll('.modal').forEach(fit);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
 [0,600,2000].forEach(t=>setTimeout(run,t));
 /* windows built later (settings from the gear icons, the slip viewer …) */
 const host=document.getElementById('pkg-app')||document.body;
 new MutationObserver(list=>{if(list.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.classList.contains('modal')||n.querySelector?.('.modal')))))setTimeout(run,0);}).observe(host,{childList:true,subtree:false});
 if(host!==document.body)new MutationObserver(()=>setTimeout(run,0)).observe(document.body,{childList:true});
 window.PKG_CLOSE_X={run};
})();
