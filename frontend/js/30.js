/* 03 ใบเสนอราคา — “ฉบับแก้ไข” (user 2026-10-03, like the reference ERP): a quote that is approved or not approved is
   locked (pkgQLock); changing it makes a revision: a new draft numbered <original>-R1, -R2 … that carries every line,
   goes through approval again and, once saved, closes the version it came from ("แก้ไขเป็น …", still viewable,
   can't be billed or cut). A version with an active stock-cut (4.5) or billing document can't be revised until those are
   cancelled. Draft / waiting-for-approval quotes are still edited in place. "คัดลอกใบนี้" and "ยกเลิกใบเสนอราคา" stay
   separate buttons. The quote window lists every version of the chain under the toolbar. */
(()=>{
 const tools=document.getElementById('pkg-quote-tools');if(!tools||typeof saveQuote!=='function')return;
 const getQ=()=>{try{return (0,eval)('Q');}catch(e){return null;}};
 const SC=()=>window.PKG_STOCK_CUT;
 const rootOf=q=>q&&q.revRoot?findQuote(q.revRoot)||q:q;
 const chain=q=>{const r=rootOf(q);if(!r||!r.no)return [];return DB.quotes.filter(x=>x.id===r.id||x.revRoot===r.id).sort((a,b)=>n(a.revN)-n(b.revN));};
 function nextNo(root){
  let k=chain(root).reduce((m,x)=>Math.max(m,n(x.revN)),0)+1;
  while(docNoTaken(root.no+'-R'+k))k++;
  return {no:root.no+'-R'+k,k};
 }
 /* toolbar: the button sits after "คัดลอกใบนี้" */
 const grid=tools.querySelector('.pkg-tool-grid'),copyB=grid&&grid.querySelector('[data-t="copy"]');
 const btn=document.createElement('button');btn.type='button';btn.className='btn pkg-tool pkg-tool-rev pc-docQuote';btn.textContent='ฉบับแก้ไข';btn.title='ทำฉบับแก้ไขของใบนี้ (เลขเดิม + R1, R2 …) แล้วส่งขออนุมัติใหม่';
 if(copyB)copyB.after(btn);else grid&&grid.append(btn);
 const fs=document.createElement('fieldset');fs.className='pkg-fs pkg-rev-fs';fs.hidden=true;
 fs.innerHTML='<legend>เอกสารฉบับแก้ไข</legend><div class="scroll"><table class="tbl pkg-rev-tbl"><thead><tr><th class="ctr" style="width:60px">ลำดับ</th><th class="ctr" style="width:150px">วันที่สร้างข้อมูล</th><th style="width:190px">เลขที่เอกสาร</th><th>ชื่อลูกค้า</th><th class="num" style="width:120px">ราคาสุทธิ</th><th style="width:130px">ผู้บันทึก</th><th style="width:190px">แก้ไขจาก</th><th class="ctr" style="width:130px">สถานะ</th></tr></thead><tbody></tbody></table></div>';
 tools.append(fs);
 const stateChip=x=>x.superseded?'<span class="chip">แก้ไขเป็นฉบับใหม่</span>':x.cancelled?'<span class="chip r">ยกเลิกแล้ว</span>'
  :x.deducted?'<span class="chip b">ตัดสต๊อกแล้ว</span>':({approved:'<span class="chip g">อนุมัติแล้ว</span>',rejected:'<span class="chip r">ไม่อนุมัติ</span>',pending:'<span class="chip a">รออนุมัติ</span>'}[apvOf(x).status]||'<span class="chip">ร่าง</span>');
 function sync(){
  const q=getQ();if(!q)return;
  const saved=q.no&&DB.quotes.some(x=>x.id===q.id),st=apvOf(q).status;
  btn.hidden=!(saved&&!q.cancelled&&!q.superseded&&(st==='approved'||st==='rejected'));
  const list=saved?chain(q):(q.revRoot?chain(findQuote(q.revRoot)):[]);
  fs.hidden=list.length<2&&!q.revOf;
  fs.querySelector('tbody').innerHTML=list.map((x,i)=>`<tr${x.id===q.id?' class="pkg-rev-cur"':''}><td class="ctr">${i+1}</td><td class="ctr">${x.createdAt?thDateTime(x.createdAt):thDate(x.date)}</td>
   <td class="mono">${x.id===q.id?'<b>'+esc(x.no)+'</b>':`<span class="docno" data-rev-open="${x.id}">${esc(x.no)}</span>`}</td><td>${esc(custName(findCust(x.custId))||'-')}</td>
   <td class="num">${money(quoteTotals(x).total)}</td><td>${esc(byShort(x)||'-')}</td><td class="mono">${esc(x.revOfNo||'-')}</td><td class="ctr">${stateChip(x)}</td></tr>`).join('')
   +(!saved&&q.revOf?`<tr class="pkg-rev-cur"><td class="ctr">${list.length+1}</td><td class="ctr hint">ยังไม่บันทึก</td><td class="mono"><b>${esc(q.previewNo||'')}</b></td><td>${esc(custName(findCust(q.custId))||'-')}</td><td class="num">${money(quoteTotals(q).total)}</td><td></td><td class="mono">${esc(q.revOfNo||'-')}</td><td class="ctr"><span class="chip">ร่าง</span></td></tr>`:'');
  const no=document.getElementById('qNo');if(no&&!q.no&&q.revOfNo&&!no.textContent.includes('ฉบับแก้ไขจาก'))no.textContent+=' · ฉบับแก้ไขจาก '+q.revOfNo;
 }
 fs.addEventListener('click',e=>{const o=e.target.closest('[data-rev-open]');if(o)openQuoteById(o.dataset.revOpen);});
 async function revise(){
  const w=getQ();if(!w||!w.no)return;const q=findQuote(w.id);if(!q)return;
  if(typeof pkgQuoteDirty==='function'&&pkgQuoteDirty())return toast('ใบเสนอราคามีการแก้ไขที่ยังไม่บันทึก — กดบันทึกก่อน');
  if(q.cancelled)return toast('ใบนี้ถูกยกเลิกแล้ว — ใช้ “คัดลอกใบนี้” เปิดเป็นใบใหม่');
  if(q.superseded)return toast('ใบนี้ถูกแก้ไขเป็น '+(q.revisedTo||'ฉบับใหม่')+' แล้ว — เปิดฉบับล่าสุดเพื่อแก้ต่อ');
  const st=apvOf(q).status;
  if(st!=='approved'&&st!=='rejected')return toast('ใบนี้ยังไม่ได้อนุมัติ แก้ไขรายการในใบนี้ได้เลย ไม่ต้องทำฉบับแก้ไข');
  const cut=SC()&&SC().activeCut(q);
  if(cut)return toast('ใบนี้ตัดสต๊อกแล้ว (ใบตัดสต๊อก '+cut.no+') — ยกเลิกใบตัดสต๊อกที่ 4.5 ก่อน (ของคืนเข้าสต๊อก) แล้วจึงทำฉบับแก้ไข');
  const b=SC()?SC().activeBills(q):[];
  if(b.length)return toast('ใบนี้ออก '+b.map(x=>x.label+' '+x.no).join(', ')+' แล้ว — ยกเลิกเอกสารเก็บเงินก่อน แล้วจึงทำฉบับแก้ไข');
  if(typeof pkgPermNeed==='function'&&!pkgPermNeed('quote','add'))return;
  if(!can('doc.docQuote'))return toast('บัญชีนี้ไม่มีสิทธิออกใบเสนอราคา');
  const root=rootOf(q),nx=nextNo(root);
  if(!await askP({title:'ทำฉบับแก้ไข '+nx.no,
   msg:'สร้าง <b>'+esc(nx.no)+'</b> จาก '+esc(q.no)+' หรือไม่?'
    +'<br><br>· รายการเดิมทั้งหมดติดมาให้ แก้ไข / เพิ่ม / ลดได้'
    +'<br>· ฉบับใหม่เริ่มที่ <b>ร่าง</b> ต้องส่งขออนุมัติใหม่'
    +'<br>· เมื่อบันทึกฉบับใหม่ ใบ '+esc(q.no)+' จะปิดเป็น “แก้ไขเป็น '+esc(nx.no)+'” (ยังเปิดดูได้ แต่ออกเอกสารต่อไม่ได้)'
    +'<br>· ถ้าปิดหน้าต่างโดยไม่บันทึก ใบเดิมจะไม่ถูกแตะต้อง',
   yes:'ทำฉบับแก้ไข',no:'ยกเลิก'}))return;
  const c=JSON.parse(JSON.stringify(q));
  ['createdBy','createdByName','createdAt','updatedBy','updatedByName','updatedAt','copiedFrom','superseded','revisedTo','revisedToId','stockCutId','cancelReason','cancelDate'].forEach(k=>delete c[k]);
  Object.assign(c,{id:uid(),no:'',previewNo:nx.no,date:iso(),status:'ร่าง',deducted:false,cancelled:false,
   apv:{status:'draft',byName:'',date:'',note:''},revOf:q.id,revOfNo:q.no,revRoot:root.id,revN:nx.k});
  Q=c;Q.finds=normFinds(Q.finds);Q.items=Q.items||[];padQLines();fillQuoteForm();
  toast('เปิดฉบับแก้ไข '+nx.no+' แล้ว — แก้รายการ แล้วบันทึก / ส่งขออนุมัติ');
 }
 btn.addEventListener('click',revise);
 /* saving a revision: its number is fixed here (not the QO sequence); the version it came from closes */
 const saveO=saveQuote;
 saveQuote=function(){
  const w=getQ();let set=false;
  if(w&&w.revOf&&!w.no){const root=rootOf(findQuote(w.revRoot)||findQuote(w.revOf));if(root&&root.no){const nx=nextNo(root);w.no=nx.no;w.revN=nx.k;w.previewNo=nx.no;set=true;}}
  const done=out=>{
   if(!set)return out;
   const saved=DB.quotes.find(x=>x.id===w.id&&x.no);
   if(!saved){w.previewNo=w.no;w.no='';return out;}
   const old=findQuote(w.revOf);
   if(old&&!old.superseded){old.superseded=true;old.revisedTo=saved.no;old.revisedToId=saved.id;old.status='แก้ไขเป็น '+saved.no;
    logAudit('quote',old,'revise','แก้ไขเป็นฉบับ '+saved.no);logAudit('quote',saved,'revise','ฉบับแก้ไขจาก '+old.no);save();
    if(typeof renderQuoteOverview==='function')renderQuoteOverview();}
   sync();return out;
  };
  const out=saveO.apply(this,arguments);
  return out&&typeof out.then==='function'?out.then(done):done(out);
 };
 /* "คัดลอกใบนี้" makes an independent quote: drop the revision links it copied */
 const fillO=fillQuoteForm;
 fillQuoteForm=function(){
  const w=getQ();
  if(w&&!w.no&&w.copiedFrom)['revOf','revOfNo','revRoot','revN','superseded','revisedTo','revisedToId','stockCutId'].forEach(k=>delete w[k]);
  const out=fillO.apply(this,arguments);sync();return out;
 };
 /* after approve / reject / cancel the lock changes: redraw the lines and findings so the edit boxes go away at once */
 const relock=()=>{sync();const q=getQ();if(q&&document.getElementById('mQuoteEdit')?.classList.contains('on')){['renderQItems','renderFinds'].forEach(f=>{if(typeof window[f]==='function')try{window[f]();}catch(e){}});}};
 ['approveDoc','rejectDoc','sendApv','cancelQuoteDoc','approveQuote'].forEach(name=>{const o=window[name];if(typeof o!=='function')return;
  window[name]=function(){const r=o.apply(this,arguments);if(r&&typeof r.then==='function')r.then(relock);else relock();return r;};});
 window.PKG_QUOTE_REVISION={chain,rootOf,nextNo,revise,sync};
})();
