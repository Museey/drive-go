/* ข้อ 6 — small pop-ups, decided one by one (user 2026-10-09, mockups/popup-widths.html):
   widen to the 04 width: mClRecv · mGrFind · mClPull · mPxReq · mPayGR · mImg · mBnPay · mPxView (CSS in popup-fit.css)
   keep the width:        mSaleDone · mPxLearn · mStockRep · mForm · mGrAdj · mPxTopic · mCap · mStockMenu · mAsk · ยังไม่ได้ตัดสต็อก
   + the ones that opened at the top of the screen now open in the middle; inputs written without a type look like every
   other input; vendor payment takes a slip picture; the product picture window has its own upload area and a bigger
   picture; the "บันทึกข้อมูลสำเร็จ" pop-up of 4.4 gets its own drawn tick. */
(()=>{
 const $i=id=>document.getElementById(id);
 const WIDE=['mClRecv','mGrFind','mClPull','mPxReq','mPayGR','mImg','mBnPay','mPxView'];
 const MIDDLE=['mSaleDone','mStockRep','mForm','mCap','mStockMenu','mPayGR','mImg','mCrm','mSaleAdj'];   /* mCrm: centred + narrower (user 2026-10-11) · mSaleAdj: the small "ปรับยอด" window opened from the 4.1 register (2026-10-12) */
 const onOpen=(id,fn)=>{const m=$i(id);if(!m)return;let was=m.classList.contains('on');
  new MutationObserver(()=>{const on=m.classList.contains('on');if(on&&!was)fn(m);was=on;}).observe(m,{attributes:true,attributeFilter:['class']});};
 const shrink=(file,max,q)=>new Promise((ok,bad)=>{if(!file||!/^image\//.test(file.type))return bad(new Error('type'));
  const rd=new FileReader();rd.onerror=bad;rd.onload=()=>{const img=new Image();img.onerror=bad;img.onload=()=>{
   const s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
   c.getContext('2d').drawImage(img,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',q));};img.src=rd.result;};rd.readAsDataURL(file);});
 /* a drop area: tap = choose a file, or drag a picture onto it */
 const dropZone=(title,sub,onFile)=>{const z=document.createElement('label');z.className='pkg-drop';
  z.innerHTML=`<input type="file" accept="image/*" hidden><span class="pkg-drop-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg></span><b></b><small></small>`;
  z.querySelector('b').textContent=title;z.querySelector('small').textContent=sub;
  const inp=z.querySelector('input');inp.addEventListener('change',()=>{if(inp.files[0])onFile(inp.files[0],inp);});
  ['dragenter','dragover'].forEach(t=>z.addEventListener(t,e=>{e.preventDefault();z.classList.add('over');}));
  ['dragleave','drop'].forEach(t=>z.addEventListener(t,e=>{e.preventDefault();z.classList.remove('over');}));
  z.addEventListener('drop',e=>{const f=e.dataTransfer&&e.dataTransfer.files[0];if(f)onFile(f,inp);});
  return z;};

 function run(){
  WIDE.forEach(id=>$i(id)?.classList.add('pkg-wide'));
  MIDDLE.forEach(id=>$i(id)?.classList.add('center','pkg-mid'));

  /* ---------- 12 · vendor payment: attach a slip ---------- */
  const PG=$i('mPayGR');
  if(PG&&!PG.querySelector('.pkg-slip')){let slip='';
   const body=PG.querySelector('.body');
   /* two columns on a wide screen: payment fields left, slip right */
   const left=document.createElement('div');left.className='pkg-pg-l';while(body.firstChild)left.appendChild(body.firstChild);
   const right=document.createElement('div');right.className='pkg-pg-r pkg-slip';
   right.innerHTML='<div class="pkg-slip-t">แนบสลิป / หลักฐานการจ่าย <span class="hint">(ถ้ามี)</span></div><div class="pkg-slip-prev"></div><div class="hint pkg-slip-note">รูปจะเก็บไว้กับการจ่ายเงินใบนี้ · เปิดดูได้จากใบรับสินค้า</div>';
   const prev=right.querySelector('.pkg-slip-prev');
   const paint=()=>{prev.innerHTML=slip?`<img src="${slip}" alt="สลิป"><button type="button" class="btn sm gh" data-slip="x">เอารูปออก</button>`:'';prev.hidden=!slip;zone.hidden=!!slip;};
   const zone=dropZone('เลือกรูปสลิป','แตะเพื่อเลือกรูป หรือลากรูปมาวางที่นี่',async(f,inp)=>{
    try{slip=await shrink(f,1100,.78);}catch(e){toast('เลือกไฟล์รูปภาพเท่านั้น');}inp.value='';paint();});
   right.insertBefore(zone,prev);
   prev.addEventListener('click',e=>{if(e.target.closest('[data-slip="x"]')){slip='';paint();}});
   body.append(left,right);body.classList.add('pkg-pg-body');
   onOpen('mPayGR',()=>{slip='';paint();});paint();
   if(typeof doPayGR==='function'){const o=doPayGR;
    doPayGR=window.doPayGR=async function(){const p=(DB.purchases||[]).find(x=>x.id===payGRCtx);const before=p&&p.paid;
     const r=await o.apply(this,arguments);
     if(p&&p.paid&&!before&&slip){p.paySlip=slip;if(typeof logAudit==='function')logAudit('gr',p,'pay','แนบสลิปการจ่ายเงิน');save();slip='';}
     return r;};}
  }
  /* the GR window shows the slip of a paid document */
  if(typeof fillGRForm==='function'&&!fillGRForm.__pkgSlip){const o=fillGRForm;
   fillGRForm=window.fillGRForm=function(){const r=o.apply(this,arguments);try{slipBtn();}catch(e){}return r;};fillGRForm.__pkgSlip=1;}
  function slipBtn(){const paid=$i('grPaid');if(!paid)return;const host=paid.closest('label,.f')||paid.parentElement;
   let b=$i('pkgGrSlip');if(!b){b=document.createElement('button');b.type='button';b.id='pkgGrSlip';b.className='btn sm pkg-slip-open';b.innerHTML='<i class="pkg-ic pkg-ic-clip" aria-hidden="true"></i>ดูสลิปการจ่าย';
    b.onclick=()=>{const g=typeof G!=='undefined'&&G;const p=g&&(DB.purchases||[]).find(x=>x.id===g.id);if(p&&p.paySlip)showPic('สลิปการจ่ายเงิน · '+(p.no||''),p.paySlip);};
    host.insertAdjacentElement('afterend',b);}
   const g=typeof G!=='undefined'&&G;const p=g&&(DB.purchases||[]).find(x=>x.id===g.id);b.hidden=!(p&&p.paid&&p.paySlip);}
  function showPic(title,src){let v=$i('pkgPicView');
   if(!v){v=document.createElement('div');v.className='modal center pkg-mid';v.id='pkgPicView';
    v.innerHTML='<div class="sheet"><header><h2></h2><div class="spacer"></div><button type="button" class="btn sm gh" data-x>✕ ปิด</button></header><div class="body"><img alt=""></div></div>';
    v.addEventListener('click',e=>{if(e.target===v||e.target.closest('[data-x]'))closeModal('pkgPicView');});
    (document.getElementById('pkg-app')||document.body).append(v);}
   v.querySelector('h2').textContent=title;v.querySelector('img').src=src;openModal('pkgPicView');}

  /* ---------- 14 · product picture: own upload area, bigger picture ---------- */
  const IM=$i('mImg'),file=$i('imgFile');
  if(IM&&file&&!IM.querySelector('.pkg-drop')){
   /* the same steps as the original onImgPick, but kept at 900 px (was 500) so the bigger window shows it sharp */
   const pick=async f=>{let url;try{url=await shrink(f,900,.82);}catch(e){return toast('เลือกไฟล์รูปภาพเท่านั้น');}
    const it=(DB.stock||[]).find(x=>x.id===imgStockId);if(!it)return;it.img=url;save();
    ['renderStock','refreshOpenDocStockViews','syncStockDetailImg'].forEach(k=>{try{if(typeof window[k]==='function')window[k]();}catch(e){}});
    $i('imgPreviewWrap').innerHTML=`<img src="${url}" style="max-width:100%;border-radius:8px">`;$i('imgDelBtn').style.display='';toast('บันทึกรูปสินค้าแล้ว');file.value='';};
   const zone=dropZone('อัปโหลดรูปใหม่ / เปลี่ยนรูป','แตะเพื่อเลือกรูป หรือลากรูปมาวางที่นี่',f=>pick(f));
   zone.querySelector('input').remove();zone.prepend(file);file.hidden=true;file.removeAttribute('onchange');
   file.addEventListener('change',()=>{if(file.files[0])pick(file.files[0]);});
   const up=document.createElement('div');up.className='pkg-img-up';up.innerHTML='<div class="pkg-slip-t">อัปโหลดรูป</div>';up.append(zone);
   const del=$i('imgDelBtn');if(del){const d=document.createElement('div');d.className='pkg-img-del';d.append(del);up.append(d);}
   up.insertAdjacentHTML('beforeend','<div class="hint">รูปจะย่อให้อัตโนมัติก่อนเก็บ · ใช้ได้ทั้งรูปจากมือถือและกล้อง</div>');
   const body=IM.querySelector('.body'),pw=$i('imgPreviewWrap');
   const view=document.createElement('div');view.className='pkg-img-view';view.append(pw);
   body.classList.add('pkg-img-body');body.append(view,up);
  }

  /* ---------- 3 · 4.4 "บันทึกข้อมูลสำเร็จ": a drawn ring + tick with a soft ripple ---------- */
  const SD=$i('mSaleDone'),tk=SD&&SD.querySelector('.pkg-sa-tick');
  if(tk&&!tk.querySelector('svg')){tk.classList.add('pkg-done-anim');
   tk.innerHTML='<svg viewBox="0 0 100 100"><circle class="r" cx="50" cy="50" r="44"/><path class="t" d="M30 52 L44 66 L71 37"/></svg><i></i><i></i>';
   onOpen('mSaleDone',()=>{tk.classList.remove('play');void tk.offsetWidth;tk.classList.add('play');});}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
 /* windows that other modules build a little later (4.4 sale done) */
 setTimeout(run,0);setTimeout(run,800);
})();
